import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { toast } from "sonner";
import type {
  JobData,
  Criteria,
  EligibilityFilters,
} from "../CreateJob";

interface Step3Props {
  jobData: JobData;
  criteria: Criteria[];
  eligibilityFilters: EligibilityFilters;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isEditMode?: boolean;
}

export function Step3ReviewConfirm({
  jobData,
  criteria,
  eligibilityFilters,
  onBack,
  onSaveDraft,
  onPublish,
  isEditMode = false,
}: Step3Props) {
  const handlePublish = () => {
    toast.success(
      isEditMode
        ? "Job updated successfully!"
        : "Job published successfully!",
      {
        description: isEditMode
          ? "The job changes have been saved"
          : "Candidates can now apply to this position",
      },
    );

    setTimeout(() => {
      onPublish();
    }, 1200);
  };

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-[#003B7A] mb-6">
            Setup Summary
          </h2>

          <div className="space-y-6">
            <div className="rounded-lg">
              <h3 className="text-sm font-semibold text-[#003B7A] mb-3">
                Job Details
              </h3>
              <div className="space-y-2 text-sm p-3 bg-[#F3F3F5] rounded-lg">
                <p className="text-slate-700">
                  <span className="font-medium">
                    {jobData.title}
                  </span>
                  <span className="mx-1 text-slate-400">•</span>
                  <span className="text-slate-600">
                    {jobData.department}
                  </span>
                  <span className="mx-1 text-slate-400">•</span>
                  <span className="text-slate-600">
                    {jobData.location}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-md">
              <h3 className="text-sm font-semibold text-[#003B7A] mb-3">
                Eligibility Filters
              </h3>
              <p className="text-sm text-slate-700 p-3 bg-[#F3F3F5] rounded-lg">
                CGPA {eligibilityFilters.minCGPA.toFixed(2)} •
                Experience {eligibilityFilters.minExperience} •{" "}
                {eligibilityFilters.educationLevel}
              </p>
            </div>

            <div className="rounded-md">
              <h3 className="text-sm font-semibold text-[#003B7A] mb-4">
                Criteria
              </h3>

              <div className="space-y-3">
                {criteria.map((criterion, index) => (
                  <div
                    key={criterion.id}
                    className="rounded-md border border-blue-100 bg-[#f3f3f5] p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-[#003B7A]">
                        Criteria {index + 1}
                      </span>

                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          criterion.isAutoDetected
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {criterion.isAutoDetected
                          ? "Auto-detected from JD"
                          : "Manual"}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        <span className="font-medium">
                          Name:
                        </span>{" "}
                        {criterion.name}
                      </p>
                      <p>
                        <span className="font-medium">
                          Weight:
                        </span>{" "}
                        {criterion.weight}
                      </p>
                      <p>
                        <span className="font-medium">
                          Explanation:
                        </span>{" "}
                        {criterion.explanation || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Back to Edit
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onSaveDraft();
              toast.success("Draft saved successfully");
            }}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Save
          </Button>
        </div>

        <Button
          type="button"
          onClick={handlePublish}
          className="bg-[#003B7A] hover:bg-[#002f63] px-8"
        >
          {isEditMode ? "Save Changes" : "Publish Job"}
        </Button>
      </div>
    </div>
  );
}