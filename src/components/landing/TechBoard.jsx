// src/components/landing/TechBoard.jsx
import { PillLink } from "./LandingButtons";

const TECH = [
  { name: "React 18 + Vite", chips: ["SPA", "code-split routes"] },
  { name: "TanStack Query", chips: ["server cache", "silent re-auth"] },
  { name: "Tailwind + shadcn/ui", chips: ["design system"] },
  { name: "face-api.js (server)", chips: ["liveness", "encrypted templates"] },
  { name: "Express + Prisma 7", chips: ["REST API", "PostgreSQL"] },
  { name: "BullMQ + Redis", chips: ["session scheduler"] },
  { name: "Rotating venue codes", chips: ["HMAC", "on-site QR"] },
  { name: "JWT httpOnly cookies", chips: ["rotation", "2FA + OTP"] },
  { name: "Vitest", chips: ["client + server tests"] },
  { name: "Sentry + pino", chips: ["observability"] },
  { name: "Docker", chips: ["containerised API"] },
  { name: "Cloudinary", chips: ["profile media"] },
];

export function TechBoard() {
  return (
    <section
      id="stack"
      className="mx-2 mt-2 rounded-[24px] bg-[var(--lp-surface)] sm:mx-3 sm:mt-3 sm:rounded-[28px]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-5xl font-normal leading-[0.95] tracking-[-0.04em] text-[var(--lp-ink)] sm:text-6xl">
              Under the hood
            </h2>
            <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-[var(--lp-muted)]">
              Nothing here is a mock-up. Every feature above is running code,
              built end to end on this stack.
            </p>
          </div>
          <PillLink to="/login">Open the app</PillLink>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TECH.map((t) => (
            <li
              key={t.name}
              className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-card)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--lp-faint)] hover:shadow-sm"
            >
              <p className="font-body text-base font-semibold tracking-tight text-[var(--lp-ink)]">
                {t.name}
              </p>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {t.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[var(--lp-bg)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-tight text-[var(--lp-muted)]"
                  >
                    {chip}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
