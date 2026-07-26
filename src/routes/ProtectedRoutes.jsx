// src/routes/ProtectedRoutes.jsx
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import DashboardLoadingSkeleton from "@/components/ui/DashboardLoadingSkeleton";

const ProtectedRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
