import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import CropsPage from "./pages/CropsPage";
import FarmsPage from "./pages/FarmsPage";

function DashboardPage() {
  return (
    <section>
      <p className="page-eyebrow">OVERVIEW</p>
      <h1>Dashboard</h1>
      <p>Welcome to the CARDI Agricultural Intelligence Platform.</p>
    </section>
  );
}

function AuthenticatedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthenticatedPage>
              <DashboardPage />
            </AuthenticatedPage>
          }
        />

        <Route
          path="/crops"
          element={
            <AuthenticatedPage>
              <CropsPage />
            </AuthenticatedPage>
          }
        />

        <Route
          path="/farms"
          element={
            <AuthenticatedPage>
              <FarmsPage />
            </AuthenticatedPage>
          }
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      
	  <Route
  path="/profile"
  element={
    <AuthenticatedPage>
      <ProfilePage />
    </AuthenticatedPage>
  }
/></Routes>
  );
}