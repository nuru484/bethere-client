// src/components/landing/SeeForYourself.jsx
//
// Mirrors the reference's work section: a white interactive card ("See for
// yourself") beside a dark 16px-radius quote card, with a stats board row
// underneath. The reference uses WebGL canvases; here the white card runs a
// cursor parallax over floating app fragments and the quote card carries a
// cursor-following mint glow - same feel, no canvas.
import { useRef } from "react";
import { dotsLight } from "./texture";
import { PixelGlyph } from "./PixelGlyph";

const STATS = [
  { value: "128", label: "numbers in a face descriptor" },
  { value: "0.60", label: "max match distance accepted" },
  { value: "50 m", label: "geofence radius per event" },
  { value: "3", label: "states: present, late, absent" },
];

/* Floating fragments: small real-looking pieces of the app UI. Each entry
   sets its resting spot plus a parallax depth multiplier. */
function Fragments() {
  return (
    <>
      <div
        className="lp-fragment absolute left-[8%] top-[30%] rotate-[-3deg]"
        style={{ "--depth": 18 }}
      >
        <div className="flex items-center gap-2 rounded-xl border border-[#2b2b2b]/10 bg-white px-4 py-3 shadow-sm">
          <span className="size-2 rounded-full bg-[#3ecf8e]" />
          <span className="font-body text-sm font-semibold text-[#2b2b2b]">
            Checked in
          </span>
          <span className="rounded-full bg-[#dcf5e9] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#1a7f53]">
            Present
          </span>
        </div>
      </div>

      <div
        className="lp-fragment absolute right-[10%] top-[22%] rotate-[2deg]"
        style={{ "--depth": 30 }}
      >
        <div className="rounded-xl border border-[#2b2b2b]/10 bg-white px-4 py-3 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
            Face match
          </p>
          <p className="mt-1 font-body text-sm font-semibold text-[#2b2b2b]">
            distance 0.42 <span className="text-[#3ecf8e]">&lt; 0.60</span>
          </p>
        </div>
      </div>

      <div
        className="lp-fragment absolute bottom-[26%] left-[16%] rotate-[1.5deg]"
        style={{ "--depth": 26 }}
      >
        <div className="rounded-xl border border-[#2b2b2b]/10 bg-white px-4 py-3 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
            Geofence
          </p>
          <p className="mt-1 font-body text-sm font-semibold text-[#2b2b2b]">
            18 m from center <span className="text-[#3ecf8e]">inside</span>
          </p>
        </div>
      </div>

      <div
        className="lp-fragment absolute bottom-[18%] right-[14%] rotate-[-2deg]"
        style={{ "--depth": 14 }}
      >
        <div className="w-40 rounded-xl border border-[#2b2b2b]/10 bg-white p-3 shadow-sm">
          <PixelGlyph name="bars" />
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
            Weekly report
          </p>
        </div>
      </div>
    </>
  );
}

export function SeeForYourself() {
  const leftRef = useRef(null);
  const quoteRef = useRef(null);

  const onLeftMove = (e) => {
    const el = leftRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };

  const onQuoteMove = (e) => {
    const el = quoteRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section id="proof" className="mx-2 mt-2 sm:mx-3 sm:mt-3">
      <div className="grid gap-2 sm:gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div
          ref={leftRef}
          onMouseMove={onLeftMove}
          className="lp-parallax relative min-h-[26rem] overflow-hidden rounded-2xl bg-[#fafafa] sm:min-h-[34rem]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-3 rounded-xl"
            style={dotsLight}
          />
          <h2 className="absolute left-7 top-7 z-10 font-display text-4xl font-normal leading-[0.95] tracking-[-0.04em] text-[#2b2b2b] sm:left-9 sm:top-9 sm:text-5xl">
            See for
            <br />
            yourself
          </h2>
          <Fragments />
          <p className="absolute bottom-6 left-7 font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2] sm:left-9">
            Fragments from the live app
          </p>
        </div>

        <div
          ref={quoteRef}
          onMouseMove={onQuoteMove}
          className="relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-2xl bg-[#2b2b2b] p-7 sm:min-h-[34rem] sm:p-9"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(15rem circle at var(--mx, 70%) var(--my, 30%), rgba(62, 207, 142, 0.16), transparent 70%)",
            }}
          />
          <span
            aria-hidden="true"
            className="font-display text-5xl leading-none text-[#3ecf8e]"
          >
            &ldquo;
          </span>
          <blockquote className="relative">
            <p className="font-display text-4xl font-normal leading-[1.04] tracking-[-0.03em] text-[#fafafa] sm:text-5xl">
              If you weren&apos;t there, it doesn&apos;t count.
            </p>
            <footer className="mt-8 font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
              / The whole point of BeThere
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="mt-2 rounded-2xl bg-[#fafafa] p-5 sm:mt-3 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-body text-xl font-semibold tracking-tight text-[#2b2b2b] sm:text-2xl">
            Verification, quantified
          </h3>
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
            Straight from the codebase
          </p>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="group rounded-xl bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
            >
              <dd className="font-display text-4xl font-normal tracking-[-0.02em] text-[#2b2b2b] transition-colors duration-300 group-hover:text-[#1a7f53] sm:text-5xl">
                {s.value}
              </dd>
              <dt className="mt-2 font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
