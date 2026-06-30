import type { ReactNode } from "react";
import { Award, Calendar, Mail, Phone, Star, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { formatDisplayDate } from "../../lib/date";

export type CandidateStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "interviewed"
  | "filtered_out"
  | "rejected"
  | "withdrawn";

export interface ScoreBreakdownItem {
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

export interface CandidateDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedAt?: string;
}

export interface AppliedJobHistoryItem {
  historyKey: string;
  jobId: string;
  jobTitle: string;
  department: string;
  submittedDate: string;
  score: number;
  rank: number | null;
  status: string;
}

export interface Candidate {
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
  assignedHrUserId?: number | null;
  assignedHrName?: string | null;
  lastEmailType?: string | null;
  lastEmailSentAt?: string | null;
  lastEmailSentBy?: string | null;
  latestRejectActionType?: string | null;
  latestRejectActionBy?: string | null;
  latestEmailActionLogId?: number | null;
  latestEmailReasonType?: string | null;
  latestEmailReasonDetails?: string | null;
  currentSubmissionNo: number;
  currentSubmissionLabel: string;
  experience: string;
  education: string;
  cgpa?: string;
  noticePeriod?: string;
  skills: string[];
  resumeUrl: string;
  documents: CandidateDocument[];
  summary: string;
  scoreBreakdown: ScoreBreakdownItem[];
  score?: number;
  appliedJobHistory?: AppliedJobHistoryItem[];
}

export const getCandidateStatusColor = (status: string) => {
  switch (status) {
    case "interviewed":
      return "bg-sky-700";
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
    case "withdrawn":
      return "bg-slate-400";
    default:
      return "bg-slate-600";
  }
};

export const getCandidateStatusLabel = (status: string) => {
  switch (status) {
    case "filtered_out":
      return "FILTERED OUT";
    case "interviewed":
      return "INTERVIEWED";
    case "withdrawn":
      return "WITHDRAWN";
    default:
      return status.replace(/_/g, " ").toUpperCase();
  }
};

interface CandidateCardProps {
  candidate: Candidate;
  isExpanded: boolean;
  isShortlisted: boolean;
  hasInterviewSent: boolean;
  displayScore: number;
  scorePercentage: number;
  totalMaxScore: number;
  scoreColor: string;
  onToggleShortlist: (candidate: Candidate) => void;
  children: ReactNode;
}

export function CandidateCard({
  candidate,
  isExpanded,
  isShortlisted,
  hasInterviewSent,
  displayScore,
  scorePercentage,
  totalMaxScore,
  scoreColor,
  onToggleShortlist,
  children,
}: CandidateCardProps) {
  return (
    <Card
      className={`shadow-md transition-all duration-200 ${
        isExpanded
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
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>

                    {candidate.status !== "rejected" &&
                      candidate.status !== "withdrawn" && (
                        <button
                          type="button"
                          onClick={() => onToggleShortlist(candidate)}
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

                  <Badge className={getCandidateStatusColor(candidate.status)}>
                    {getCandidateStatusLabel(candidate.status)}
                  </Badge>
                  {isShortlisted &&
                    candidate.status !== "shortlisted" &&
                    candidate.status !== "rejected" &&
                    candidate.status !== "withdrawn" && (
                      <Badge className="bg-amber-500">SHORTLISTED</Badge>
                    )}
                  {hasInterviewSent &&
                    candidate.status !== "interview" &&
                    candidate.status !== "interviewed" && (
                      <Badge className="bg-blue-600">INTERVIEW</Badge>
                    )}
                  {candidate.currentSubmissionNo > 1 && (
                    <Badge className="bg-slate-600">
                      {getCandidateStatusLabel(candidate.currentSubmissionLabel)}
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
                    {formatDisplayDate(candidate.appliedDate)}
                  </div>

                  {candidate.experience && (
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {candidate.experience} experience
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">RANK</div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">
                    {candidate.status === "filtered_out" ||
                    candidate.status === "rejected" ||
                    candidate.status === "withdrawn" ||
                    candidate.rank === null
                      ? "-"
                      : `#${candidate.rank}`}
                  </span>
                  {candidate.status !== "filtered_out" &&
                    candidate.status !== "rejected" &&
                    candidate.status !== "withdrawn" &&
                    candidate.rank !== null &&
                    candidate.rank <= 3 && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">SCORE</div>

                <div className="flex items-center justify-center gap-1">
                  <span className={`text-2xl font-bold ${scoreColor}`}>
                    {displayScore}
                  </span>

                  {scorePercentage >= 90 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : scorePercentage < 75 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  / {totalMaxScore}
                </div>
              </div>
            </div>
          </div>

          {children}
        </div>
      </CardContent>
    </Card>
  );
}
