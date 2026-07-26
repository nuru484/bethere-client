import { AppNavbar } from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { Outlet, useLocation } from "react-router";
import ErrorBoundary from "@/lib/ErrorBoundary";

export default function Layout() {
  const location = useLocation();

  return (
    <main className="min-h-screen w-full bg-background">
      <AppNavbar />
      {/* Content shell mirrors the navbar's inner width so both align.
          Below lg the fixed BottomNav needs bottom clearance (bar height
          plus the device safe-area inset) so the last content is never
          covered. */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8">
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
      <BottomNav />
    </main>
  );
}
