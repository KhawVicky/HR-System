import { useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "react-router";
import { PageLayout } from "./PageLayout";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import {
  Search,
  Mail,
  Phone,
  Calendar,
  Award,
  FileText,
  Star,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type CandidateStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "filtered_out"
  | "rejected";

interface ScoreBreakdownItem {
  id: string;
  title: string;
  justification: string;
  criteriaScore: number;
  weight: number;
  weightedScore?: number;
  maxWeightedScore?: number;
  color: string;
  badgeColor: string;
}

interface Candidate {
  id: string;
  applicationId?: string;
  name: string;
  email: string;
  phone: string;
  appliedDate: string;
  rank: number | null;
  status: CandidateStatus;
  isShortlisted: boolean;
  interviewSentAt?: string | null;
  experience: string;
  education: string;
  cgpa?: string;
  noticePeriod?: string;
  skills: string[];
  resumeUrl: string;
  summary: string;
  scoreBreakdown: ScoreBreakdownItem[];
  score?: number;
  appliedJobHistory?: {
  jobId: string;
  jobTitle: string;
  department: string;
  score: number;
  rank: number | null;
  status: CandidateStatus;
}[];
}

const normalizeWeightsTo100 = <T extends { weight: number }>(
  items: T[],
): T[] => {
  if (!items.length) return [];

  const totalOriginalWeight = items.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  if (totalOriginalWeight === 0) {
    const evenWeight = Math.floor(100 / items.length);
    const remainder = 100 - evenWeight * items.length;

    return items.map((item, index) => ({
      ...item,
      weight: evenWeight + (index < remainder ? 1 : 0),
    }));
  }

  const normalized = items.map((item) => ({
    ...item,
    weight: Math.floor(
      (item.weight / totalOriginalWeight) * 100,
    ),
  }));

  let assignedTotal = normalized.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  let diff = 100 - assignedTotal;
  let index = 0;

  while (diff !== 0 && normalized.length > 0) {
    const item = normalized[index % normalized.length];

    if (diff > 0) {
      item.weight += 1;
      diff -= 1;
    } else if (diff < 0 && item.weight > 1) {
      item.weight -= 1;
      diff += 1;
    }

    index++;

    if (index > 1000) break;
  }

  return normalized;
};

const calculateScoreBreakdown = (
  scoreBreakdown: ScoreBreakdownItem[],
) => {
  return normalizeWeightsTo100(scoreBreakdown).map((item) => ({
    ...item,
    weightedScore: Number(
      ((item.criteriaScore / 100) * item.weight).toFixed(1),
    ),
    maxWeightedScore: item.weight,
  }));
};

const calculateTotalScore = (
  scoreBreakdown: ScoreBreakdownItem[],
) => {
  return Number(
    scoreBreakdown
      .reduce((sum, item) => sum + (item.weightedScore ?? 0), 0)
      .toFixed(1),
  );
};

type ApiCandidate = {
  applicationId: number;
  id: number;
  name: string;
  email: string;
  phone: string;
  cgpa: string | number | null;
  noticePeriodDays: string | number | null;
  appliedDate: string;
  rank: string | number | null;
  status: CandidateStatus;
  isShortlisted: boolean | number | string;
  interviewSentAt: string | null;
  eligibilityStatus: string;
  eligibilityReason: string | null;
  score: string | number | null;
  summary: string | null;
  resumeUrl: string | null;
  skills: { name: string }[];
  scoreBreakdown: {
    id: number;
    title: string;
    justification: string;
    criteriaScore: string | number;
    weight: string | number;
    weightedScore: string | number;
  }[];
  jobHistory: {
    jobId: number;
    jobTitle: string;
    department: string;
    score: string | number;
    rank: string | number | null;
    status: CandidateStatus;
  }[];
};

const scoreColors = [
  { color: "bg-violet-500", badgeColor: "text-violet-700 bg-violet-100" },
  { color: "bg-sky-500", badgeColor: "text-sky-700 bg-sky-100" },
  { color: "bg-orange-500", badgeColor: "text-orange-700 bg-orange-100" },
  { color: "bg-green-500", badgeColor: "text-green-700 bg-green-100" },
];

const CANDIDATES_PER_PAGE = 15;

const formatDateOnly = (value: string) => value.slice(0, 10);

const mapApiCandidate = (candidate: ApiCandidate): Candidate => {
  const scoreBreakdown = calculateScoreBreakdown(
    (candidate.scoreBreakdown ?? []).map((item, index) => ({
      id: String(item.id),
      title: item.title,
      justification: item.justification,
      criteriaScore: Number(item.criteriaScore),
      weight: Number(item.weight),
      weightedScore: Number(item.weightedScore),
      maxWeightedScore: Number(item.weight),
      ...scoreColors[index % scoreColors.length],
    })),
  );

  return {
    id: String(candidate.id),
    applicationId: String(candidate.applicationId),
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    appliedDate: formatDateOnly(candidate.appliedDate),
    rank: candidate.rank === null ? null : Number(candidate.rank),
    status: candidate.status,
    isShortlisted:
      candidate.status === "shortlisted" ||
      candidate.status === "interview" ||
      candidate.isShortlisted === true ||
      candidate.isShortlisted === 1 ||
      candidate.isShortlisted === "1",
    interviewSentAt:
      candidate.interviewSentAt ||
      (candidate.status === "interview" ? candidate.appliedDate : null),
    experience: candidate.eligibilityReason || "Resume parsed from database",
    education: candidate.eligibilityStatus === "eligible" ? "Meets eligibility filter" : "Filtered out by eligibility filter",
    cgpa: candidate.cgpa === null ? "-" : String(candidate.cgpa),
    noticePeriod: candidate.noticePeriodDays
      ? `${candidate.noticePeriodDays} days`
      : "-",
    skills: (candidate.skills ?? []).map((skill) => skill.name),
    resumeUrl: candidate.resumeUrl || "#",
    summary: candidate.summary || "This candidate has been evaluated by the system and is ready for HR review.",
    scoreBreakdown,
    score: Number(candidate.score ?? calculateTotalScore(scoreBreakdown)),
    appliedJobHistory: (candidate.jobHistory ?? []).map((history) => ({
      jobId: String(history.jobId),
      jobTitle: history.jobTitle,
      department: history.department,
      score: Number(history.score),
      rank: history.rank === null ? null : Number(history.rank),
      status: history.status,
    })),
  };
};
const recalculateRanks = (candidateList: Candidate[]) => {
  const rankableStatuses: CandidateStatus[] = [
    "new",
    "reviewed",
    "shortlisted",
    "interview",
  ];

  const sortedRankable = [...candidateList]
    .filter((candidate) =>
      rankableStatuses.includes(candidate.status),
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return candidateList.map((candidate) => {
    if (!rankableStatuses.includes(candidate.status)) {
      return {
        ...candidate,
        rank: null,
      };
    }

    const newRank =
      sortedRankable.findIndex(
        (item) => item.id === candidate.id,
      ) + 1;

    return {
      ...candidate,
      rank: newRank,
    };
  });
};

export function CandidateList() {
  const { jobId } = useParams();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobTitle, setJobTitle] = useState("Candidates");
  const [department, setDepartment] = useState("Department");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  const [currentPage, setCurrentPage] = useState(1);

  const [expandedCandidate, setExpandedCandidate] = useState<
    string | null
  >(null);

  const [interviewPopupCandidate, setInterviewPopupCandidate] =
    useState<Candidate | null>(null);

  const [interviewDateTime, setInterviewDateTime] =
    useState("");

  useEffect(() => {
    if (!jobId) return;

    apiFetch<{
      job: { title: string; department: string };
      candidates: ApiCandidate[];
    }>(`/jobs/${jobId}/candidates`)
      .then((data) => {
        setJobTitle(data.job.title);
        setDepartment(data.job.department);
        setCandidates(
          recalculateRanks(data.candidates.map(mapApiCandidate)),
        );
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load candidates",
        ),
      );
  }, [jobId]);

  const getTotalWeightedScore = (
    scoreBreakdown: ScoreBreakdownItem[],
  ) => calculateTotalScore(scoreBreakdown);

  const getTotalMaxScore = () => 100;

  const getScorePercentage = (
    scoreBreakdown: ScoreBreakdownItem[],
  ) => {
    return Math.round(getTotalWeightedScore(scoreBreakdown));
  };

  const handleInternalResumeUpload = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF resume file only");
      event.target.value = "";
      return;
    }

    const randomNames = [
      "Jason Lee",
      "Michelle Tan",
      "Daniel Wong",
      "Samantha Lim",
      "Kevin Goh",
      "Rachel Ong",
    ];

    const candidateName =
      randomNames[
        Math.floor(Math.random() * randomNames.length)
      ];

    const scoreBreakdown = calculateScoreBreakdown([
      {
        id: "c1",
        title: "Frontend framework proficiency",
        justification:
          "The resume was uploaded internally by HR. The system will analyse the resume and update this score based on the extracted skills.",
        criteriaScore: 70,
        weight: 40,
        color: "bg-violet-500",
        badgeColor: "text-violet-700 bg-violet-100",
      },
      {
        id: "c2",
        title: "Backend and integration skills",
        justification:
          "The resume was uploaded internally by HR. Backend and integration skills will be checked based on the resume content.",
        criteriaScore: 60,
        weight: 30,
        color: "bg-sky-500",
        badgeColor: "text-sky-700 bg-sky-100",
      },
      {
        id: "c3",
        title: "Overall technical fit for the role",
        justification:
          "The resume was uploaded internally by HR. The overall fit is estimated first and can be updated after resume parsing.",
        criteriaScore: 60,
        weight: 30,
        color: "bg-orange-500",
        badgeColor: "text-orange-700 bg-orange-100",
      },
    ]);

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: candidateName,
      email: "uploaded.candidate@email.com",
      phone: "-",
      appliedDate: new Date().toISOString().split("T")[0],
      rank: null,
      status: "new",
      isShortlisted: false,
      interviewSentAt: null,
      experience: "Pending analysis",
      education: "Pending analysis",
      cgpa: "-",
      skills: ["Pending analysis"],
      resumeUrl: URL.createObjectURL(file),
      summary:
        "This candidate resume was uploaded internally by HR. The resume will be analysed by the system and included in the candidate ranking list.",
      scoreBreakdown,
      score: calculateTotalScore(scoreBreakdown),
    };

    setCandidates((prev) =>
      recalculateRanks([...prev, newCandidate]),
    );

    toast.success("Resume uploaded and added to ranking list");
    event.target.value = "";
  };

  const filteredCandidates = candidates
    .filter((candidate) => {
      const matchesSearch =
        candidate.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        candidate.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "shortlisted" &&
          candidate.isShortlisted) ||
        (filterStatus === "interview" &&
          Boolean(candidate.interviewSentAt)) ||
        candidate.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.score ?? -1) - (a.score ?? -1);
      }

      if (sortBy === "date") {
        return (
          new Date(b.appliedDate).getTime() -
          new Date(a.appliedDate).getTime()
        );
      }

      const rankA =
        a.status === "filtered_out" ||
        a.status === "rejected" ||
        a.rank === null
          ? Number.MAX_SAFE_INTEGER
          : a.rank;

      const rankB =
        b.status === "filtered_out" ||
        b.status === "rejected" ||
        b.rank === null
          ? Number.MAX_SAFE_INTEGER
          : b.rank;

      return rankA - rankB;
    });
  const pageCount = Math.max(
    1,
    Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE),
  );
  const pagedCandidates = filteredCandidates.slice(
    (currentPage - 1) * CANDIDATES_PER_PAGE,
    currentPage * CANDIDATES_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, sortBy, jobId]);

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case "interview":
        return "bg-blue-600";
      case "reviewed":
        return "bg-green-600";
      case "shortlisted":
        return "bg-amber-500";
      case "new":
        return "bg-yellow-600";
      case "rejected":
        return "bg-red-600";
      case "filtered_out":
        return "bg-slate-500";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusLabel = (status: CandidateStatus) => {
    switch (status) {
      case "filtered_out":
        return "FILTERED OUT";
      default:
        return status.toUpperCase();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";

    return "text-slate-600";
  };

  const updateCandidateStatus = async (
    candidateId: string,
    newStatus: CandidateStatus,
  ) => {
    const target = candidates.find(
      (candidate) => candidate.id === candidateId,
    );

    setCandidates((prev) => {
      const updated = prev.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status:
                newStatus === "shortlisted" ||
                newStatus === "reviewed"
                  ? candidate.status === "interview"
                    ? "interview"
                    : newStatus
                  : newStatus,
              isShortlisted:
                newStatus === "shortlisted"
                  ? true
                  : newStatus === "reviewed" ||
                      newStatus === "rejected"
                    ? false
                    : newStatus === "interview"
                      ? true
                      : candidate.isShortlisted,
              interviewSentAt:
                newStatus === "interview"
                  ? candidate.interviewSentAt ||
                    new Date().toISOString()
                  : candidate.interviewSentAt,
            }
          : candidate,
      );

      return recalculateRanks(updated);
    });

    if (!target?.applicationId) return;

    try {
      await apiFetch(`/applications/${target.applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update candidate status",
      );
    }
  };

  const handleViewDetails = (candidate: Candidate) => {
    const isOpening = expandedCandidate !== candidate.id;

    setExpandedCandidate((prev) =>
      prev === candidate.id ? null : candidate.id,
    );

    if (isOpening && candidate.status === "new") {
      updateCandidateStatus(candidate.id, "reviewed");
      toast.success(`${candidate.name} marked as reviewed`);
    }
  };

  const handleToggleShortlist = (candidate: Candidate) => {
    if (candidate.status === "rejected") return;

    const newStatus: CandidateStatus =
      candidate.isShortlisted
        ? "reviewed"
        : "shortlisted";

    updateCandidateStatus(candidate.id, newStatus);

    toast.success(
      newStatus === "shortlisted"
        ? `${candidate.name} shortlisted`
        : `${candidate.name} removed from shortlisted`,
    );
  };

  const handleSendInterviewEmail = (candidate: Candidate) => {
    setInterviewPopupCandidate(candidate);
    setInterviewDateTime("");
  };

  const handleConfirmSendInterviewEmail = () => {
    if (!interviewPopupCandidate) return;

    if (!interviewDateTime) {
      toast.error("Please select the interview date and time");
      return;
    }

    updateCandidateStatus(
      interviewPopupCandidate.id,
      "interview",
    );

    toast.success(
      `Interview email sent to ${interviewPopupCandidate.name}`,
    );

    setInterviewPopupCandidate(null);
    setInterviewDateTime("");
  };

  const handleRejectCandidate = (candidate: Candidate) => {
    updateCandidateStatus(candidate.id, "rejected");
    toast.success(`Rejection email sent to ${candidate.name}`);
  };

  const downloadResume = (candidate: Candidate) => {
    if (candidate.resumeUrl && candidate.resumeUrl !== "#") {
      window.open(candidate.resumeUrl, "_blank");
      return;
    }

    toast.success(`Downloading ${candidate.name}'s resume...`);
  };

  const renderSummary = (
    summary: string,
    candidate: Candidate,
  ) => {
    const keywords = [
      candidate.name,
      candidate.experience,
      candidate.education,
      candidate.noticePeriod,
      ...candidate.skills,
      "Mandarin",
      "Bahasa Malaysia",
      "English",
    ].filter((keyword): keyword is string => Boolean(keyword));

    const escapedKeywords = [...new Set(keywords)]
      .sort((a, b) => b.length - a.length)
      .map((keyword) =>
        keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      );

    const cgpaMatch = summary.match(/CGPA of ([0-9.]+)/i);
    const cgpaValue = cgpaMatch ? cgpaMatch[1] : null;

    const allKeywords = cgpaValue
      ? [
          ...escapedKeywords,
          cgpaValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ]
      : escapedKeywords;

    if (allKeywords.length === 0) return summary;

    const regex = new RegExp(`(${allKeywords.join("|")})`, "g");
    const parts = summary.split(regex);

    return parts.map((part, index) => {
      const isNormalKeyword = keywords.includes(part);
      const isCgpaNumber = part === cgpaValue;

      if (isNormalKeyword || isCgpaNumber) {
        return (
          <strong
            key={`kw-${index}`}
            className="font-semibold text-slate-900"
          >
            {part}
          </strong>
        );
      }

      return <span key={`pt-${index}`}>{part}</span>;
    });
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        {
          label: department,
          href: `/departments/${encodeURIComponent(department)}`,
        },
        { label: jobTitle, href: `/jobs/${jobId}` },
        { label: "Candidates" },
      ]}
      useCard={false}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Candidates
        </h1>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg text-[#1f4770]">{jobTitle}</p>

          <div>
            <input
              id="internal-resume-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleInternalResumeUpload}
            />

            <Button
              className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
              onClick={() =>
                document
                  .getElementById("internal-resume-upload")
                  ?.click()
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">
                    Reviewed
                  </SelectItem>
                  <SelectItem value="shortlisted">
                    Shortlisted
                  </SelectItem>
                  <SelectItem value="interview">
                    Interview
                  </SelectItem>
                  <SelectItem value="filtered_out">
                    Filtered Out
                  </SelectItem>
                  <SelectItem value="rejected">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">
                    Highest Score
                  </SelectItem>
                  <SelectItem value="rank">
                    Best Rank
                  </SelectItem>
                  <SelectItem value="date">
                    Most Recent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidates.length}
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
            <div className="text-2xl font-bold">
              {candidates.length === 0
                ? 0
                : Math.round(
                    candidates.reduce(
                      (sum, candidate) =>
                        sum + (candidate.score ?? 0),
                      0,
                    ) / candidates.length,
                  )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              In Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                candidates.filter(
                  (candidate) =>
                    Boolean(candidate.interviewSentAt),
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Shortlisted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                candidates.filter(
                  (candidate) => candidate.isShortlisted,
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {pagedCandidates.map((candidate) => {
          const isShortlisted = candidate.isShortlisted;
          const hasInterviewSent = Boolean(
            candidate.interviewSentAt,
          );

          return (
            <Card
              key={candidate.id}
              className={`shadow-md transition-all duration-200 ${
                expandedCandidate === candidate.id
                  ? "shadow-lg border-[#cfd8e3]"
                  : "hover:shadow-lg border-[#cfd8e3]"
              }`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {candidate.name
                            .split(" ")
                            .map((namePart) => namePart[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {candidate.name}
                            </h3>

                            {candidate.status !==
                              "rejected" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleShortlist(
                                    candidate,
                                  )
                                }
                                className="inline-flex items-center justify-center"
                                title={
                                  isShortlisted
                                    ? "Remove from shortlisted"
                                    : "Add to shortlisted"
                                }
                              >
                                <Star
                                  className={`w-4 h-4 transition-colors ${
                                    isShortlisted
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-slate-300 hover:text-yellow-500"
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          <Badge
                            className={getStatusColor(
                              candidate.status,
                            )}
                          >
                            {getStatusLabel(candidate.status)}
                          </Badge>
                          {isShortlisted &&
                            candidate.status !== "shortlisted" &&
                            candidate.status !== "rejected" && (
                              <Badge className="bg-amber-500">
                                SHORTLISTED
                              </Badge>
                            )}
                          {hasInterviewSent &&
                            candidate.status !== "interview" && (
                              <Badge className="bg-blue-600">
                                INTERVIEW
                              </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {candidate.email}
                          </div>

                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {candidate.phone}
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              candidate.appliedDate,
                            ).toLocaleDateString()}
                          </div>

                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {candidate.experience} experience
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">
                          RANK
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold">
                            {candidate.status ===
                              "filtered_out" ||
                            candidate.status === "rejected" ||
                            candidate.rank === null
                              ? "-"
                              : `#${candidate.rank}`}
                          </span>
                          {candidate.status !==
                            "filtered_out" &&
                            candidate.status !== "rejected" &&
                            candidate.rank !== null &&
                            candidate.rank <= 3 && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">
                          SCORE
                        </div>

                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`text-2xl font-bold ${getScoreColor(
                              getScorePercentage(
                                candidate.scoreBreakdown,
                              ),
                            )}`}
                          >
                            {getTotalWeightedScore(
                              candidate.scoreBreakdown,
                            )}
                          </span>

                          {getScorePercentage(
                            candidate.scoreBreakdown,
                          ) >= 90 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : getScorePercentage(
                              candidate.scoreBreakdown,
                            ) < 75 ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : null}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          / {getTotalMaxScore()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedCandidate === candidate.id && (
                    <div className="pt-4 border-t border-slate-200 space-y-5">
                      <div>
                        <div className="font-medium mb-2 text-[22px] text-[#0f172b]">
                          Candidate Summary
                        </div>
                        <div className="text-slate-600 text-[15px] rounded-2xl border border-slate-200 bg-[#f5f9ff] p-5">
                          {renderSummary(
                            candidate.summary || "",
                            candidate,
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-end justify-between mb-4">
                          <h4 className="text-[22px] font-semibold text-slate-900">
                            Score Breakdown
                          </h4>

                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-sm text-slate-500">
                              <span>Total Score</span>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center text-slate-400 hover:text-slate-600"
                                    >
                                      <Info className="w-4 h-4" />
                                    </button>
                                  </TooltipTrigger>

                                  <TooltipContent
                                    side="top"
                                    className="max-w-[320px] text-sm leading-6"
                                  >
                                    Total score is calculated by
                                    adding the weighted scores
                                    of all criteria. Each
                                    criterion score is based on
                                    100 and adjusted according
                                    to its assigned weight. The
                                    maximum total score is 100.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            <div className="text-[20px] font-bold text-green-600 leading-none mt-1">
                              {getTotalWeightedScore(
                                candidate.scoreBreakdown,
                              )}
                              <span className="text-slate-400 font-medium">
                                {" "}
                                / {getTotalMaxScore()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {candidate.scoreBreakdown.map(
                            (item, index) => (
                              <div
                                key={`${candidate.id}-${item.id}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-[#f5f9ff] p-5"
                              >
                                <div className="flex gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <h5 className="text-[18px] font-semibold text-slate-900">
                                        Criteria {index + 1}:{" "}
                                        {item.title}
                                      </h5>

                                      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                                        <span className="text-sm font-medium text-slate-500">
                                          Weight: {item.weight}
                                        </span>

                                        <div className="inline-flex items-center rounded-lg bg-[#dfeeff] px-3 py-1.5">
                                          <span className="text-sm font-semibold text-[#003B7A]">
                                            Criteria Score:{" "}
                                            {item.criteriaScore}
                                            /100
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <p className="mt-4 text-[15px] text-slate-600">
                                      <span className="font-semibold text-slate-900">
                                        Score Justification:
                                      </span>{" "}
                                      {item.justification}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      {candidate.appliedJobHistory &&
  candidate.appliedJobHistory.length > 0 && (
    <div>
      <div className="font-medium mb-2 text-[22px] text-[#0f172b]">
        Applied Job History
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-5 bg-[#f5f9ff] px-5 py-3 text-sm font-semibold text-slate-700">
          <div className="col-span-2">Job Title</div>
          <div>Score</div>
          <div>Rank</div>
          <div>Status</div>
        </div>

        {candidate.appliedJobHistory.map((job) => (
          <div
            key={`${candidate.id}-${job.jobId}`}
            className="grid grid-cols-5 items-center border-t border-slate-200 px-5 py-4 text-sm"
          >
            <div className="col-span-2">
              <a
                href={`/jobs/${job.jobId}/candidates?candidateId=${candidate.id}`}
                className="font-semibold text-[#003B7A] hover:underline"
              >
                {job.jobTitle}
              </a>
              <p className="mt-1 text-xs text-slate-500">
                {job.department}
              </p>
            </div>

            <div className="font-semibold text-slate-800">
              {job.score}
            </div>

            <div className="font-semibold text-slate-800">
              {job.rank === null ? "-" : `#${job.rank}`}
            </div>

            <div>
              <Badge className={getStatusColor(job.status)}>
                {getStatusLabel(job.status)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewDetails(candidate)
                        }
                      >
                        {expandedCandidate === candidate.id ? (
                          <>
                            Show Less
                            <ChevronUp className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            View Details
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadResume(candidate)
                        }
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
                        onClick={() =>
                          handleSendInterviewEmail(candidate)
                        }
                        disabled={
                          candidate.status === "rejected" ||
                          hasInterviewSent
                        }
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {hasInterviewSent
                          ? "Interview Email Sent"
                          : "Send Interview Email"}
                      </Button>

                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm px-5"
                        onClick={() =>
                          handleRejectCandidate(candidate)
                        }
                        disabled={
                          candidate.status === "filtered_out" ||
                          candidate.status === "rejected"
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">
                No candidates match your search criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {filteredCandidates.length > CANDIDATES_PER_PAGE && (
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
            {Array.from({ length: pageCount }).map((_, index) => {
              const page = index + 1;

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage(page);
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

      {interviewPopupCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Interview Email Preview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the draft email and enter the interview
                date and time before sending.
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <label
                  htmlFor="interviewDateTime"
                  className="text-sm font-medium text-slate-700"
                >
                  Interview Date and Time *
                </label>
                <Input
                  id="interviewDateTime"
                  type="text"
                  placeholder="Example: 20/52026, 10:00 AM / 21/5/2026, 2:30 PM / 22/5/2026, 11:00 AM"
                  value={interviewDateTime}
                  onChange={(e) =>
                    setInterviewDateTime(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  readOnly
                  rows={13}
                  className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  value={`Subject: Interview invitation for ${jobTitle}

Dear ${interviewPopupCandidate.name},

We would like to invite you for an interview for the ${jobTitle} position.

Available interview date and time options: ${
                    interviewDateTime ||
                    "{interviewDateOptions}"
                  }

Please reply to this email with your preferred interview time. Also, please complete the attached file and reply to this email before attending the interview.

Regards,
UWC Berhad`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInterviewPopupCandidate(null);
                  setInterviewDateTime("");
                }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-[#003B7A] hover:bg-[#002f63] text-white"
                onClick={handleConfirmSendInterviewEmail}
              >
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}


