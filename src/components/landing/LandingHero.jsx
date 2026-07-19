// src/components/landing/LandingHero.jsx
import { dotsLight } from "./texture";
import { PillLink, ChipLink } from "./LandingButtons";

const CREDENTIALS = ["128-point face match", "50 m geofence", "0 proxy check-ins"];

const STACK_ROW = ["React", "Vite", "Express", "Prisma", "PostgreSQL", "Redis"];

export function LandingHero() {
  return (
    <section
      className="mx-2 mt-2 rounded-[24px] bg-[#e9e9e9] sm:mx-3 sm:mt-3 sm:rounded-[28px]"
      style={dotsLight}
    >
      <div className="mx-auto flex min-h-[92svh] max-w-5xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-tight text-[#2b2b2b] sm:text-xs">
          {CREDENTIALS.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[#3ecf8e]"
                />
              )}
              {item}
            </span>
          ))}
        </p>

        <h1 className="mt-8 font-display text-[17vw] font-normal leading-[0.92] tracking-[-0.05em] text-[#2b2b2b] sm:text-[13vw] lg:text-[8.5rem]">
          Attendance
          <br />
          you can&apos;t fake
        </h1>

        <p className="mt-8 max-w-md font-body text-base leading-relaxed text-[#656565] sm:text-lg">
          BeThere checks the face and the place. On-device recognition plus GPS
          geofencing means a check-in only counts from the right person,
          standing in the right spot.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <PillLink to="/login">Sign in to explore</PillLink>
          <ChipLink href="#stack">See the stack</ChipLink>
        </div>

        <div className="mt-16 sm:mt-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-[#a2a2a2]">
            A full-stack portfolio build
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-body text-sm font-semibold text-[#656565] sm:text-base">
            {STACK_ROW.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
