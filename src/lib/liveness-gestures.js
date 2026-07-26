// src/lib/liveness-gestures.js
//
// Pure gesture logic for the guided liveness capture: no camera, no React,
// no MediaPipe imports - just numbers in, decisions out - so the whole
// sequencing/threshold behavior is unit-testable.
//
// The flow it models: the server issues an ordered action challenge
// (e.g. [SMILE, TURN_LEFT, BLINK]); the client detects each gesture locally,
// captures the frames that PROVE it at that moment, and finally uploads one
// ordered burst. The server re-proves everything from the raw frames
// (src/services/liveness/evaluate.js server-side), so these thresholds only
// gate CAPTURE quality - they are deliberately a bit stricter than the
// server's so that what passes here almost always passes there.
//
// Server contract the capture plan must satisfy (batch flow):
//  - 6..16 frames, in capture order; actions proven at monotonically
//    increasing frame indexes in challenge order.
//  - BLINK needs a closed-eye frame then a later reopened frame.
//  - TURN needs one frame with enough yaw; when the challenge holds TWO
//    turns, the burst must contain both yaw signs (the server does not bind
//    LEFT/RIGHT labels to signs - front cameras mirror - it only requires
//    the reversal).
//  - A neutral lead-in helps the server's per-burst blink baseline and
//    identity continuity.

export const THRESHOLDS = {
  // Face framing gates (landmarks are normalized, so width is a fraction).
  MIN_FACE_RATIO: 0.16,
  // Neutral pose: near-frontal, eyes open, no smile.
  NEUTRAL_MAX_YAW: 8,
  NEUTRAL_MAX_SMILE: 0.35,
  NEUTRAL_MAX_BLINK: 0.3,
  // Smile: mean of mouthSmileLeft/Right blendshapes.
  SMILE_ON: 0.45,
  // Blink: BOTH eyes closed (min of the two blink blendshapes), then both
  // clearly open again.
  BLINK_CLOSED: 0.5,
  BLINK_REOPENED: 0.25,
  // Head turn, in the same nose-asymmetry proxy degrees the server uses.
  // Server accepts |yaw| >= 9; requiring more here gives capture margin.
  TURN_MIN_YAW: 13,
  // Beyond this the face is close to profile and the server's detector may
  // drop the frame entirely - ask the user to come back a little.
  TURN_MAX_YAW: 42,
};

export const CAPTURE_PLAN = {
  NEUTRAL_FRAMES: 2,
  SMILE_FRAMES: 3,
  BLINK_CLOSED_FRAMES: 1,
  BLINK_OPEN_FRAMES: 2,
  TURN_FRAMES: 3,
  // Minimum spacing between captured frames of the same phase, so the burst
  // shows real motion instead of near-duplicates.
  CAPTURE_SPACING_MS: 160,
  // Consecutive qualifying samples required before a held gesture starts
  // capturing (debounce against single-frame detector noise). Blink closure
  // is a ~100ms transient and is exempt - it must capture on first sight.
  HOLD_SAMPLES: 2,
};

/** Phases a guided session moves through. */
export const PHASE = {
  PRIME: "PRIME", // neutral lead-in captures
  ACTION: "ACTION", // capturing the current challenged action
  RECENTER: "RECENTER", // return to neutral between actions
  DONE: "DONE",
};

/** Hint codes for the UI (mapped to copy in the component). */
export const HINT = {
  NO_FACE: "NO_FACE",
  MANY_FACES: "MANY_FACES",
  TOO_SMALL: "TOO_SMALL",
  HOLD_NEUTRAL: "HOLD_NEUTRAL",
  RETURN_CENTER: "RETURN_CENTER",
  DO_ACTION: "DO_ACTION",
  TURN_MORE: "TURN_MORE",
  TURN_LESS: "TURN_LESS",
  TURN_OTHER_WAY: "TURN_OTHER_WAY",
  OPEN_EYES: "OPEN_EYES",
};

const NOSE_TIP_INDEX = 1;

const blendshapeScores = (result) => {
  const categories = result?.faceBlendshapes?.[0]?.categories;
  if (!categories) return null;
  const byName = {};
  for (const c of categories) byName[c.categoryName] = c.score;
  return byName;
};

/**
 * Reduce one FaceLandmarker VIDEO result to the signals the session needs:
 * { faceCount, faceRatio, yaw, smile, blink, maxBlink }.
 *
 * `yaw` is the same nose-offset asymmetry proxy the server's estimateYaw
 * uses (in "proxy degrees", signed), computed from the landmark bounding box
 * and the nose tip - NOT a true head-pose angle. Keeping both ends on the
 * same proxy keeps the client gate aligned with the server bar.
 */
export const extractSignals = (result) => {
  const faces = result?.faceLandmarks ?? [];
  if (faces.length === 0) return { faceCount: 0 };
  if (faces.length > 1) return { faceCount: faces.length };

  const landmarks = faces[0];
  let minX = Infinity;
  let maxX = -Infinity;
  for (const point of landmarks) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
  }
  const width = maxX - minX;
  const nose = landmarks[NOSE_TIP_INDEX];
  const yaw =
    width > 0 && nose
      ? (((maxX - nose.x) - (nose.x - minX)) / width) * 90
      : 0;

  const shapes = blendshapeScores(result) ?? {};
  const smile =
    ((shapes.mouthSmileLeft ?? 0) + (shapes.mouthSmileRight ?? 0)) / 2;
  const blinkLeft = shapes.eyeBlinkLeft ?? 0;
  const blinkRight = shapes.eyeBlinkRight ?? 0;

  return {
    faceCount: 1,
    faceRatio: width,
    yaw,
    smile,
    // Both eyes must be closed for a blink: the weaker eye decides.
    blink: Math.min(blinkLeft, blinkRight),
    // Highest per-eye closure score: any eye still shut keeps this high, so
    // the "reopened" call waits for BOTH eyes to be open.
    maxBlink: Math.max(blinkLeft, blinkRight),
  };
};

const isNeutral = (s, t) =>
  Math.abs(s.yaw) <= t.NEUTRAL_MAX_YAW &&
  s.smile <= t.NEUTRAL_MAX_SMILE &&
  s.maxBlink <= t.NEUTRAL_MAX_BLINK;

const framingHint = (s, t) => {
  if (!s || s.faceCount === 0) return HINT.NO_FACE;
  if (s.faceCount > 1) return HINT.MANY_FACES;
  if (s.faceRatio < t.MIN_FACE_RATIO) return HINT.TOO_SMALL;
  return null;
};

/**
 * Stateful (but side-effect-free) guided capture session over an ordered
 * action list. Call `step(signals, nowMs)` per detector sample; it returns
 *   { capture, done, phase, actionIndex, hint }
 * where `capture: true` means "grab a JPEG of this video frame NOW". The
 * caller owns the actual pixel capture and the collected blob order.
 */
export const createGuidedSession = (
  actions,
  { thresholds = THRESHOLDS, plan = CAPTURE_PLAN } = {}
) => {
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new Error("createGuidedSession requires a non-empty action list");
  }

  const state = {
    phase: PHASE.PRIME,
    actionIndex: -1,
    phaseCaptures: 0,
    lastCaptureAt: -Infinity,
    holdCount: 0,
    // BLINK sub-state: "CLOSING" until the closed frame lands, then "OPENING".
    blinkStage: "CLOSING",
    // Sign of the first completed turn; a later turn must reverse it.
    firstTurnSign: null,
    // Sign locked for the CURRENT turn once its first frame is captured, so
    // one turn's frames cannot mix directions.
    currentTurnSign: null,
    capturedTotal: 0,
    completedActions: actions.map(() => false),
  };

  const currentAction = () => actions[state.actionIndex];

  const spacedCaptureReady = (nowMs) =>
    nowMs - state.lastCaptureAt >= plan.CAPTURE_SPACING_MS;

  const capture = (nowMs) => {
    state.lastCaptureAt = nowMs;
    state.phaseCaptures += 1;
    state.capturedTotal += 1;
  };

  const enterAction = (index) => {
    state.actionIndex = index;
    state.phase = index >= actions.length ? PHASE.DONE : PHASE.ACTION;
    state.phaseCaptures = 0;
    state.holdCount = 0;
    state.blinkStage = "CLOSING";
    state.currentTurnSign = null;
  };

  const completeAction = () => {
    state.completedActions[state.actionIndex] = true;
    const action = currentAction();
    if (action === "TURN_LEFT" || action === "TURN_RIGHT") {
      if (state.firstTurnSign === null)
        state.firstTurnSign = state.currentTurnSign;
    }
    if (state.actionIndex + 1 >= actions.length) {
      state.phase = PHASE.DONE;
    } else {
      state.phase = PHASE.RECENTER;
      state.holdCount = 0;
    }
  };

  const result = (capture, hint) => ({
    capture,
    done: state.phase === PHASE.DONE,
    phase: state.phase,
    actionIndex: state.actionIndex,
    hint,
  });

  const stepTurn = (signals, nowMs) => {
    const magnitude = Math.abs(signals.yaw);
    const sign = Math.sign(signals.yaw) || 0;

    if (magnitude < thresholds.TURN_MIN_YAW) {
      state.holdCount = 0;
      return result(false, HINT.TURN_MORE);
    }
    if (magnitude > thresholds.TURN_MAX_YAW) {
      state.holdCount = 0;
      return result(false, HINT.TURN_LESS);
    }
    // A second challenged turn must reverse the first one's direction - the
    // server proves the reversal across the burst, not the labels.
    if (state.firstTurnSign !== null && sign === state.firstTurnSign) {
      state.holdCount = 0;
      return result(false, HINT.TURN_OTHER_WAY);
    }
    // All frames of ONE turn must agree in direction.
    if (state.currentTurnSign !== null && sign !== state.currentTurnSign) {
      return result(false, HINT.DO_ACTION);
    }

    state.holdCount += 1;
    if (state.holdCount < plan.HOLD_SAMPLES) return result(false, HINT.DO_ACTION);

    if (!spacedCaptureReady(nowMs)) return result(false, HINT.DO_ACTION);
    if (state.currentTurnSign === null) state.currentTurnSign = sign;
    capture(nowMs);
    if (state.phaseCaptures >= plan.TURN_FRAMES) completeAction();
    return result(true, HINT.DO_ACTION);
  };

  const stepSmile = (signals, nowMs) => {
    if (signals.smile < thresholds.SMILE_ON) {
      state.holdCount = 0;
      return result(false, HINT.DO_ACTION);
    }
    state.holdCount += 1;
    if (state.holdCount < plan.HOLD_SAMPLES) return result(false, HINT.DO_ACTION);
    if (!spacedCaptureReady(nowMs)) return result(false, HINT.DO_ACTION);
    capture(nowMs);
    if (state.phaseCaptures >= plan.SMILE_FRAMES) completeAction();
    return result(true, HINT.DO_ACTION);
  };

  const stepBlink = (signals, nowMs) => {
    if (state.blinkStage === "CLOSING") {
      // A blink closure lasts ~100ms: capture the FIRST closed sample seen,
      // no hold debounce and no spacing gate, or it is gone.
      if (signals.blink >= thresholds.BLINK_CLOSED) {
        capture(nowMs);
        if (state.phaseCaptures >= plan.BLINK_CLOSED_FRAMES) {
          state.blinkStage = "OPENING";
          state.phaseCaptures = 0;
        }
        return result(true, HINT.OPEN_EYES);
      }
      return result(false, HINT.DO_ACTION);
    }
    // OPENING: the server needs a clearly reopened frame AFTER the closed one.
    if (signals.maxBlink > thresholds.BLINK_REOPENED) {
      return result(false, HINT.OPEN_EYES);
    }
    if (!spacedCaptureReady(nowMs)) return result(false, HINT.OPEN_EYES);
    capture(nowMs);
    if (state.phaseCaptures >= plan.BLINK_OPEN_FRAMES) completeAction();
    return result(true, HINT.OPEN_EYES);
  };

  const step = (signals, nowMs) => {
    if (state.phase === PHASE.DONE) return result(false, null);

    const framing = framingHint(signals, thresholds);
    if (framing) {
      state.holdCount = 0;
      return result(false, framing);
    }

    if (state.phase === PHASE.PRIME) {
      if (!isNeutral(signals, thresholds)) {
        state.holdCount = 0;
        return result(false, HINT.HOLD_NEUTRAL);
      }
      state.holdCount += 1;
      if (state.holdCount < plan.HOLD_SAMPLES)
        return result(false, HINT.HOLD_NEUTRAL);
      if (!spacedCaptureReady(nowMs)) return result(false, HINT.HOLD_NEUTRAL);
      capture(nowMs);
      if (state.phaseCaptures >= plan.NEUTRAL_FRAMES) enterAction(0);
      return result(true, HINT.HOLD_NEUTRAL);
    }

    if (state.phase === PHASE.RECENTER) {
      if (!isNeutral(signals, thresholds)) {
        state.holdCount = 0;
        return result(false, HINT.RETURN_CENTER);
      }
      state.holdCount += 1;
      if (state.holdCount >= plan.HOLD_SAMPLES) enterAction(state.actionIndex + 1);
      return result(false, HINT.RETURN_CENTER);
    }

    // PHASE.ACTION
    const action = currentAction();
    if (action === "SMILE") return stepSmile(signals, nowMs);
    if (action === "BLINK") return stepBlink(signals, nowMs);
    if (action === "TURN_LEFT" || action === "TURN_RIGHT")
      return stepTurn(signals, nowMs);
    // Unknown action from a newer server: fail safe by completing it with a
    // couple of neutral captures rather than dead-ending the user.
    if (!spacedCaptureReady(nowMs)) return result(false, HINT.DO_ACTION);
    capture(nowMs);
    if (state.phaseCaptures >= 2) completeAction();
    return result(true, HINT.DO_ACTION);
  };

  const snapshot = () => ({
    phase: state.phase,
    actionIndex: state.actionIndex,
    capturedTotal: state.capturedTotal,
    completedActions: [...state.completedActions],
  });

  return { step, snapshot };
};

/** Worst-case frame count for an action list under the default plan. */
export const plannedFrameCount = (actions, plan = CAPTURE_PLAN) =>
  plan.NEUTRAL_FRAMES +
  actions.reduce((sum, action) => {
    if (action === "BLINK")
      return sum + plan.BLINK_CLOSED_FRAMES + plan.BLINK_OPEN_FRAMES;
    if (action === "SMILE") return sum + plan.SMILE_FRAMES;
    return sum + plan.TURN_FRAMES;
  }, 0);
