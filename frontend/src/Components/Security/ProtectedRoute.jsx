import { Navigate, Outlet } from "react-router-dom";
import { ADMIN_TOKEN_KEY } from "../../api/client";

/**
 * Renders child routes only when an admin JWT exists.
 * Otherwise redirects to login.
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
