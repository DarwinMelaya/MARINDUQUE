import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "../Components/Layout/Layout";
import ProtectedRoute from "../Components/Security/ProtectedRoute";
import {
  AdminPrograms,
  Dashboard,
  LandingPage,
  Login,
  SignUp,
  AdminPost,
  CoralReefMapping,
} from "../pages";

export const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-programs" element={<AdminPrograms />} />
            <Route path="/admin-post" element={<AdminPost />} />
            <Route
              path="/admin-coral-reef-mapping"
              element={<CoralReefMapping />}
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};
