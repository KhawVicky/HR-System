import { ChevronDown, ChevronUp, FileText, Mail } from "lucide-react";
import type { Candidate } from "./CandidateCard";
import { Button } from "../ui/button";

interface CandidateActionsProps {
  candidate: Candidate;
  isExpanded: boolean;
  hasInterviewSent: boolean;
  isInterviewCompleted: boolean;
  isEmailSending: boolean;
  needsReason: boolean;
  onViewDetails: (candidate: Candidate) => void;
  onOpenDocuments: (candidate: Candidate) => void;
  onSendInterviewEmail: (candidate: Candidate) => void;
  onMarkInterviewed: (candidate: Candidate) => void;
  onRejectCandidate: (candidate: Candidate) => void;
  onOpenReason: (candidate: Candidate) => void;
}

export function CandidateActions({
  candidate,
  isExpanded,
  hasInterviewSent,
  isInterviewCompleted,
  isEmailSending,
  needsReason,
  onViewDetails,
  onOpenDocuments,
  onSendInterviewEmail,
  onMarkInterviewed,
  onRejectCandidate,
  onOpenReason,
}: CandidateActionsProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(candidate)}
        >
          {isExpanded ? (
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
          onClick={() => onOpenDocuments(candidate)}
        >
          <FileText className="w-4 h-4 mr-2" />
          Resume
        </Button>
      </div>

      <div className="flex gap-2">
        {candidate.status !== "rejected" && candidate.status !== "withdrawn" && (
          <>
            <Button
              className={`text-white shadow-sm px-5 ${
                hasInterviewSent || isInterviewCompleted
                  ? "bg-sky-700 hover:bg-sky-800 disabled:bg-sky-700 disabled:opacity-60"
                  : "bg-[#003B7A] hover:bg-[#002f63]"
              }`}
              onClick={() => {
                if (!hasInterviewSent) {
                  onSendInterviewEmail(candidate);
                  return;
                }

                onMarkInterviewed(candidate);
              }}
              disabled={
                isEmailSending ||
                candidate.status === "filtered_out" ||
                isInterviewCompleted
              }
            >
              <Mail className="w-4 h-4 mr-2" />
              {isEmailSending
                ? "Sending..."
                : isInterviewCompleted
                  ? "Interview Completed"
                  : hasInterviewSent
                    ? "Mark as Interviewed"
                    : "Send Interview Email"}
            </Button>

            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm px-5"
              onClick={() => onRejectCandidate(candidate)}
              disabled={isEmailSending}
            >
              {isEmailSending ? "Sending..." : "Reject"}
            </Button>
          </>
        )}

        {candidate.status === "rejected" && needsReason && (
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm px-4"
            onClick={() => onOpenReason(candidate)}
            disabled={isEmailSending}
          >
            Add Reason
          </Button>
        )}
      </div>
    </div>
  );
}
