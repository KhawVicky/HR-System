import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Briefcase, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { apiFetch, type JobSummary } from "../../lib/api";
import { formatDisplayDate } from "../../lib/date";
import { getCompactPageItems } from "../../lib/pagination";
import { LoadingState } from "../shared/LoadingState";
import { PageLayout } from "../shared/PageLayout";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

const JOBS_PER_PAGE = 10;

const statusBadgeClass = (status: string) => {
  if (status === "active") return "bg-green-600 text-white";
  if (status === "closed") return "bg-slate-600 text-white";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

const formatDate = (value: string | null) => {
  return formatDisplayDate(value);
};

export function JobManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsLoadingJobs(true);
    apiFetch<{ jobs: JobSummary[] }>("/jobs")
      .then((data) => setJobs(data.jobs))
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load job posts",
        ),
      )
      .finally(() => setIsLoadingJobs(false));
  }, []);

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  const filteredJobs = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      const matchesSearch =
        !keyword ||
        job.title.toLowerCase().includes(keyword) ||
        job.department.toLowerCase().includes(keyword) ||
        job.location.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [jobs, searchQuery, statusFilter]);

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
  }, [searchQuery, statusFilter]);

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Job Management" },
      ]}
      title="Job Management"
      subtitle="View and manage job posts by status."
      useCard={false}
    >
      {isLoadingJobs ? (
        <LoadingState title="Loading job posts" />
      ) : (
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-[420px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search job title or department"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["all", "active", "closed", "draft"].map((status) => (
                  <Button
                    key={status}
                    variant={
                      statusFilter === status ? "default" : "outline"
                    }
                    className={
                      statusFilter === status
                        ? "bg-[#003B7A] text-white hover:bg-[#002f63]"
                        : ""
                    }
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "all"
                      ? "All"
                      : status.charAt(0).toUpperCase() +
                        status.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Applications</th>
                  <th className="px-6 py-4">Published Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-blue-50 p-2">
                          <Briefcase className="h-4 w-4 text-[#003B7A]" />
                        </span>
                        <span className="font-medium text-slate-900">
                          {job.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-700">
                      {job.department}
                    </td>
                    <td className="px-6 py-5 text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {job.location}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-700">
                      {job.applicants}
                    </td>
                    <td className="px-6 py-5 text-slate-700">
                      {formatDate(job.publishedAt || job.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={statusBadgeClass(job.status)}>
                        {job.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredJobs.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No job posts match this filter.
              </div>
            )}
          </div>

          {filteredJobs.length > JOBS_PER_PAGE && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((page) => Math.max(1, page - 1));
                    }}
                  />
                </PaginationItem>
                {getCompactPageItems(currentPage, pageCount).map(
                  (item) => (
                    <PaginationItem key={item}>
                      {typeof item === "number" ? (
                        <PaginationLink
                          href="#"
                          isActive={item === currentPage}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={
                      currentPage === pageCount
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((page) =>
                        Math.min(pageCount, page + 1),
                      );
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </PageLayout>
  );
}
