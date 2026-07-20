import { AppNavbar } from "@/components/AppNavbar";
import { Outlet, useLocation } from "react-router-dom";
import ErrorBoundary from "@/lib/ErrorBoundary";

export default function Layout() {
  const location = useLocation();

  return (
    <main className="min-h-screen w-full bg-background">
      <AppNavbar />
      {/* Content shell mirrors the navbar's inner width so both align. */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Route-level crash isolation: a panel crash keeps the navbar and
            shell alive (the global boundary in main.jsx stays as the outer
            safety net). The pathname key remounts the subtree across routes;
            resetKey additionally clears a SHOWN error on any navigation.
            location.key is unique per history entry, which matters now that
            page and filters live in the query string: keying on pathname
            alone left the boundary stuck on the error screen for every
            same-pathname navigation, including its own recovery
            (window.history.back(), which often lands on that pathname). */}
        <ErrorBoundary key={location.pathname} resetKey={location.key}>
          <Outlet />
        </ErrorBoundary>
      </div>
    </main>
  );
}
