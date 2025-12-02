// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: any) => {
  const sessionKey = sessionStorage.getItem("goscoot_session_id");

  // If no sessionKey found → redirect to login
  if (!sessionKey) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
