// src/routes/RequireRole.jsx
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "@/hooks/useAuth";

/**
 * Route guard that only renders its children when the authenticated
 * user has (one of) the required role(s). `role` accepts a single role
 * string or an array of allowed roles. Everyone else is sent back to
 * the dashboard landing page.
 */
const RequireRole = ({ role = "ADMIN", children }) => {
  const { user, isLoading } = useAuth();

  // ProtectedRoutes already handles the loading / unauthenticated cases,
  // but guard here too so this component is safe to use standalone.
  if (isLoading) return null;

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

RequireRole.propTypes = {
  role: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  children: PropTypes.node.isRequired,
};

export default RequireRole;
