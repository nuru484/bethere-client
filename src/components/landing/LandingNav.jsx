// src/components/landing/LandingNav.jsx
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { PillLink, ChipLink } from "./LandingButtons";

// Theme toggle styled for the landing's mono/minimal aesthetic: a square,
// bordered chip that mirrors the ChipLink outline. Kept local so it doesn't
// inherit the dashboard toggle's look.
function LandingThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex size-11 items-center justify-center rounded-lg border border-[var(--lp-border)] bg-[var(--lp-bg)] text-[var(--lp-ink)] backdrop-blur-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--lp-ink)]"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

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
          className="flex size-11 items-center justify-center rounded-xl bg-[var(--lp-ink)] font-mono text-base font-bold text-[var(--lp-surface)] shadow-sm transition-transform hover:scale-105"
        >
          B/
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ChipLink
            href="#how"
            className="hidden bg-[var(--lp-bg)] backdrop-blur-sm sm:inline-flex"
          >
            How it works
          </ChipLink>
          <LandingThemeToggle />
          <PillLink to="/login">Sign in</PillLink>
        </div>
      </nav>
    </header>
  );
}
