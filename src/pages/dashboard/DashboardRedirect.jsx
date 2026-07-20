// src/pages/dashboard/DashboardRedirect.jsx
import { Suspense } from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
// Each dashboard pulls in the full recharts set, so we lazy-load them and let
// the router serve only the one this user's role needs: an attendant never
// downloads the admin charts, and an admin never downloads the user charts.
// lazyWithRetry gives us the same stale-deploy chunk recovery as the routes.
import { lazyWithRetry as lazy } from "@/lib/lazy-with-retry";
import DashboardLoadingSkeleton from "@/components/ui/DashboardLoadingSkeleton";

const AdminDashboard = lazy(() => import("./AdminDashboard"));
const UserDashboard = lazy(() => import("./UserDashboard"));

const DashboardRedirect = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const hasValidRole = user?.role === "ADMIN" || user?.role === "USER";

  useEffect(() => {
    if (isLoading) return;

    if (!user || !hasValidRole) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [isLoading, user, hasValidRole, logout, navigate]);

  if (isLoading || !user || !hasValidRole) {
    return <DashboardLoadingSkeleton />;
  }

  // The skeleton doubles as the Suspense fallback while the role's dashboard
  // chunk downloads, so the transition stays seamless.
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      {user.role === "ADMIN" ? <AdminDashboard /> : <UserDashboard />}
    </Suspense>
  );
};

export default DashboardRedirect;
