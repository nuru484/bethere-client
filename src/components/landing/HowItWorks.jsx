// src/components/landing/HowItWorks.jsx
const STEPS = [
  {
    label: "Enrol",
    title: "Three samples, one signature",
    desc: "On first login the camera takes three face samples and averages them into a single 128-point descriptor. That vector - not a photo - is what the account keeps.",
  },
  {
    label: "Check in",
    title: "Right face, right fence, right time",
    desc: "During a session window, an attendant scans their face and shares their location. The match and the geofence are both verified before anything is written.",
  },
  {
    label: "Track",
    title: "The record writes itself",
    desc: "Present, late and absent are computed per session. Admins get dashboards, per-event breakdowns and reports; attendants see their own history.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-2 mt-2 rounded-[24px] bg-[#fafafa] sm:mx-3 sm:mt-3 sm:rounded-[28px]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <h2 className="font-display text-5xl font-normal leading-[0.95] tracking-[-0.04em] text-[#2b2b2b] sm:text-6xl">
              How it
              <br />
              works
            </h2>
            <p className="mt-6 max-w-xs font-body text-[15px] leading-relaxed text-[#656565]">
              One enrolment, then every check-in is a two-factor proof of
              presence: your face and your feet.
            </p>
          </div>

          <ol className="space-y-12">
            {STEPS.map((step, i) => (
              <li key={step.label}>
                <div className="flex items-center gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ececec] font-mono text-xs font-bold text-[#2b2b2b]">
                    {i + 1}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-[#2b2b2b]/15"
                  />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-tight text-[#656565]">
                    {step.label}
                  </span>
                </div>
                <h3 className="mt-5 font-body text-xl font-semibold tracking-tight text-[#2b2b2b] sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xl font-body text-[15px] leading-relaxed text-[#656565]">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
