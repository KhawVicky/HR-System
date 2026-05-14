import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageLayout } from "./PageLayout";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Progress } from "./ui/progress";
import {
  Users,
  Calendar,
  MapPin,
  Building2,
  FileText,
  ExternalLink,
  Copy,
  ChevronDown,
  Check,
  Pencil,
  GraduationCap,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { apiFetch, type JobSummary } from "../lib/api";

type JobDetailsData = JobSummary & {
  responsibilities?: { responsibility: string }[];
  skills?: { name: string; type: string; importance: string }[];
  criteria?: { id: number; name: string; weight: number; description: string | null }[];
  eligibility?: Record<string, unknown> | null;
};

const toJobStatus = (status: JobSummary["status"]) =>
  status === "closed" ? "closed" : status === "active" ? "active" : "draft";

const mapJobDescription = (job: JobDetailsData) => {
  const responsibilities = job.responsibilities?.map((item) => item.responsibility) ?? [];
  const skills = job.skills?.map((item) => item.name) ?? [];

  if (job.description) return job.description;

  return [
    `${job.title}`,
    responsibilities.length ? `Key Responsibilities:\n${responsibilities.map((item) => `- ${item}`).join("\n")}` : "",
    skills.length ? `Required Skills:\n${skills.map((item) => `- ${item}`).join("\n")}` : "",
    job.requiredQualification ? `Required Qualification:\n${job.requiredQualification}` : "",
    job.requiredExperience ? `Required Experience:\n${job.requiredExperience}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};
export function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<(JobDetailsData & { link: string | null; description: string }) | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("active");
  const [initialStatus, setInitialStatus] = useState<string>("active");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    apiFetch<{ job: JobDetailsData }>(`/jobs/${jobId}`)
      .then(({ job: loadedJob }) => {
        const status = toJobStatus(loadedJob.status);
        setJob({
          ...loadedJob,
          status,
          link: loadedJob.link
            ? `${window.location.origin}${loadedJob.link}`
            : null,
          description: mapJobDescription(loadedJob),
        });
        setCurrentStatus(status);
        setInitialStatus(status);
        setHasChanges(false);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load job details",
        ),
      );
  }, [jobId]);

  if (!job) {
    return <div>Job not found</div>;
  }

  const statusOptions = [
    { value: "active", label: "Active", color: "bg-green-600" },
    { value: "closed", label: "Closed", color: "bg-slate-600" },
    { value: "draft", label: "Draft", color: "bg-slate-400" },
  ];
  const criteria = job.criteria ?? [];
  const eligibility = job.eligibility ?? {};
  const totalCriteriaWeight = criteria.reduce(
    (sum, item) => sum + Number(item.weight),
    0,
  );
  const getEligibilityValue = (key: string) => {
    const value = eligibility[key];
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  };
  const eligibilityItems = [
    {
      label: "Minimum CGPA",
      value: getEligibilityValue("minCgpa"),
      icon: GraduationCap,
    },
    {
      label: "Minimum Experience",
      value:
        getEligibilityValue("minYearsExperience") === "-"
          ? "-"
          : `${getEligibilityValue("minYearsExperience")} years`,
      icon: Calendar,
    },
    {
      label: "Qualification",
      value: getEligibilityValue("requiredQualification"),
      icon: FileText,
    },
    {
      label: "Language",
      value: getEligibilityValue("requiredLanguage"),
      icon: Users,
    },
    {
      label: "Location",
      value: getEligibilityValue("requiredLocation"),
      icon: MapPin,
    },
    {
      label: "Max Notice Period",
      value:
        getEligibilityValue("maxNoticePeriodDays") === "-"
          ? "-"
          : `${getEligibilityValue("maxNoticePeriodDays")} days`,
      icon: Clock,
    },
    {
      label: "Internship Accepted",
      value:
        eligibility.internshipAccepted === null ||
        eligibility.internshipAccepted === undefined
          ? "-"
          : Number(eligibility.internshipAccepted) === 1
            ? "Yes"
            : "No",
      icon: Check,
    },
  ];

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setHasChanges(newStatus !== initialStatus);
  };

  const handleSave = async () => {
    if (!jobId) return;

    try {
      await apiFetch(`/jobs/${jobId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: currentStatus }),
      });
      toast.success("Job status updated successfully!");
      setInitialStatus(currentStatus);
      setHasChanges(false);
      window.dispatchEvent(
        new CustomEvent("jobStatusUpdated", {
          detail: { jobId, status: currentStatus },
        }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update job status",
      );
    }
  };

  const copyLink = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(job.link || "");
        toast.success("Job link copied to clipboard!");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = job.link || "";
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          toast.success("Job link copied to clipboard!");
        } catch (err) {
          toast.error("Failed to copy to clipboard");
        }
        textArea.remove();
      }
    } catch (err) {
      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = job.link || "";
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Job link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy to clipboard");
      }
      textArea.remove();
    }
  };

  const copyApplicationLink = async () => {
    const appLink = job.link || `${window.location.origin}/apply`;
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(appLink);
        toast.success("Application link copied to clipboard!");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = appLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          toast.success(
            "Application link copied to clipboard!",
          );
        } catch (err) {
          toast.error("Failed to copy to clipboard");
        }
        textArea.remove();
      }
    } catch (err) {
      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = appLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Application link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy to clipboard");
      }
      textArea.remove();
    }
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: job.department, href: `/departments/${encodeURIComponent(job.department)}` },
        { label: job.title },
      ]}
      title={
        <div className="w-full">
          <h1 className="text-3xl font-bold text-slate-900">
            {job.title}
          </h1>

          <div className="flex items-end justify-between gap-4 mt-3">
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {job.department}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Posted{" "}
                {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-9 min-w-[140px] justify-between px-4 ${
                      currentStatus === "active"
                        ? "border-green-600 text-green-700 hover:bg-green-50"
                        : currentStatus === "closed"
                          ? "border-slate-600 text-slate-700 hover:bg-slate-50"
                          : currentStatus === "draft"
                            ? "border-slate-400 text-slate-600 hover:bg-slate-50"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {statusOptions
                      .find(
                        (opt) => opt.value === currentStatus,
                      )
                      ?.label.toUpperCase()}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-[170px]"
                >
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() =>
                        handleStatusChange(option.value)
                      }
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{option.label}</span>
                      {currentStatus === option.value && (
                        <Check className="h-4 w-4 text-[#003B7A]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasChanges && (
                <Button
                  onClick={handleSave}
                  className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-lg px-[20px] py-[8px]"
                >
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>
      }
      useCard={false}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Applicants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {job.applicants}
              </div>
            </CardContent>
          </Card>

            <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {job.avgScore}
              </div>
              <Progress value={job.avgScore} className="mt-2" />
            </CardContent>
          </Card>

            <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">78%</div>
              <Progress value={78} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center w-full">
  <div className="flex items-center gap-2">
    <TabsList>
      <TabsTrigger value="overview">
        Overview
      </TabsTrigger>
      <TabsTrigger value="criteria">
        Screening Setup
      </TabsTrigger>
      <TabsTrigger value="sharing">Sharing</TabsTrigger>
    </TabsList>

    <Button
      className="shadow-none"
      type="button"
      variant="outline"
      onClick={() =>
        navigate(`/jobs/${jobId}/candidates`)
      }
    >
      <Users className="mr-2 h-4 w-4" />
      Candidates ({job.applicants})
    </Button>
  </div>

  <Button
    type="button"
    variant="outline"
    onClick={() =>
      navigate(`/jobs/${jobId}/edit`, {
        state: { job },
      })
    }
    className="ml-auto shadow-sm"
  >
    <Pencil className="mr-2 h-4 w-4" />
    Edit
  </Button>
</div>

          <TabsContent value="overview" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {job.description}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attached Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {job.title.replace(/\s+/g, "_")}_JD.pdf
                      </p>
                      <p className="text-xs text-slate-500">
                        234 KB
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Eligibility Filter</CardTitle>
                <CardDescription>
                  Minimum requirements candidates must meet before ranking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {eligibilityItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="flex min-h-[86px] items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#003B7A]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Ranking Criteria & Weight</CardTitle>
                <CardDescription>
                  Weighted scoring criteria used after eligibility screening
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Total Weight
                    </p>
                    <p className="text-xs text-slate-500">
                      Criteria weight should equal 100%
                    </p>
                  </div>
                  <Badge
                    className={
                      totalCriteriaWeight === 100
                        ? "bg-green-600"
                        : "bg-amber-500"
                    }
                  >
                    {totalCriteriaWeight}%
                  </Badge>
                </div>

                {criteria.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                    No criteria have been set for this job yet.
                  </div>
                ) : (
                  criteria.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="mt-1 text-sm text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-700"
                        >
                          {Number(item.weight)}%
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Application Page</CardTitle>
                <CardDescription>
                  Direct link for candidates to submit their
                  applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={job.link || `${window.location.origin}/apply`}
                    readOnly
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  />
                  <Button 
                    className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5 "
                    onClick={copyApplicationLink}>
                    <Copy 
                      className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>

                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
