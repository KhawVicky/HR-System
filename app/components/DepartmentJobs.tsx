import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { getCompactPageItems } from "../lib/pagination";
import { formatDisplayDate } from "../lib/date";
import { PageLayout } from "./PageLayout";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Users,
  Eye,
  ExternalLink,
  Search,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiFetch,
  type JobSummary,
} from "../lib/api";
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
  status:
    job.status === "closed"
      ? "closed"
      : job.status === "active"
        ? "active"
        : "draft",
  applicants: Number(job.applicants),
  newApplicants: Number(job.newApplicants),
  avgScore: Number(job.avgScore),
  link: job.link ? `${window.location.origin}${job.link}` : null,
  createdAt: job.createdAt,
});

const JOBS_PER_PAGE = 10;

export function DepartmentJobs() {
  const { department } = useParams<{ department: string }>();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const departmentJobs = useMemo(() => {
    return jobs.filter((job) => job.department === department);
  }, [jobs, department]);

  const filteredJobs = useMemo(() => {
    let filtered = departmentJobs;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [departmentJobs, statusFilter, searchQuery]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredJobs.length / JOBS_PER_PAGE),
  );
  const pagedJobs = filteredJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, department]);

  const totalApplicants = departmentJobs.reduce(
    (sum, job) => sum + job.applicants,
    0,
  );
  const activeCount = departmentJobs.filter(
    (job) => job.status === "active",
  ).length;

  if (isLoadingJobs) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: department || "Department" },
        ]}
        title={`${department || "Department"} Positions`}
        useCard={false}
      >
        <LoadingState title="Loading department jobs" />
      </PageLayout>
    );
  }

  if (!department || departmentJobs.length === 0) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Departments" },
        ]}
        title="Department Not Found"
        useCard={false}
      >
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <p className="text-slate-600">
              No jobs found for this department.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: department },
      ]}
      title={`${department} Positions`}
      subtitle={
        <div className="flex items-center gap-6">
          <span className="text-slate-600">
            {departmentJobs.length} position
            {departmentJobs.length !== 1 ? "s" : ""} • {activeCount} active
          </span>
          <span className="text-slate-600">
            {totalApplicants} total applicants
          </span>
        </div>
      }
      useCard={false}
    >
      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search job positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[140px]">
                Status: {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                <div className="flex items-center justify-between w-full">
                  <span>All</span>
                  <Badge variant="outline" className="ml-2">
                    {departmentJobs.length}
                  </Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                <div className="flex items-center justify-between w-full">
                  <span>Active</span>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    {departmentJobs.filter(j => j.status === "active").length}
                  </Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("closed")}>
                <div className="flex items-center justify-between w-full">
                  <span>Closed</span>
                  <Badge variant="outline" className="ml-2 bg-slate-100 text-slate-600 border-slate-200">
                    {departmentJobs.filter(j => j.status === "closed").length}
                  </Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                <div className="flex items-center justify-between w-full">
                  <span>Draft</span>
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                    {departmentJobs.filter(j => j.status === "draft").length}
                  </Badge>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results count */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="text-sm text-slate-600">
            Showing {filteredJobs.length} of {departmentJobs.length} position{filteredJobs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredJobs.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">
                No positions found matching your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          pagedJobs.map((job) => (
          <Card
            key={job.id}
            className="hover:shadow-lg transition-shadow duration-200 shadow-md"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-2">
                    {job.title}
                  </CardTitle>
                  <CardDescription>
                    Created on{" "}
                    {formatDisplayDate(job.createdAt)}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    job.status === "active"
                      ? "default"
                      : job.status === "closed"
                        ? "secondary"
                        : "outline"
                  }
                  className={
                    job.status === "active"
                      ? "bg-green-600 text-white"
                      : job.status === "closed"
                        ? "bg-slate-600 text-white"
                        : ""
                  }
                >
                  {job.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">
                    Applicants
                  </div>
                  <div className="text-2xl font-semibold flex items-center gap-2">
                    {job.applicants}
                    {job.newApplicants > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.newApplicants} new
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-1">
                    Avg Score
                  </div>
                  <div className="text-2xl font-semibold">
                    {job.avgScore > 0 ? job.avgScore : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-1">
                    Completion
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        job.status === "closed"
                          ? 100
                          : job.status === "active"
                            ? 60
                            : 20
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">
                      {job.status === "closed"
                        ? "100%"
                        : job.status === "active"
                          ? "60%"
                          : "20%"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>

                {job.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/jobs/${job.id}/candidates`)
                      }
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View Candidates
                    </Button>

                    {job.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            job.link!,
                            "Job link copied to clipboard!",
                          )
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
      {filteredJobs.length > JOBS_PER_PAGE && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setCurrentPage((page) => Math.max(1, page - 1));
                }}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
            {getCompactPageItems(currentPage, pageCount).map((item) => {
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
                    isActive={currentPage === item}
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage(item);
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
                  setCurrentPage((page) =>
                    Math.min(pageCount, page + 1),
                  );
                }}
                className={
                  currentPage === pageCount
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </PageLayout>
  );
}


