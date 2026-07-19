// src/components/landing/LandingNav.jsx
import { Link } from "react-router-dom";
import { PillLink, ChipLink } from "./LandingButtons";

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Main"
        className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
      >
        <Link
          to="/"
          aria-label="BeThere home"
          className="flex size-11 items-center justify-center rounded-xl bg-[#2b2b2b] font-mono text-base font-bold text-[#fafafa] shadow-sm transition-transform hover:scale-105"
        >
          B/
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ChipLink
            href="#how"
            className="hidden bg-[#f1f1f1]/90 backdrop-blur-sm sm:inline-flex"
          >
            How it works
          </ChipLink>
          <PillLink to="/login">Sign in</PillLink>
        </div>
      </nav>
    </header>
  );
}
