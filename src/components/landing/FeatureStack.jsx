// src/components/landing/FeatureStack.jsx
//
// Mirrors the reference's card-stack mechanic: 75svh of pinned intro text
// first, then one viewport of scroll per card. All cards share one sticky
// containing block, so each new card lands ON TOP of the previous ones and
// they accumulate like a deck - they don't take turns.
// Arrival is a small top-hinged rotation driven by each card's own scroll
// progress (framer-motion), disabled for reduced motion.
import { useRef } from "react";
import PropTypes from "prop-types";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { dotsLight } from "./texture";
import { PixelGlyph } from "./PixelGlyph";

const FEATURES = [
  {
    glyph: "funnel",
    title: "Face-verified check-ins",
    desc: "face-api.js matches a live camera frame against the enrolled descriptor, right in the browser. Only the 128-number vector ever leaves the device - no photos are stored.",
  },
  {
    glyph: "diamond",
    title: "Geofenced to 50 meters",
    desc: "Every event has a location and a fence. Turf.js does the geodesic math server-side, so a check-in from the parking lot next door simply doesn't land.",
  },
  {
    glyph: "checker",
    title: "Sessions that repeat themselves",
    desc: "Recurring events generate their own sessions through a BullMQ scheduler - daily standups, weekly lectures, monthly meetings - each with its own window.",
  },
  {
    glyph: "stair",
    title: "Two roles, real guardrails",
    desc: "Admins manage events, people and reports; attendants check in and see their own history. JWT cookies with rotation, optional email 2FA, and OTP login.",
  },
  {
    glyph: "bars",
    title: "Present, late or absent",
    desc: "Statuses are computed from the session window, then rolled up into per-person and per-event dashboards, charts and exportable reports.",
  },
];

function StackCard({ feature, index }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  // 0 while the card is still below the viewport, 1 once it has docked.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.18"],
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [8, 0]);

  return (
    <div
      ref={ref}
      className="sticky mx-auto w-[min(27.5rem,calc(100vw-2rem))]"
      style={{
        top: `calc(7svh + ${index * 18}px)`,
        zIndex: 10 + index,
        // The first card waits 85svh so the intro text reads alone first;
        // every later card gets its own viewport of scroll before docking.
        marginTop: index === 0 ? "85svh" : "100svh",
      }}
    >
      <motion.article
        className="rounded-3xl border border-[#2b2b2b]/10 bg-[#fafafa] p-6 shadow-sm"
        style={
          reduceMotion ? undefined : { rotate, transformOrigin: "50% -20%" }
        }
      >
        <div
          className="overflow-hidden rounded-xl bg-[#ececec] px-10 py-8"
          style={dotsLight}
        >
          <PixelGlyph name={feature.glyph} className="mx-auto max-w-[220px]" />
        </div>
        <div className="px-2 pb-4 pt-8 text-left">
          <h3 className="font-body text-2xl font-semibold tracking-tight text-[#2b2b2b] sm:text-[1.75rem]">
            {feature.title}
          </h3>
          <p className="mt-3 max-w-[32em] font-body text-[15px] leading-relaxed text-[#656565]">
            {feature.desc}
          </p>
        </div>
      </motion.article>
    </div>
  );
}

StackCard.propTypes = {
  feature: PropTypes.shape({
    glyph: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export function FeatureStack() {
  return (
    <section id="features" aria-label="Features" className="relative pb-[20svh]">
      {/* Pinned intro: reads alone for the first ~85svh of scroll, then the
          cards arrive over it and stack up. */}
      <div className="sticky top-0 z-0 flex h-[100svh] flex-col items-center justify-center px-4 text-center">
        <h2 className="max-w-[8.5em] text-balance font-display text-5xl font-normal leading-[0.95] tracking-[-0.04em] text-[#2b2b2b] sm:text-6xl lg:text-7xl">
          Built to know who showed up.
        </h2>
        <p className="mt-8 max-w-md font-body text-base leading-relaxed text-[#656565] sm:text-lg">
          Every check-in is verified twice - the person and the place - so the
          record you report on is the record of who was really in the room.
        </p>
      </div>

      <div className="relative -mt-[100svh]">
        {FEATURES.map((f, i) => (
          <StackCard key={f.title} feature={f} index={i} />
        ))}
        {/* Dwell room so the completed stack is readable before it leaves. */}
        <div aria-hidden="true" className="h-[35svh]" />
      </div>
    </section>
  );
}
