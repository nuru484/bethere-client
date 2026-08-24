// src/components/legal/LegalPageShell.jsx
//
// The shared chrome for the public legal documents (/privacy-policy and
// /terms-of-service): a slim sticky header with the wordmark and theme
// toggle, the document body, and a small cross-link footer. Kept separate
// from the dashboard Layout because these pages are public and must not pull
// in auth-dependent navigation.
import { useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router";
import ThemeToggle from "@/components/ThemeToggle";

const LegalPageShell = ({ title, lastUpdated, crossLink, children }) => {
  // Land at the top of the document when navigating here mid-page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground font-mono text-sm font-bold text-background transition-transform duration-200 group-hover:scale-105">
              B/
            </span>
            <span className="truncate font-body text-lg font-semibold tracking-tight text-foreground">
              BeThere
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
          Portfolio demonstration project
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mb-10 mt-3 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">
            Last updated:
          </strong>{" "}
          {lastUpdated}
        </p>

        {children}

        <footer className="mt-14 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            See also the{" "}
            <Link
              to={crossLink.to}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {crossLink.label}
            </Link>
            , or{" "}
            <Link
              to="/"
              className="font-medium text-foreground underline underline-offset-4"
            >
              return home
            </Link>
            .
          </p>
        </footer>
      </main>
    </div>
  );
};

LegalPageShell.propTypes = {
  title: PropTypes.string.isRequired,
  lastUpdated: PropTypes.string.isRequired,
  crossLink: PropTypes.shape({
    to: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

/** A numbered document section with consistent spacing. */
export const LegalSection = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="mb-3 font-display text-xl font-medium text-foreground">
      {title}
    </h2>
    {children}
  </section>
);

LegalSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/** Body paragraph with the document's shared type style. */
export const LegalText = ({ children }) => (
  <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
    {children}
  </p>
);

LegalText.propTypes = {
  children: PropTypes.node.isRequired,
};

/** Bulleted list with the document's shared type style. */
export const LegalList = ({ items }) => (
  <ul className="mb-3 ml-5 list-disc space-y-1.5 text-[15px] leading-relaxed text-muted-foreground">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

LegalList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default LegalPageShell;
