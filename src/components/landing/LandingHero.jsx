// src/components/landing/LandingHero.jsx
import { useTheme } from "@/context/ThemeContext";
import { dotsLight, dotsDark } from "./texture";
import { PillLink, ChipLink } from "./LandingButtons";

const CREDENTIALS = ["Live face check", "Rotating venue code", "0 proxy check-ins"];

const STACK_ROW = ["React", "Vite", "Express", "Prisma", "PostgreSQL", "Redis"];

export function LandingHero() {
  const { resolvedTheme } = useTheme();
  const dots = resolvedTheme === "dark" ? dotsDark : dotsLight;

  return (
    <section
      className="mx-2 mt-2 rounded-[24px] bg-[var(--lp-bg)] sm:mx-3 sm:mt-3 sm:rounded-[28px]"
      style={dots}
    >
      <div className="mx-auto flex min-h-[92svh] max-w-5xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-tight text-[var(--lp-ink)] sm:text-xs">
          {CREDENTIALS.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[var(--lp-accent)]"
                />
              )}
              {item}
            </span>
          ))}
        </p>

        <h1 className="mt-8 font-display text-[17vw] font-normal leading-[0.92] tracking-[-0.05em] text-[var(--lp-ink)] sm:text-[13vw] lg:text-[8.5rem]">
          Verified
          <br />
          live presence
        </h1>

        <p className="mt-8 max-w-md font-body text-base leading-relaxed text-[var(--lp-muted)] sm:text-lg">
          BeThere checks the person and the place. You scan the venue&apos;s live,
          rotating code, then a real-time face check confirms it&apos;s really you,
          all verified on the server, not your phone.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <PillLink to="/login">Sign in to explore</PillLink>
          <ChipLink href="#stack">See the stack</ChipLink>
        </div>

        <div className="mt-16 sm:mt-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[var(--lp-faint)]">
            A full-stack portfolio build
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-body text-sm font-semibold text-[var(--lp-muted)] sm:text-base">
            {STACK_ROW.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
