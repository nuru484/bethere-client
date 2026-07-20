// src/components/landing/LandingFooter.jsx
import { useTheme } from "@/context/ThemeContext";
import { dotsLight, dotsDark } from "./texture";
import { PillLink } from "./LandingButtons";

export function LandingFooter() {
  const { resolvedTheme } = useTheme();
  const dots = resolvedTheme === "dark" ? dotsDark : dotsLight;

  return (
    <footer className="mx-2 my-2 sm:mx-3 sm:my-3">
      <div
        className="relative overflow-hidden rounded-[24px] bg-[var(--lp-bg)] sm:rounded-[28px]"
        style={dots}
      >
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-28 w-16 rounded-br-[24px] bg-[var(--lp-tint)] sm:h-36 sm:w-20"
        />

        <div className="mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-end px-5 pb-12 pt-32 sm:px-10 sm:pb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-display text-[15vw] font-normal leading-[0.92] tracking-[-0.05em] text-[var(--lp-ink)] sm:text-[10vw] lg:text-[7rem]">
              See it in
              <br />
              action
            </h2>
            <PillLink to="/login" className="self-start lg:self-auto">
              Sign in to explore
            </PillLink>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-5 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-body text-sm text-[var(--lp-muted)]">
          Designed &amp; built by{" "}
          <a
            href="https://manuru.dev"
            target="_blank"
            rel="noreferrer"
            className="lp-link font-semibold text-[var(--lp-ink)]"
          >
            Nurudeen Abdul-Majeed
          </a>
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://manuru.dev"
            target="_blank"
            rel="noreferrer"
            className="lp-link font-body text-sm text-[var(--lp-ink)]"
          >
            manuru.dev
          </a>
          <a
            href="https://github.com/nuru484"
            target="_blank"
            rel="noreferrer"
            className="lp-link font-body text-sm text-[var(--lp-ink)]"
          >
            GitHub
          </a>
          <a
            href="mailto:abdulmajeednurudeen48@gmail.com"
            className="lp-link font-body text-sm text-[var(--lp-ink)]"
          >
            Email
          </a>
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[var(--lp-faint)]">
          BT-2026 / full-stack build
        </p>
      </div>
    </footer>
  );
}
