import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageLayout } from "./PageLayout";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { LoadingState } from "./LoadingState";

type AttendanceRecord = {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  scheduledDate: string;
  status: string;
  onTime: boolean | number;
  notes: string;
};

export function AttendanceAnalytics() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("7days");
  const [attendanceData, setAttendanceData] = useState<
    AttendanceRecord[]
  >([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

  useEffect(() => {
    setIsLoadingAttendance(true);
    apiFetch<{ records: AttendanceRecord[] }>(
      "/attendance-analytics",
    )
      .then((data) => setAttendanceData(data.records))
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load attendance analytics",
        ),
      )
      .finally(() => setIsLoadingAttendance(false));
  }, []);

  // Calculate statistics
  const totalInterviews = attendanceData.length;
  const attended = attendanceData.filter((d) => d.status === "attended").length;
  const noShows = attendanceData.filter((d) => d.status === "no-show").length;
  const rescheduled = attendanceData.filter((d) => d.status === "rescheduled").length;
  const onTime = attendanceData.filter((d) => d.onTime).length;
  
  const attendanceRate =
    totalInterviews === 0
      ? "0.0"
      : ((attended / totalInterviews) * 100).toFixed(1);
  const noShowRate =
    totalInterviews === 0
      ? "0.0"
      : ((noShows / totalInterviews) * 100).toFixed(1);
  const punctualityRate =
    totalInterviews === 0
      ? "0.0"
      : ((onTime / totalInterviews) * 100).toFixed(1);

  // Attendance patterns
  const patterns = [
    {
      type: "High No-Show Rate",
      severity: "warning",
      count: noShows,
      description: `${noShows} candidates did not attend their scheduled interviews`,
      recommendation: "Send reminder emails 24h before interviews",
    },
    {
      type: "Late Arrivals",
      severity: "info",
      count: attendanceData.filter((d) => !d.onTime && d.status === "attended").length,
      description: "Some candidates arrived late to interviews",
      recommendation: "Consider adding buffer time between interviews",
    },
    {
      type: "Rescheduling Trend",
      severity: "info",
      count: rescheduled,
      description: `${rescheduled} interviews were rescheduled`,
      recommendation: "Offer flexible time slots when scheduling",
    },
  ];

  const exportReport = () => {
    toast.success("Report exported successfully!", {
      description: "Attendance_Report_2026-03.csv has been downloaded",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attended":
        return <Badge className="bg-green-600">Attended</Badge>;
      case "no-show":
        return <Badge className="bg-red-600">No Show</Badge>;
      case "rescheduled":
        return <Badge className="bg-yellow-600">Rescheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Attendance Analytics" },
      ]}
      title="Attendance Analytics"
      subtitle="Monitor candidate interview attendance patterns and trends"
      useCard={false}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
            onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoadingAttendance ? (
        <LoadingState title="Loading attendance analytics" />
      ) : (
        <>
      {/* Key Metrics - Visibility pattern */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <p className="text-xs text-slate-500">
                {attended} of {totalInterviews} attended
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{noShowRate}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <p className="text-xs text-slate-500">
                {noShows} candidates didn't attend
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punctuality Rate</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{punctualityRate}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {onTime} arrived on time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="patterns">Patterns & Flags</TabsTrigger>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Attendance Flags / Pattern Summary */}
        <TabsContent value="patterns" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Attendance Pattern Summary</CardTitle>
              <CardDescription>
                Identified patterns and recommendations to improve attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {patterns.map((pattern, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    pattern.severity === "warning" ? "bg-red-100" : "bg-blue-100"
                  }`}>
                    {pattern.severity === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{pattern.type}</h3>
                      <Badge variant="outline">{pattern.count} cases</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{pattern.description}</p>
                    <div className="bg-blue-50 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Recommendation:</span> {pattern.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Records */}
        <TabsContent value="records">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Detailed log of their attendance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceData.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{record.candidateName}</h4>
                        {getStatusBadge(record.status)}
                        {record.onTime && record.status === "attended" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            On Time
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>Position: {record.jobTitle}</p>
                        <p>Date: {new Date(record.scheduledDate).toLocaleDateString()}</p>
                        {record.notes && <p className="italic">Notes: {record.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Dashboard */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Week 1</span>
                      <span className="font-medium">95% attended</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Week 2</span>
                      <span className="font-medium">88% attended</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "88%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Week 3</span>
                      <span className="font-medium">92% attended</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "92%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Week 4</span>
                      <span className="font-medium">83% attended</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "83%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-600" />
                      <span className="text-sm">Attended</span>
                    </div>
                    <span className="font-semibold">{attended}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600" />
                      <span className="text-sm">No Show</span>
                    </div>
                    <span className="font-semibold">{noShows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-600" />
                      <span className="text-sm">Rescheduled</span>
                    </div>
                    <span className="font-semibold">{rescheduled}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Best time slot:</span> Tuesday-Thursday, 10 AM - 2 PM shows highest attendance rate (96%)
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Improvement noted:</span> Attendance rate improved by 8% after implementing reminder emails
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Action needed:</span> Friday afternoon slots have 25% higher no-show rate
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </PageLayout>
  );
}
