// src/components/landing/TechBoard.jsx
import { PillLink } from "./LandingButtons";

const TECH = [
  { name: "React 18 + Vite", chips: ["SPA", "code-split routes"] },
  { name: "TanStack Query", chips: ["server cache", "silent re-auth"] },
  { name: "Tailwind + shadcn/ui", chips: ["design system"] },
  { name: "face-api.js", chips: ["on-device", "no photo upload"] },
  { name: "Express + Prisma 7", chips: ["REST API", "PostgreSQL"] },
  { name: "BullMQ + Redis", chips: ["session scheduler"] },
  { name: "Turf.js", chips: ["geofence math"] },
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
      className="mx-2 mt-2 rounded-[24px] bg-[#fafafa] sm:mx-3 sm:mt-3 sm:rounded-[28px]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-5xl font-normal leading-[0.95] tracking-[-0.04em] text-[#2b2b2b] sm:text-6xl">
              Under the hood
            </h2>
            <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-[#656565]">
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
              className="rounded-2xl border border-[#2b2b2b]/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#2b2b2b]/30 hover:shadow-sm"
            >
              <p className="font-body text-base font-semibold tracking-tight text-[#2b2b2b]">
                {t.name}
              </p>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {t.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[#f1f1f1] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-tight text-[#656565]"
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
