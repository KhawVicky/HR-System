import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";
import { Upload, FileText, X, Check } from "lucide-react";
import type { JobData } from "../CreateJob";

interface Step1Props {
  jobData: JobData;
  setJobData: (data: JobData) => void;
  onNext: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  isEditMode?: boolean;
}

export function Step1UploadJD({
  jobData,
  setJobData,
  onNext,
  onCancel,
  onSaveDraft,
  isEditMode = false,
}: Step1Props) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>(
    {},
  );

  const hasExistingJobDetails =
    jobData.title.trim() ||
    jobData.department.trim() ||
    jobData.location.trim() ||
    jobData.description.trim();

  const showJobDetails =
    Boolean(jobData.jdFile) ||
    (isEditMode && Boolean(hasExistingJobDetails));

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.type !== "application/pdf") {
        setErrors({
          ...errors,
          file: "Only PDF files are accepted",
        });
        toast.error("Only PDF files are accepted");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          file: "File size must be less than 5MB",
        });
        toast.error("File size must be less than 5MB");
        return;
      }

      setJobData({ ...jobData, jdFile: file });
      const { file: _fileError, ...remainingErrors } = errors;
      setErrors(remainingErrors);
      toast.success(`${file.name} uploaded successfully!`);

      setTimeout(() => {
        setJobData({
          ...jobData,
          jdFile: file,
          title: "Senior Frontend Developer",
          department: "Engineering",
          salary: "RM 4,500 - RM 6,500",
          location: "Batu Kawan, Penang",
          description:
            "Build and maintain frontend web applications, collaborate with backend teams, and improve UI quality.",
        });
        toast.success("Job details extracted successfully!");
      }, 500);
    }
  };

  const removeFile = () => {
    setJobData({ ...jobData, jdFile: null });
    toast.info("File removed");
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode && !jobData.jdFile) {
      newErrors.file = "Job description file is required";
    }

    if (!jobData.title.trim()) {
      newErrors.title = "Job title is required";
    }
    if (!jobData.department.trim()) {
      newErrors.department = "Department is required";
    }
    if (!jobData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!jobData.description.trim()) {
      newErrors.description = "Job description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep()) {
      onNext();
    } else {
      toast.error("Please complete all required fields");
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-[#000000]">
              {isEditMode
                ? "Job Description File"
                : "Job Description Upload"}
            </h2>
            <p className="text-sm text-slate-600">
              {isEditMode
                ? "You may keep the current job details or upload a new JD file to update them."
                : "This file will be used to auto-fill job details and generate criteria."}
            </p>
          </div>

          {!jobData.jdFile ? (
            <label
              htmlFor="jd-file"
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 cursor-pointer hover:bg-slate-50 transition-colors ${
                errors.file
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300"
              }`}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-[#e3e3e333]">
                <Upload className="w-7 h-7 text-[#003B7A]" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">
                {isEditMode
                  ? "Upload a new JD PDF to replace the current one or keep the existing job details"
                  : "Drag and drop your JD PDF here or Browse file"}
              </p>
              <p className="text-sm text-slate-500">
                PDF only, max 5MB
              </p>
              <input
                id="jd-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#003B7A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {jobData.jdFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(jobData.jdFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {errors.file && (
            <p className="text-sm text-red-500 mt-2">
              {errors.file}
            </p>
          )}
        </CardContent>
      </Card>

      {showJobDetails && (
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-[#000000]">
                Extracted Job Details
              </h2>
              <p className="text-sm text-slate-600">
                HR can review and edit the auto-filled details
                before moving to criteria setup.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="title"
                  className="text-slate-700 font-medium"
                >
                  Job Title{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={jobData.title || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      title: e.target.value,
                    })
                  }
                  className={`mt-2 ${
                    errors.title ? "border-red-500" : ""
                  }`}
                  placeholder="Senior Frontend Developer"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="department"
                  className="text-slate-700 font-medium"
                >
                  Department{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department"
                  value={jobData.department || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      department: e.target.value,
                    })
                  }
                  className={`mt-2 ${
                    errors.department ? "border-red-500" : ""
                  }`}
                  placeholder="Engineering"
                />
                {errors.department && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.department}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="salary"
                  className="text-slate-700 font-medium"
                >
                  Salary Range{" "}
                  <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="salary"
                  value={jobData.salary || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      salary: e.target.value,
                    })
                  }
                  className={`mt-2 ${
                    errors.salary ? "border-red-500" : ""
                  }`}
                  placeholder="RM 4,500 - RM 6,500"
                />

                {errors.salary && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.salary}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="location"
                  className="text-slate-700 font-medium"
                >
                  Location{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={jobData.location}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      location: e.target.value,
                    })
                  }
                  className={`mt-2 ${
                    errors.location ? "border-red-500" : ""
                  }`}
                  placeholder="Batu Kawan, Penang"
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.location}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-slate-700 font-medium"
                >
                  Job Description{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      description: e.target.value,
                    })
                  }
                  className={`mt-2 ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  placeholder="Build and maintain frontend web applications..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onSaveDraft();
              toast.success("Draft saved successfully");
            }}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Save Draft
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleContinue}
            className="bg-[#003B7A] hover:bg-[#002f63] text-white"
          >
            Continue to Set Criteria
          </Button>
        </div>
      </div>
    </div>
  );
}
