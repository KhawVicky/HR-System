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
import { NotificationsPage } from "./components/NotificationsPage";
import { HRManagement } from "./components/HRManagement";
import { DepartmentJobs } from "./components/DepartmentJobs";
import { JobManagement } from "./components/JobManagement";
import { ApplicationList } from "./components/ApplicationList";
import {
  CareersHome,
  CareerJobDetailsPage,
  CandidateApplicationDetailsPage,
  CandidateApplicationsPage,
  CandidateLogin,
  CandidateProfilePage,
  CandidateRegister,
} from "./components/CandidatePortal";
import { NotFound } from "./components/NotFound";
import { canManageUsers, getStoredUser } from "./lib/api";

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
        path: "careers",
        Component: CareersHome,
      },
      {
        path: "careers/:jobCode",
        Component: CareerJobDetailsPage,
      },
      {
        path: "candidate/login",
        Component: CandidateLogin,
      },
      {
        path: "candidate/register",
        Component: CandidateRegister,
      },
      {
        path: "candidate/applications",
        Component: CandidateApplicationsPage,
      },
      {
        path: "candidate/applications/:applicationId",
        Component: CandidateApplicationDetailsPage,
      },
      {
        path: "candidate/profile",
        Component: CandidateProfilePage,
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
        path: "jobs",
        element: (
          <ProtectedRoute>
            <JobManagement />
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
        path: "applications",
        element: (
          <ProtectedRoute>
            <ApplicationList />
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
        path: "notifications",
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ManagerRoute>
            <HRManagement />
          </ManagerRoute>
        ),
      },
      {
        path: "hr-efficiency",
        element: (
          <ManagerRoute>
            <HRManagement />
          </ManagerRoute>
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
