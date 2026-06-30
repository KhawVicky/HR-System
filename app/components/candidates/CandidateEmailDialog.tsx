import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { Candidate } from "./CandidateCard";

interface CandidateEmailDialogProps {
  jobTitle: string;
  interviewCandidate: Candidate | null;
  rejectCandidate: Candidate | null;
  reasonCandidate: Candidate | null;
  interviewDateTime: string;
  sendRejectEmail: boolean;
  rejectEmailStep: 1 | 2;
  rejectEmailPreview: { subject: string; body: string } | null;
  rejectReasonType: string;
  rejectReasonDetails: string;
  sendingEmailCandidateIds: Set<string>;
  renderReasonFields: (
    reasonType: string,
    setReasonType: (value: string) => void,
    reasonDetails: string,
    setReasonDetails: (value: string) => void,
  ) => React.ReactNode;
  onInterviewDateTimeChange: (value: string) => void;
  onSendRejectEmailChange: (value: boolean) => void;
  onRejectEmailStepChange: (value: 1 | 2) => void;
  onRejectReasonTypeChange: (value: string) => void;
  onRejectReasonDetailsChange: (value: string) => void;
  onCloseInterview: () => void;
  onCloseReject: () => void;
  onCloseReason: () => void;
  onConfirmInterview: () => void;
  onConfirmReject: () => void;
  onSaveReason: () => void;
}

export function CandidateEmailDialog({
  jobTitle,
  interviewCandidate,
  rejectCandidate,
  reasonCandidate,
  interviewDateTime,
  sendRejectEmail,
  rejectEmailStep,
  rejectEmailPreview,
  rejectReasonType,
  rejectReasonDetails,
  sendingEmailCandidateIds,
  renderReasonFields,
  onInterviewDateTimeChange,
  onSendRejectEmailChange,
  onRejectEmailStepChange,
  onRejectReasonTypeChange,
  onRejectReasonDetailsChange,
  onCloseInterview,
  onCloseReject,
  onCloseReason,
  onConfirmInterview,
  onConfirmReject,
  onSaveReason,
}: CandidateEmailDialogProps) {
  return (
    <>
      {interviewCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onCloseInterview}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Interview Email Preview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the draft email and enter the interview date and time
                before sending.
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
                  placeholder="Example: 20/05/2026, 10:00 AM / 21/05/2026, 2:30 PM / 22/05/2026, 11:00 AM"
                  value={interviewDateTime}
                  onChange={(event) =>
                    onInterviewDateTimeChange(event.target.value)
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

Dear ${interviewCandidate.name},

We would like to invite you for an interview for the ${jobTitle} position.

Available interview date and time options: ${
                    interviewDateTime || "{interviewDateOptions}"
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
                disabled={sendingEmailCandidateIds.has(interviewCandidate.id)}
                onClick={onCloseInterview}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-[#003B7A] hover:bg-[#002f63] text-white"
                disabled={sendingEmailCandidateIds.has(interviewCandidate.id)}
                onClick={onConfirmInterview}
              >
                {sendingEmailCandidateIds.has(interviewCandidate.id)
                  ? "Sending..."
                  : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onCloseReject}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {rejectEmailStep === 1
                  ? "Rejection Email Preview"
                  : "Provide Reason"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {rejectEmailStep === 1
                  ? "Review the rejection action before confirming."
                  : "Please provide a reason for rejecting this candidate."}
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {rejectEmailStep === 1 ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      id="sendRejectEmail"
                      type="checkbox"
                      checked={sendRejectEmail}
                      onChange={(event) =>
                        onSendRejectEmailChange(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <label
                      htmlFor="sendRejectEmail"
                      className="text-sm font-medium text-slate-700"
                    >
                      Send rejection email to candidate
                    </label>
                  </div>

                  {sendRejectEmail && rejectEmailPreview && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Message
                      </label>
                      <textarea
                        readOnly
                        rows={11}
                        className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        value={`Subject: ${rejectEmailPreview.subject}\n\n${rejectEmailPreview.body}`}
                      />
                    </div>
                  )}
                </>
              ) : (
                renderReasonFields(
                  rejectReasonType,
                  onRejectReasonTypeChange,
                  rejectReasonDetails,
                  onRejectReasonDetailsChange,
                )
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={sendingEmailCandidateIds.has(rejectCandidate.id)}
                onClick={onCloseReject}
              >
                Cancel
              </Button>

              {rejectEmailStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingEmailCandidateIds.has(rejectCandidate.id)}
                  onClick={() => onRejectEmailStepChange(1)}
                >
                  Back
                </Button>
              )}

              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={sendingEmailCandidateIds.has(rejectCandidate.id)}
                onClick={
                  rejectEmailStep === 1
                    ? () => onRejectEmailStepChange(2)
                    : onConfirmReject
                }
              >
                {sendingEmailCandidateIds.has(rejectCandidate.id)
                  ? "Sending..."
                  : rejectEmailStep === 1
                    ? "Next"
                    : sendRejectEmail
                      ? "Send Email"
                      : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {reasonCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onCloseReason}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Add Reason
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add an optional reason for the latest email action.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {renderReasonFields(
                rejectReasonType,
                onRejectReasonTypeChange,
                rejectReasonDetails,
                onRejectReasonDetailsChange,
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button type="button" variant="outline" onClick={onCloseReason}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={onSaveReason}
              >
                Save Reason
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
