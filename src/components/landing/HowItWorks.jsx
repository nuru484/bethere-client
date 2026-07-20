// src/components/landing/HowItWorks.jsx
const STEPS = [
  {
    label: "Enrol",
    title: "One consented signature",
    desc: "With your consent, the camera builds a single 128-point face descriptor. The server keeps it encrypted at rest; the raw vector never leaves it and is never sent back.",
  },
  {
    label: "Check in",
    title: "Scan the code, prove it's you",
    desc: "Scan the venue's rotating code to prove you're there, then follow a few on-screen actions so the server can confirm a live match. Both are verified server-side from the raw frames.",
  },
  {
    label: "Track",
    title: "The record writes itself",
    desc: "Present, late and absent are computed per session. Failed attempts leave a reviewable evidence trail. Admins get dashboards and reports; attendants see their own history.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-2 mt-2 rounded-[24px] bg-[var(--lp-surface)] sm:mx-3 sm:mt-3 sm:rounded-[28px]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <h2 className="font-display text-5xl font-normal leading-[0.95] tracking-[-0.04em] text-[var(--lp-ink)] sm:text-6xl">
              How it
              <br />
              works
            </h2>
            <p className="mt-6 max-w-xs font-body text-[15px] leading-relaxed text-[var(--lp-muted)]">
              One enrolment, then every check-in is a two-factor proof of
              presence: the venue&apos;s live code and your live face.
            </p>
          </div>

          <ol className="space-y-12">
            {STEPS.map((step, i) => (
              <li key={step.label}>
                <div className="flex items-center gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--lp-chip)] font-mono text-xs font-bold text-[var(--lp-ink)]">
                    {i + 1}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-[var(--lp-border)]"
                  />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-tight text-[var(--lp-muted)]">
                    {step.label}
                  </span>
                </div>
                <h3 className="mt-5 font-body text-xl font-semibold tracking-tight text-[var(--lp-ink)] sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xl font-body text-[15px] leading-relaxed text-[var(--lp-muted)]">
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
