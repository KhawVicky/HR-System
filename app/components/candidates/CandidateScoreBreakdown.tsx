import { Info } from "lucide-react";
import type { Candidate } from "./CandidateCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface CandidateScoreBreakdownProps {
  candidate: Candidate;
  displayScore: number;
  totalMaxScore: number;
}

export function CandidateScoreBreakdown({
  candidate,
  displayScore,
  totalMaxScore,
}: CandidateScoreBreakdownProps) {
  return (
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
                  Total score is calculated by adding the weighted scores of all
                  criteria. Each criterion score is based on 100 and adjusted
                  according to its assigned weight. The maximum total score is
                  100.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-[20px] font-bold text-green-600 leading-none mt-1">
            {displayScore}
            <span className="text-slate-400 font-medium">
              {" "}
              / {totalMaxScore}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {candidate.scoreBreakdown.map((item, index) => (
          <div
            key={`${candidate.id}-${item.id}-${index}`}
            className="rounded-2xl border border-slate-200 bg-[#f5f9ff] p-5"
          >
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h5 className="text-[18px] font-semibold text-slate-900">
                    Criteria {index + 1}: {item.title}
                  </h5>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                    <span className="text-sm font-medium text-slate-500">
                      Weight: {item.weight}
                    </span>

                    <div className="inline-flex items-center rounded-lg bg-[#dfeeff] px-3 py-1.5">
                      <span className="text-sm font-semibold text-[#003B7A]">
                        Criteria Score: {item.criteriaScore}/100
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
        ))}
      </div>
    </div>
  );
}
