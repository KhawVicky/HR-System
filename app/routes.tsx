import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { JobDetails } from "./components/JobDetails";
import { CandidateList } from "./components/CandidateList";
import { CreateJob } from "./components/CreateJob";
import { ApplyJob } from "./components/ApplyJob";
import { AttendanceAnalytics } from "./components/AttendanceAnalytics";
import { Reports } from "./components/Reports";
import { UserProfile } from "./components/UserProfile";
import { UserManagementPage } from "./components/admin";
import { HREfficiencyDashboard } from "./components/HREfficiencyDashboard";
import { DepartmentJobs } from "./components/DepartmentJobs";
import { NotFound } from "./components/NotFound";
import { canManageUsers, canViewHrEfficiency, getStoredUser } from "./lib/api";

// Simple auth check
export const isAuthenticated = () => {
  return localStorage.getItem("hr_authenticated") === "true";
};

// Protected route wrapper
const ProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!canManageUsers(getStoredUser())) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const HREfficiencyRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!canViewHrEfficiency(getStoredUser())) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "login",
        Component: Login,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "jobs/create",
        element: (
          <ProtectedRoute>
            <CreateJob />
          </ProtectedRoute>
        ),
      },
      {
        path: "jobs/:jobId",
        element: (
          <ProtectedRoute>
            <JobDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "jobs/:jobId/edit",
        element: (
          <ProtectedRoute>
            <CreateJob />
          </ProtectedRoute>
        ),
      },
      {
        path: "jobs/:jobId/candidates",
        element: (
          <ProtectedRoute>
            <CandidateList />
          </ProtectedRoute>
        ),
      },
      {
        path: "apply",
        Component: ApplyJob,
      },
      {
        path: "apply/:jobCode",
        Component: ApplyJob,
      },
      {
        path: "attendance",
        element: (
          <ProtectedRoute>
            <AttendanceAnalytics />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ManagerRoute>
            <UserManagementPage />
          </ManagerRoute>
        ),
      },
      {
        path: "hr-efficiency",
        element: (
          <HREfficiencyRoute>
            <HREfficiencyDashboard />
          </HREfficiencyRoute>
        ),
      },
      {
        path: "departments/:department",
        element: (
          <ProtectedRoute>
            <DepartmentJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
