import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { ActivityList } from "@/pages/activities/ActivityList";
import { ActivityDetail } from "@/pages/activities/ActivityDetail";
import { ActivityCreate } from "@/pages/activities/ActivityCreate";
import { ActivityApproval } from "@/pages/activities/ActivityApproval";
import { VolunteerList } from "@/pages/volunteers/VolunteerList";
import { MaterialList } from "@/pages/materials/MaterialList";
import { MaterialRequisition } from "@/pages/materials/MaterialRequisition";
import { Statistics } from "@/pages/Statistics";
import { CertificatePage } from "@/pages/Certificate";
import type { ReactNode } from "react";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  const currentUser = useAuthStore((s) => s.currentUser);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <ActivityList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activities/create"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <ActivityCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activities/approval"
          element={
            <ProtectedRoute roles={["admin"]}>
              <ActivityApproval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activities/:id"
          element={
            <ProtectedRoute>
              <ActivityDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/volunteers"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <VolunteerList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materials"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <MaterialList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materials/requisition"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <MaterialRequisition />
            </ProtectedRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <ProtectedRoute>
              <CertificatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/statistics"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Statistics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="*"
          element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}
