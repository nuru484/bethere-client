// src/lib/liveness-gestures.test.js
//
// The pure gesture engine behind the guided capture: signal extraction from
// FaceLandmarker results, and the session machine that sequences the
// server-challenged actions, decides which frames to capture, and enforces
// the server's batch contract (ordering, blink close->reopen, two-turn
// reversal, bounded frame counts).
import { describe, it, expect } from "vitest";
import {
  extractSignals,
  createGuidedSession,
  plannedFrameCount,
  THRESHOLDS,
  CAPTURE_PLAN,
  PHASE,
  HINT,
} from "@/lib/liveness-gestures";

// --- fixtures ---------------------------------------------------------------

// A face as a landmark cloud: bounding box [0.3, 0.7] wide, nose placed by
// `noseOffset` (-1 = at the left edge, 0 = centered, +1 = right edge).
const faceLandmarks = (noseOffset = 0) => {
  const minX = 0.3;
  const maxX = 0.7;
  const center = (minX + maxX) / 2;
  const nose = { x: center + (noseOffset * (maxX - minX)) / 2, y: 0.5 };
  const points = Array.from({ length: 478 }, () => ({ x: center, y: 0.5 }));
  points[0] = { x: minX, y: 0.5 };
  points[2] = { x: maxX, y: 0.5 };
  points[1] = nose; // NOSE_TIP_INDEX
  return points;
};

const detectorResult = ({
  faces = 1,
  noseOffset = 0,
  smile = 0,
  blinkLeft = 0,
  blinkRight = 0,
} = {}) => ({
  faceLandmarks: Array.from({ length: faces }, () => faceLandmarks(noseOffset)),
  faceBlendshapes:
    faces === 1
      ? [
          {
            categories: [
              { categoryName: "mouthSmileLeft", score: smile },
              { categoryName: "mouthSmileRight", score: smile },
              { categoryName: "eyeBlinkLeft", score: blinkLeft },
              { categoryName: "eyeBlinkRight", score: blinkRight },
            ],
          },
        ]
      : [],
});

// Ready-made signal frames for driving the session directly.
const NEUTRAL = { faceCount: 1, faceRatio: 0.4, yaw: 0, smile: 0, blink: 0, maxBlink: 0 };
const sig = (overrides) => ({ ...NEUTRAL, ...overrides });
const SMILING = sig({ smile: 0.8 });
const TURNED_POS = sig({ yaw: 20 });
const TURNED_NEG = sig({ yaw: -20 });
const EYES_CLOSED = sig({ blink: 0.9, maxBlink: 0.9 });

// Drives the session with the same signals until the predicate is met or the
// step budget runs out; time advances enough per step that capture spacing
// never throttles. Returns every step outcome.
const drive = (session, signals, until, maxSteps = 40) => {
  const outcomes = [];
  let now = 1000;
  for (let i = 0; i < maxSteps; i++) {
    now += CAPTURE_PLAN.CAPTURE_SPACING_MS + 40;
    const outcome = session.step(signals, now);
    outcomes.push(outcome);
    if (until(outcome)) break;
  }
  return outcomes;
};

const captures = (outcomes) => outcomes.filter((o) => o.capture).length;

// --- extractSignals ---------------------------------------------------------

describe("extractSignals", () => {
  it("reports zero and many faces without further signals", () => {
    expect(extractSignals({ faceLandmarks: [] }).faceCount).toBe(0);
    expect(extractSignals(null).faceCount).toBe(0);
    expect(extractSignals(detectorResult({ faces: 2 })).faceCount).toBe(2);
  });

  it("reads a centered face as near-zero yaw with the bbox width as face ratio", () => {
    const s = extractSignals(detectorResult());
    expect(s.faceCount).toBe(1);
    expect(Math.abs(s.yaw)).toBeLessThan(1);
    expect(s.faceRatio).toBeCloseTo(0.4, 5);
  });

  it("signs yaw by nose offset: nose toward the image-right edge is negative", () => {
    // Nose 30% of the way to the right edge -> (maxX-nose) shrinks -> negative.
    const right = extractSignals(detectorResult({ noseOffset: 0.3 }));
    const left = extractSignals(detectorResult({ noseOffset: -0.3 }));
    expect(right.yaw).toBeLessThan(-THRESHOLDS.TURN_MIN_YAW);
    expect(left.yaw).toBeGreaterThan(THRESHOLDS.TURN_MIN_YAW);
    expect(right.yaw).toBeCloseTo(-left.yaw, 5);
  });

  it("takes the weaker eye for blink and the stronger for reopen gating", () => {
    const wink = extractSignals(
      detectorResult({ blinkLeft: 0.9, blinkRight: 0.1 })
    );
    expect(wink.blink).toBeCloseTo(0.1, 5); // not a blink: one eye open
    expect(wink.maxBlink).toBeCloseTo(0.9, 5); // not reopened either
  });

  it("averages the two smile blendshapes", () => {
    const s = extractSignals(detectorResult({ smile: 0.6 }));
    expect(s.smile).toBeCloseTo(0.6, 5);
  });
});

// --- session sequencing ------------------------------------------------------

describe("createGuidedSession", () => {
  it("walks PRIME -> each action in order -> DONE and stays within the server frame bounds", () => {
    const actions = ["SMILE", "TURN_LEFT", "BLINK"];
    const session = createGuidedSession(actions);
    let total = 0;

    // Neutral lead-in.
    total += captures(
      drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION)
    );
    expect(session.snapshot().actionIndex).toBe(0);

    // SMILE captures then asks to recenter.
    total += captures(
      drive(session, SMILING, (o) => o.phase === PHASE.RECENTER)
    );
    expect(session.snapshot().completedActions[0]).toBe(true);

    // Recenter, then the turn.
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);
    total += captures(
      drive(session, TURNED_POS, (o) => o.phase === PHASE.RECENTER)
    );
    expect(session.snapshot().completedActions[1]).toBe(true);

    // Recenter, then blink: closed then reopened.
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);
    total += captures(drive(session, EYES_CLOSED, (o) => o.hint === HINT.OPEN_EYES));
    total += captures(drive(session, NEUTRAL, (o) => o.done));

    const snap = session.snapshot();
    expect(snap.phase).toBe(PHASE.DONE);
    expect(snap.completedActions).toEqual([true, true, true]);
    expect(total).toBe(snap.capturedTotal);
    // Server batch contract: 6..16 frames.
    expect(snap.capturedTotal).toBeGreaterThanOrEqual(6);
    expect(snap.capturedTotal).toBeLessThanOrEqual(16);
    expect(snap.capturedTotal).toBe(plannedFrameCount(actions));
  });

  it("captures nothing and coaches while the face is missing, doubled, or too small", () => {
    const session = createGuidedSession(["SMILE"]);

    let [outcome] = drive(session, { faceCount: 0 }, () => true, 1);
    expect(outcome).toMatchObject({ capture: false, hint: HINT.NO_FACE });

    [outcome] = drive(session, sig({ faceCount: 3 }), () => true, 1);
    expect(outcome).toMatchObject({ capture: false, hint: HINT.MANY_FACES });

    [outcome] = drive(session, sig({ faceRatio: 0.05 }), () => true, 1);
    expect(outcome).toMatchObject({ capture: false, hint: HINT.TOO_SMALL });

    expect(session.snapshot().capturedTotal).toBe(0);
  });

  it("does not start capturing an action while the user is still neutral", () => {
    const session = createGuidedSession(["SMILE"]);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);
    const before = session.snapshot().capturedTotal;

    // Straight face during the SMILE action: nothing captured.
    drive(session, NEUTRAL, () => false, 10);
    expect(session.snapshot().capturedTotal).toBe(before);
    expect(session.snapshot().completedActions[0]).toBe(false);
  });

  it("coaches turn depth: too shallow and too deep both refuse capture", () => {
    const session = createGuidedSession(["TURN_LEFT"]);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);

    let [shallow] = drive(session, sig({ yaw: 5 }), () => true, 1);
    expect(shallow).toMatchObject({ capture: false, hint: HINT.TURN_MORE });

    let [deep] = drive(session, sig({ yaw: 80 }), () => true, 1);
    expect(deep).toMatchObject({ capture: false, hint: HINT.TURN_LESS });
  });

  it("accepts either direction for a single challenged turn", () => {
    // The server does not bind LEFT/RIGHT labels to signs (mirrored
    // cameras); a single turn passes whichever way the user turns.
    const session = createGuidedSession(["TURN_LEFT"]);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);
    drive(session, TURNED_NEG, (o) => o.done);
    expect(session.snapshot().completedActions[0]).toBe(true);
  });

  it("forces the second challenged turn to reverse the first", () => {
    const session = createGuidedSession(["TURN_LEFT", "TURN_RIGHT"]);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);
    drive(session, TURNED_POS, (o) => o.phase === PHASE.RECENTER);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);

    // Same direction again: coached the other way, no captures.
    const before = session.snapshot().capturedTotal;
    const outcomes = drive(session, TURNED_POS, () => false, 6);
    expect(outcomes.every((o) => o.hint === HINT.TURN_OTHER_WAY)).toBe(true);
    expect(session.snapshot().capturedTotal).toBe(before);

    // Opposite direction completes the challenge.
    drive(session, TURNED_NEG, (o) => o.done);
    expect(session.snapshot().completedActions).toEqual([true, true]);
  });

  it("requires the blink to close and then clearly reopen, in that order", () => {
    const session = createGuidedSession(["BLINK"]);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);

    // Half-shut eyes are neither closed nor a reopen.
    const halfShut = sig({ blink: 0.4, maxBlink: 0.4 });
    drive(session, halfShut, () => false, 5);
    expect(session.snapshot().completedActions[0]).toBe(false);

    // Full closure captures immediately (a blink is a ~100ms transient).
    const closedOutcomes = drive(session, EYES_CLOSED, (o) => o.capture, 2);
    expect(closedOutcomes.at(-1).capture).toBe(true);

    // Still-droopy eyes don't count as the reopen...
    drive(session, sig({ blink: 0.1, maxBlink: 0.5 }), () => false, 5);
    expect(session.snapshot().completedActions[0]).toBe(false);

    // ...open eyes do.
    drive(session, NEUTRAL, (o) => o.done);
    expect(session.snapshot().completedActions[0]).toBe(true);
  });

  it("spaces same-phase captures in time so the burst is not near-duplicates", () => {
    const session = createGuidedSession(["SMILE"]);
    drive(session, NEUTRAL, (o) => o.phase === PHASE.ACTION);

    // Rapid-fire samples 10ms apart: after the first capture, spacing gates
    // the rest even though the smile is held the whole time.
    let now = 100000;
    let captured = 0;
    for (let i = 0; i < 20; i++) {
      now += 10;
      if (session.step(SMILING, now).capture) captured += 1;
    }
    expect(captured).toBeLessThanOrEqual(2);
  });

  it("bounds every possible 3-action challenge within the server's 6..16 frames", () => {
    const ACTIONS = ["TURN_LEFT", "TURN_RIGHT", "BLINK", "SMILE"];
    for (const skip of ACTIONS) {
      const challenge = ACTIONS.filter((a) => a !== skip);
      const planned = plannedFrameCount(challenge);
      expect(planned).toBeGreaterThanOrEqual(6);
      expect(planned).toBeLessThanOrEqual(16);
    }
  });

  it("rejects an empty action list loudly", () => {
    expect(() => createGuidedSession([])).toThrow();
  });
});
