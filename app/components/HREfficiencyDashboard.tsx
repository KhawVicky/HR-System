import { PageLayout } from "./PageLayout";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Clock,
  TrendingUp,
  Users,
  UserRound,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { formatDisplayDate, formatDisplayDateTime } from "../lib/date";
import { getCompactPageItems } from "../lib/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { LoadingState } from "./LoadingState";

type CandidateProcessing = {
  candidateName: string;
  candidateEmail: string;
  jobId: number;
  jobTitle: string;
  applicationDate: string;
  lastActionDate: string | null;
  processingMinutes: number | null;
  processingStatus:
    | "reviewed"
    | "shortlisted"
    | "interview_email_sent"
    | "rejection_email_sent";
  hrAssigned: string;
};

const PROCESSING_DETAILS_PER_PAGE = 15;

const formatDateTime = (value: string | null) => {
  return formatDisplayDateTime(value);
};

const formatProcessingTime = (minutes: number | null) => {
  if (minutes === null) return "";
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  const totalHours = Math.floor(minutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  return parts.join(" ");
};

const processingStatusLabel = {
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview_email_sent: "Interview email sent",
  rejection_email_sent: "Rejection email sent",
};

const processingStatusClass = {
  reviewed: "bg-green-50 text-green-700",
  shortlisted: "bg-amber-50 text-amber-700",
  interview_email_sent: "bg-blue-50 text-blue-700",
  rejection_email_sent: "bg-red-50 text-red-700",
};

type HREfficiencyDashboardProps = {
  embedded?: boolean;
};

export function HREfficiencyDashboard({
  embedded = false,
}: HREfficiencyDashboardProps) {
  const [processingData, setProcessingData] = useState<
    CandidateProcessing[]
  >([]);
  const [isLoadingProcessing, setIsLoadingProcessing] = useState(true);
  const [processingPage, setProcessingPage] = useState(1);

  useEffect(() => {
    setIsLoadingProcessing(true);
    apiFetch<{ details: CandidateProcessing[] }>("/hr-efficiency")
      .then((data) => setProcessingData(data.details))
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load HR efficiency data",
        ),
      )
      .finally(() => setIsLoadingProcessing(false));
  }, []);

  const processedApplications = processingData.filter(
    (item) => item.processingMinutes !== null,
  );
  const totalCandidates = processedApplications.length;
  const avgProcessingTime =
    totalCandidates === 0
      ? null
      : processedApplications.reduce(
          (sum, item) => sum + (item.processingMinutes ?? 0),
          0,
        ) / totalCandidates;

  const hrPerformance = processedApplications.reduce(
    (acc, item) => {
      if (!acc[item.hrAssigned]) {
        acc[item.hrAssigned] = {
          name: item.hrAssigned,
          totalCandidates: 0,
          totalMinutes: 0,
        };
      }
      acc[item.hrAssigned].totalCandidates += 1;
      acc[item.hrAssigned].totalMinutes +=
        item.processingMinutes ?? 0;
      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        totalCandidates: number;
        totalMinutes: number;
      }
    >,
  );

  const hrStats = Object.values(hrPerformance).map((hr) => ({
    id: hr.name,
    name: hr.name,
    avgHours:
      Math.round(
        (hr.totalMinutes / hr.totalCandidates / 60) * 10,
      ) / 10,
    candidates: hr.totalCandidates,
  }));

  const dailyTrend = processedApplications.reduce(
    (acc, item) => {
      const date = item.applicationDate.slice(0, 10);
      if (!acc[date]) {
        acc[date] = {
          date,
          applications: 0,
          avgProcessing: 0,
          count: 0,
        };
      }
      acc[date].applications += 1;
      acc[date].avgProcessing += (item.processingMinutes ?? 0) / 60;
      acc[date].count += 1;
      return acc;
    },
    {} as Record<
      string,
      {
        date: string;
        applications: number;
        avgProcessing: number;
        count: number;
      }
    >,
  );

  const trendData = Object.values(dailyTrend)
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    .map((item) => ({
      id: item.date,
      date: formatDisplayDate(item.date),
      avgHours:
        Math.round((item.avgProcessing / item.count) * 10) / 10,
    }));

  const fastestProcessing =
    processedApplications.length > 0
      ? Math.min(
          ...processedApplications.map(
            (item) => item.processingMinutes ?? 0,
          ),
        )
      : null;
  const processingPageCount = Math.max(
    1,
    Math.ceil(
      processingData.length / PROCESSING_DETAILS_PER_PAGE,
    ),
  );
  const pagedProcessingData = processingData.slice(
    (processingPage - 1) * PROCESSING_DETAILS_PER_PAGE,
    processingPage * PROCESSING_DETAILS_PER_PAGE,
  );

  useEffect(() => {
    setProcessingPage(1);
  }, [processingData.length]);

  const content = (
    <>
      {isLoadingProcessing ? (
        <LoadingState title="Loading HR efficiency data" />
      ) : (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Avg Processing Time
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatProcessingTime(
                    avgProcessingTime === null
                      ? null
                      : Math.round(avgProcessingTime),
                  )}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Fastest Processing
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatProcessingTime(fastestProcessing)}
                </p>
              </div>
              <div className="rounded-2xl bg-green-50 p-3">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Total Processed
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {totalCandidates}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
            </CardContent>
          </Card>

         
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Processing Time Trend</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Daily average processing time this month
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    key="grid-line"
                  />
                  <XAxis dataKey="date" key="xaxis-line" />
                  <YAxis key="yaxis-line" />
                  <Tooltip key="tooltip-line" />
                  <Line
                    type="monotone"
                    dataKey="avgHours"
                    stroke="#003B7A"
                    strokeWidth={2}
                    key="line-avgHours"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>HR Performance Comparison</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Average processing time by HR staff (in hours)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hrStats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    key="grid-bar"
                  />
                  <XAxis dataKey="name" key="xaxis-bar" />
                  <YAxis key="yaxis-bar" />
                  <Tooltip key="tooltip-bar" />
                  <Bar
                    dataKey="avgHours"
                    fill="#003B7A"
                    key="bar-avgHours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Processing Details</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Application processing timeline based on HR actions.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[18%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-4">
                      Candidate
                    </th>
                    <th className="px-3 py-4">
                      Job Title
                    </th>
                    <th className="px-3 py-4">
                      Application Date
                    </th>
                    <th className="px-3 py-4">
                      Last Action Date
                    </th>
                    <th className="px-3 py-4">
                      Processing Time
                    </th>
                    <th className="px-3 py-4">
                      HR Assigned
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedProcessingData.map((item, index) => (
                    <tr
                      key={index}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-3 py-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="shrink-0 rounded-full bg-blue-50 p-2">
                            <UserRound className="h-4 w-4 text-[#003B7A]" />
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/jobs/${item.jobId}/candidates?search=${encodeURIComponent(item.candidateEmail)}`}
                              className="block max-w-full break-words font-medium leading-snug text-slate-900 hover:text-[#003B7A]"
                            >
                              {item.candidateName}
                            </Link>
                            <p className="mt-1 break-all text-xs text-slate-500">
                              {item.candidateEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-5 align-top leading-snug text-slate-600 [overflow-wrap:anywhere]">
                        {item.jobTitle}
                      </td>
                      <td className="px-3 py-5 leading-snug text-slate-600">
                        {formatDateTime(item.applicationDate)}
                      </td>
                      <td className="px-3 py-5 leading-snug text-slate-600">
                        {formatDateTime(item.lastActionDate)}
                      </td>
                      <td className="px-3 py-5">
                        <p className="font-medium leading-snug text-slate-700">
                          {formatProcessingTime(item.processingMinutes)}
                        </p>
                        <span
                          className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${processingStatusClass[item.processingStatus]}`}
                        >
                          {processingStatusLabel[item.processingStatus]}
                        </span>
                      </td>
                      <td className="px-3 py-5 leading-snug text-slate-600 [overflow-wrap:anywhere]">
                        {item.hrAssigned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processingData.length > PROCESSING_DETAILS_PER_PAGE && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setProcessingPage((page) =>
                          Math.max(1, page - 1),
                        );
                      }}
                      className={
                        processingPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {getCompactPageItems(
                    processingPage,
                    processingPageCount,
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
                          isActive={processingPage === item}
                          onClick={(event) => {
                            event.preventDefault();
                            setProcessingPage(item);
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
                        setProcessingPage((page) =>
                          Math.min(
                            processingPageCount,
                            page + 1,
                          ),
                        );
                      }}
                      className={
                        processingPage === processingPageCount
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "HR Efficiency" },
      ]}
      title="HR Efficiency Dashboard"
      subtitle="Monitor HR team performance in processing candidate applications"
      useCard={false}
    >
      {content}
    </PageLayout>
  );
}
