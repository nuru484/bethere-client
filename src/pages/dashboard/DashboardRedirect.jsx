// src/pages/dashboard/DashboardRedirect.jsx
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import DashboardLoadingSkeleton from "@/components/ui/DashboardLoadingSkeleton";

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

  return user.role === "ADMIN" ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardRedirect;
