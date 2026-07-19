// src/components/landing/LandingFooter.jsx
import { dotsLight } from "./texture";
import { PillLink } from "./LandingButtons";

export function LandingFooter() {
  return (
    <footer className="mx-2 my-2 sm:mx-3 sm:my-3">
      <div
        className="relative overflow-hidden rounded-[24px] bg-[#e9e9e9] sm:rounded-[28px]"
        style={dotsLight}
      >
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-28 w-16 rounded-br-[24px] bg-[#b9edd4] sm:h-36 sm:w-20"
        />

        <div className="mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-end px-5 pb-12 pt-32 sm:px-10 sm:pb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-display text-[15vw] font-normal leading-[0.92] tracking-[-0.05em] text-[#2b2b2b] sm:text-[10vw] lg:text-[7rem]">
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
        <p className="font-body text-sm text-[#656565]">
          Designed &amp; built by{" "}
          <a
            href="https://manuru.dev"
            target="_blank"
            rel="noreferrer"
            className="lp-link font-semibold text-[#2b2b2b]"
          >
            Nurudeen Abdul-Majeed
          </a>
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://manuru.dev"
            target="_blank"
            rel="noreferrer"
            className="lp-link font-body text-sm text-[#2b2b2b]"
          >
            manuru.dev
          </a>
          <a
            href="https://github.com/nuru484"
            target="_blank"
            rel="noreferrer"
            className="lp-link font-body text-sm text-[#2b2b2b]"
          >
            GitHub
          </a>
          <a
            href="mailto:abdulmajeednurudeen48@gmail.com"
            className="lp-link font-body text-sm text-[#2b2b2b]"
          >
            Email
          </a>
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
          BT-2026 / full-stack build
        </p>
      </div>
    </footer>
  );
}
