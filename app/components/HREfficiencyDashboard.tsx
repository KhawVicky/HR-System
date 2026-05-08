import { PageLayout } from "./PageLayout";
import { useEffect, useState } from "react";
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
  CheckCircle,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

type CandidateProcessing = {
  candidateName: string;
  jobTitle: string;
  applicationDate: string;
  interviewDate: string;
  processingDays: number;
  hrAssigned: string;
};

const PROCESSING_DETAILS_PER_PAGE = 15;

export function HREfficiencyDashboard() {
  const [processingData, setProcessingData] = useState<
    CandidateProcessing[]
  >([]);
  const [processingPage, setProcessingPage] = useState(1);

  useEffect(() => {
    apiFetch<{ details: CandidateProcessing[] }>("/hr-efficiency")
      .then((data) => setProcessingData(data.details))
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load HR efficiency data",
        ),
      );
  }, []);

  const totalCandidates = processingData.length;
  const avgProcessingTime =
    totalCandidates === 0
      ? 0
      : processingData.reduce(
      (sum, item) => sum + item.processingDays,
      0,
        ) / totalCandidates;

  const hrPerformance = processingData.reduce(
    (acc, item) => {
      if (!acc[item.hrAssigned]) {
        acc[item.hrAssigned] = {
          name: item.hrAssigned,
          totalCandidates: 0,
          totalDays: 0,
        };
      }
      acc[item.hrAssigned].totalCandidates += 1;
      acc[item.hrAssigned].totalDays += item.processingDays;
      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        totalCandidates: number;
        totalDays: number;
      }
    >,
  );

  const hrStats = Object.values(hrPerformance).map((hr) => ({
    id: hr.name,
    name: hr.name,
    avgDays:
      Math.round((hr.totalDays / hr.totalCandidates) * 10) / 10,
    candidates: hr.totalCandidates,
  }));

  const dailyTrend = processingData.reduce(
    (acc, item) => {
      const date = item.applicationDate;
      if (!acc[date]) {
        acc[date] = {
          date,
          applications: 0,
          avgProcessing: 0,
          count: 0,
        };
      }
      acc[date].applications += 1;
      acc[date].avgProcessing += item.processingDays;
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
      date: new Date(item.date).toLocaleDateString("en-MY", {
        month: "short",
        day: "numeric",
      }),
      avgDays:
        Math.round((item.avgProcessing / item.count) * 10) / 10,
    }));

  const fastestProcessing = Math.min(
    ...(processingData.length
      ? processingData.map((item) => item.processingDays)
      : [0]),
  );
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Avg Processing Time
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {avgProcessingTime.toFixed(1)}{" "}
                  <span className="text-lg">days</span>
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
                  {fastestProcessing}{" "}
                  <span className="text-lg">days</span>
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
                    dataKey="avgDays"
                    stroke="#003B7A"
                    strokeWidth={2}
                    key="line-avgDays"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>HR Performance Comparison</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Average processing time by HR staff (in days)
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
                    dataKey="avgDays"
                    fill="#003B7A"
                    key="bar-avgDays"
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
              Application to interview timeline for April 2026
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-sm font-semibold text-slate-900">
                      Candidate
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-900">
                      Job Title
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-900">
                      Application Date
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-900">
                      Interview Date
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-900">
                      Processing Time
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-900">
                      HR Assigned
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pagedProcessingData.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 text-sm text-slate-900">
                        {item.candidateName}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {item.jobTitle}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {new Date(
                          item.applicationDate,
                        ).toLocaleDateString("en-MY")}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {new Date(
                          item.interviewDate,
                        ).toLocaleDateString("en-MY")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            item.processingDays <= 3
                              ? "bg-green-50 text-green-700"
                              : item.processingDays <= 5
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {item.processingDays} days
                        </span>
                      </td>
                      <td className="py-3 text-sm text-slate-600">
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
                  {Array.from({
                    length: processingPageCount,
                  }).map((_, index) => {
                    const page = index + 1;

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={processingPage === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setProcessingPage(page);
                          }}
                        >
                          {page}
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
    </PageLayout>
  );
}
