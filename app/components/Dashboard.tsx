import image_a7e321551d78150f830b1e4870452ab5d2dd7d7e from "../assets/uwc-berhad-logo.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getCompactPageItems } from "../lib/pagination";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import {
  Briefcase,
  Users,
  FileText,
  Plus,
  ExternalLink,
  Eye,
  Upload,
  LogOut,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiFetch,
  canManageUsers,
  canViewHrEfficiency,
  getStoredUser,
  type JobSummary,
} from "../lib/api";
import { HeaderNotifications } from "./HeaderNotifications";
import { LoadingState } from "./LoadingState";

type JobStatus = "active" | "closed" | "draft";

interface Job {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  applicants: number;
  newApplicants: number;
  avgScore: number;
  link: string | null;
  createdAt: string;
}

const mapApiJob = (job: JobSummary): Job => ({
  id: String(job.id),
  title: job.title,
  department: job.department,
  status: job.status === "closed" ? "closed" : job.status === "active" ? "active" : "draft",
  applicants: Number(job.applicants),
  newApplicants: Number(job.newApplicants),
  avgScore: Number(job.avgScore),
  link: job.link ? `${window.location.origin}${job.link}` : null,
  createdAt: job.createdAt,
});

const DEPARTMENTS_PER_PAGE = 10;

export function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [departmentPage, setDepartmentPage] = useState(1);
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    setIsLoadingJobs(true);
    apiFetch<{ jobs: JobSummary[] }>("/jobs")
      .then((data) => setJobs(data.jobs.map(mapApiJob)))
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load jobs",
        ),
      )
      .finally(() => setIsLoadingJobs(false));
  }, []);

  // Listen for status updates from JobDetails page
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { jobId, status } = event.detail;
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: status as JobStatus,
              }
            : job,
        ),
      );
    };

    window.addEventListener(
      "jobStatusUpdated",
      handleStatusUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "jobStatusUpdated",
        handleStatusUpdate as EventListener,
      );
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("hr_authenticated");
    localStorage.removeItem("hr_user");
    localStorage.removeItem("hr_user_data");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const copyToClipboard = async (
    text: string,
    successMessage: string,
  ) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(successMessage);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          toast.success(successMessage);
        } catch (err) {
          toast.error("Failed to copy to clipboard");
        }
        textArea.remove();
      }
    } catch (err) {
      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success(successMessage);
      } catch (error) {
        toast.error("Failed to copy to clipboard");
      }
      textArea.remove();
    }
  };

  const totalApplicants = jobs.reduce(
    (sum, job) => sum + job.applicants,
    0,
  );
  const activeJobs = jobs.filter(
    (job) => job.status === "active",
  ).length;
  const newApplicants = jobs.reduce(
    (sum, job) => sum + job.newApplicants,
    0,
  );
  const departments = Array.from(
    new Set(jobs.map((job) => job.department)),
  );
  const departmentPageCount = Math.max(
    1,
    Math.ceil(departments.length / DEPARTMENTS_PER_PAGE),
  );
  const pagedDepartments = departments.slice(
    (departmentPage - 1) * DEPARTMENTS_PER_PAGE,
    departmentPage * DEPARTMENTS_PER_PAGE,
  );

  useEffect(() => {
    setDepartmentPage(1);
  }, [departments.length]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar pattern */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img
                src={
                  image_a7e321551d78150f830b1e4870452ab5d2dd7d7e
                }
                alt="UWC Logo"
                className="h-8 w-auto"
              />
              <span className="text-lg font-semibold">
                HR Dashboard
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/attendance")}
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Attendance
              </Button>

              {canViewHrEfficiency(user) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/hr-efficiency")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  HR Efficiency
                </Button>
              )}

              {canManageUsers(user) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              )}
              <HeaderNotifications />
              {/*  report button
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/reports")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </Button>
*/}
              {/* User Profile Dropdown */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase() ||
                      localStorage.getItem("hr_user")?.charAt(0).toUpperCase() ||
                      "H"}
                  </div>
                  <span className="text-sm text-slate-600">
                    {user?.name || localStorage.getItem("hr_user")}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingJobs ? (
          <LoadingState title="Loading dashboard data" />
        ) : (
          <>
        {/* Visibility pattern - è®©HRä¸€çœ¼çœ‹åˆ°å…³é”®æŒ‡æ ‡ */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Overview</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Layout pattern */}
              <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeJobs}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {jobs.length - activeJobs} inactive positions
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Applicants
                </CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalApplicants}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Across all positions
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Applicants
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newApplicants}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  In the last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Posts Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Job Positions
          </h2>
          <Button
            onClick={() => navigate("/jobs/create")}
            className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Button>
        </div>

        {/* Department grouped view */}
        <div className="grid grid-cols-1 gap-6">
          {pagedDepartments.map((department) => {
            const departmentJobs = jobs.filter(job => job.department === department);
            const totalApplicants = departmentJobs.reduce((sum, job) => sum + job.applicants, 0);
            const activeCount = departmentJobs.filter(job => job.status === 'active').length;

            return (
              <Card
                key={department}
                className="shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate(`/departments/${encodeURIComponent(department)}`)}
              >
                <CardHeader className="hover:bg-slate-50 transition-colors px-[24px] pt-[10px] pb-[0px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      
                      <div>
                        <CardTitle className="text-xl">{department}</CardTitle>
                        <CardDescription className="mt-1">
                          {departmentJobs.length} position{departmentJobs.length !== 1 ? 's' : ''} • {activeCount} active
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-500">Total Applicants</div>
                        <div className="text-2xl font-bold text-slate-900">{totalApplicants}</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        {departments.length > DEPARTMENTS_PER_PAGE && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setDepartmentPage((page) => Math.max(1, page - 1));
                  }}
                  className={
                    departmentPage === 1
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
              {getCompactPageItems(
                departmentPage,
                departmentPageCount,
              ).map((item) => {
                if (typeof item === "string") {
                  return (
                    <PaginationItem key={item}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={departmentPage === item}
                      onClick={(event) => {
                        event.preventDefault();
                        setDepartmentPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setDepartmentPage((page) =>
                      Math.min(departmentPageCount, page + 1),
                    );
                  }}
                  className={
                    departmentPage === departmentPageCount
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
          </>
        )}
      </div>
    </div>
  );
}

