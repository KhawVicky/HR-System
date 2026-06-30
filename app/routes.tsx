import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./components/shared/Root";
import { Login } from "./components/auth/Login";
import { Dashboard } from "./components/dashboard/Dashboard";
import { JobDetails } from "./components/jobs/JobDetails";
import { CandidateList } from "./components/candidates/CandidateList";
import { CreateJob } from "./components/jobs/CreateJob";
import { ApplyJob } from "./components/candidate-portal/ApplyJob";
import { AttendanceAnalytics } from "./components/attendance/AttendanceAnalytics";
import { Reports } from "./components/reports/Reports";
import { UserProfile } from "./components/profile/UserProfile";
import { NotificationsPage } from "./components/notifications/NotificationsPage";
import { HRManagement } from "./components/users/HRManagement";
import { DepartmentJobs } from "./components/jobs/DepartmentJobs";
import { JobManagement } from "./components/jobs/JobManagement";
import { ApplicationList } from "./components/candidates/ApplicationList";
import {
  CareersHome,
  CareerJobDetailsPage,
  CandidateApplicationDetailsPage,
  CandidateApplicationsPage,
  CandidateLogin,
  CandidateProfilePage,
  CandidateRegister,
} from "./components/candidate-portal/CandidatePortal";
import { NotFound } from "./components/shared/NotFound";
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
