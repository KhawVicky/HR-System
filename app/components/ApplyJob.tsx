import image_a7e321551d78150f830b1e4870452ab5d2dd7d7e from "../assets/uwc-berhad-logo.png";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  Check,
  Briefcase,
  MapPin,
  Building2,
  Eye,
  DollarSign,
} from "lucide-react";
import { ApiError, apiFetch, type JobSummary } from "../lib/api";

type JobItem = {
  id: string;
  title: string;
  department: string;
  location: string;
  salary: string;
};

type UploadedFileItem = {
  id: string;
  file: File;
  previewUrl: string | null;
};

const mapJobItem = (
  job: Pick<
    JobSummary,
    "jobCode" | "title" | "department" | "location" | "salaryRange"
  >,
): JobItem => ({
  id: job.jobCode,
  title: job.title,
  department: job.department,
  location: job.location,
  salary: job.salaryRange || "Salary not specified",
});

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function canPreview(file: File) {
  return (
    file.type === "application/pdf" ||
    file.type.startsWith("image/")
  );
}

export function ApplyJob() {
  const { jobCode } = useParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [formData, setFormData] = useState({
    selectedJobId: "",
    fullName: "",
    email: "",
    phone: "",
    cgpa: "",
    noticePeriod: "",
    linkedIn: "",
    portfolio: "",
  });

  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [isReplacingApplication, setIsReplacingApplication] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedJob = useMemo(
    () =>
      jobs.find((job) => job.id === formData.selectedJobId),
    [jobs, formData.selectedJobId],
  );

  useEffect(() => {
    const loadJobs = jobCode
      ? apiFetch<{
          job: Pick<
            JobSummary,
            | "jobCode"
            | "title"
            | "department"
            | "location"
            | "salaryRange"
          >;
        }>(`/apply/${jobCode}`).then((data) => [mapJobItem(data.job)])
      : apiFetch<{ jobs: JobSummary[] }>("/jobs").then((data) =>
          data.jobs
            .filter((job) => job.status === "active")
            .map(mapJobItem),
        );

    loadJobs
      .then((loadedJobs) => {
        setJobs(loadedJobs);
        setFormData((prev) => ({
          ...prev,
          selectedJobId:
            prev.selectedJobId || loadedJobs[0]?.id || "",
        }));
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load jobs",
        ),
      );
  }, [jobCode]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [files]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) return;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    const validFiles: UploadedFileItem[] = [];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `${file.name} is not supported. Please upload PDF or image files only.`,
        );
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB.`);
        continue;
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: canPreview(file)
          ? URL.createObjectURL(file)
          : null,
      });
    }

    if (!validFiles.length) return;

    setFiles((prev) => [...prev, ...validFiles]);
    setErrors((prev) => ({ ...prev, files: "" }));
    toast.success("Files uploaded successfully");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const previewFile = (item: UploadedFileItem) => {
    if (!item.previewUrl) {
      toast.error(
        "This file cannot be previewed in the browser.",
      );
      return;
    }

    window.open(
      item.previewUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedJobId) {
      newErrors.selectedJobId = "Please select a job";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^(\+?60|0)[0-9]{8,}$/.test(
        formData.phone.replace(/\s|-/g, ""),
      )
    ) {
      newErrors.phone =
        "Please enter a valid Malaysian phone number";
    }

    if (!formData.cgpa.trim()) {
      newErrors.cgpa = "CGPA is required";
    } else {
      const cgpaValue = Number(formData.cgpa);

      if (
        Number.isNaN(cgpaValue) ||
        cgpaValue < 0 ||
        cgpaValue > 4
      ) {
        newErrors.cgpa = "CGPA must be between 0.00 and 4.00";
      }
    }

    if (!formData.noticePeriod.trim()) {
      newErrors.noticePeriod = "Notice period is required";
    }

    if (files.length === 0) {
      newErrors.files = "Please upload at least one file";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).filter((key) => newErrors[key])
        .length === 0
    );
  };

  const buildApplicationData = (replaceExisting: boolean) => {
    const applicationData = new FormData();
    applicationData.append("fullName", formData.fullName);
    applicationData.append("email", formData.email);
    applicationData.append("phone", formData.phone);
    applicationData.append("cgpa", formData.cgpa);
    applicationData.append(
      "noticePeriodDays",
      String(Number(formData.noticePeriod) || 0),
    );
    applicationData.append("resume", files[0].file);

    if (replaceExisting) {
      applicationData.append("replaceExisting", "1");
    }

    return applicationData;
  };

  const submitApplication = async (replaceExisting = false) => {
    try {
      await apiFetch(`/apply/${formData.selectedJobId}`, {
        method: "POST",
        body: buildApplicationData(replaceExisting),
      });

      setIsSubmitted(true);
      setDuplicateDialogOpen(false);

      toast.success("Application submitted successfully!", {
        description:
          "We'll review your application and get back to you soon.",
        duration: 5000,
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.data.duplicate
      ) {
        setDuplicateDialogOpen(true);
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit application",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    await submitApplication(false);
  };

  const handleReplaceApplication = async () => {
    setIsReplacingApplication(true);
    try {
      await submitApplication(true);
    } finally {
      setIsReplacingApplication(false);
    }
  };

  function CandidateFooter() {
    return (
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  image_a7e321551d78150f830b1e4870452ab5d2dd7d7e
                }
                alt="UWC Logo"
                className="h-7 w-auto"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  UWC Berhad Recruitment
                </p>
                <p className="text-sm text-slate-500">
                  Submit your application securely through this
                  page.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              © 2026 UWC Berhad. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <img
                src={
                  image_a7e321551d78150f830b1e4870452ab5d2dd7d7e
                }
                alt="UWC Logo"
                className="h-8 w-auto"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Job Application
                </p>
                <p className="text-xs text-slate-500">
                  UWC Berhad Recruitment
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10 lg:px-8">
          <Card className="mx-auto max-w-2xl rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Application Submitted
              </h2>

              <p className="mb-6 text-slate-600">
                Thank you for your application. Our HR team will
                review your documents and contact you if you are
                shortlisted.
              </p>

              <div className="mb-6 rounded-lg bg-slate-50 p-4 text-left">
                <h3 className="mb-2 font-semibold text-slate-900">
                  Submitted for
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedJob?.title || "Selected Position"}
                </p>
              </div>

              <Button
                onClick={() => setIsSubmitted(false)}
                className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
              >
                Back to Form
              </Button>
            </CardContent>
          </Card>
        </main>

        <CandidateFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={
                image_a7e321551d78150f830b1e4870452ab5d2dd7d7e
              }
              alt="UWC Logo"
              className="h-8 w-auto"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Job Application
              </p>
              <p className="text-xs text-slate-500">
                UWC Berhad Recruitment
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-5 lg:px-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            Job Application
          </h1>
          <p className="text-slate-600">
            Select a job and upload your application documents.
          </p>
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Job Selection
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="selectedJobId">
                    Apply for *
                  </Label>
                  <select
                    id="selectedJobId"
                    value={formData.selectedJobId}
                    onChange={(e) =>
                      handleInputChange(
                        "selectedJobId",
                        e.target.value,
                      )
                    }
                    className={`flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm ${
                      errors.selectedJobId
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">Select a job</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>

                  {errors.selectedJobId && (
                    <p className="text-sm text-red-500">
                      {errors.selectedJobId}
                    </p>
                  )}
                </div>

                {selectedJob && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 font-medium text-slate-900">
                      <Briefcase className="h-4 w-4" />
                      {selectedJob.title}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {selectedJob.department}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedJob.location}
                      </div>

                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {selectedJob.salary}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Personal Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange(
                        "fullName",
                        e.target.value,
                      )
                    }
                    className={
                      errors.fullName ? "border-red-500" : ""
                    }
                  />

                  {errors.fullName && (
                    <p className="text-sm text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange(
                          "email",
                          e.target.value,
                        )
                      }
                      className={
                        errors.email ? "border-red-500" : ""
                      }
                    />

                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+60 12-345 6789"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange(
                          "phone",
                          e.target.value,
                        )
                      }
                      className={
                        errors.phone ? "border-red-500" : ""
                      }
                    />

                    {errors.phone && (
                      <p className="text-sm text-red-500">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cgpa">CGPA *</Label>
                    <Input
                      id="cgpa"
                      type="number"
                      min="0"
                      max="4"
                      step="0.01"
                      placeholder="3.50"
                      value={formData.cgpa}
                      onChange={(e) =>
                        handleInputChange(
                          "cgpa",
                          e.target.value,
                        )
                      }
                      className={
                        errors.cgpa ? "border-red-500" : ""
                      }
                    />

                    {errors.cgpa && (
                      <p className="text-sm text-red-500">
                        {errors.cgpa}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="noticePeriod">
                      Notice Period *
                    </Label>

                    <select
                      id="noticePeriod"
                      value={formData.noticePeriod}
                      onChange={(e) =>
                        handleInputChange(
                          "noticePeriod",
                          e.target.value,
                        )
                      }
                      className={`flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm ${
                        errors.noticePeriod
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    >
                      <option value="">
                        Select notice period
                      </option>
                      <option value="Immediate">
                        Immediate
                      </option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="2 months">2 months</option>
                      <option value="3 months">3 months</option>
                    </select>

                    {errors.noticePeriod && (
                      <p className="text-sm text-red-500">
                        {errors.noticePeriod}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="linkedIn">
                      LinkedIn Profile
                    </Label>
                    <Input
                      id="linkedIn"
                      placeholder="https://linkedin.com/in/johndoe"
                      value={formData.linkedIn}
                      onChange={(e) =>
                        handleInputChange(
                          "linkedIn",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">
                      Portfolio / Website
                    </Label>
                    <Input
                      id="portfolio"
                      placeholder="https://johndoe.com"
                      value={formData.portfolio}
                      onChange={(e) =>
                        handleInputChange(
                          "portfolio",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Application Documents *</Label>

                <div className="space-y-3">
                  <label
                    htmlFor="applicationFiles"
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-slate-50 ${
                      errors.files
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <Upload className="mb-3 h-12 w-12 text-slate-400" />
                    <p className="mb-1 text-sm font-medium text-slate-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-center text-xs text-slate-500">
                      Upload resume, cover letter and supporting
                      documents
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PDF, JPG, JPEG or PNG only. Max 10MB each.
                    </p>

                    <input
                      ref={fileInputRef}
                      id="applicationFiles"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {errors.files && (
                    <p className="text-sm text-red-500">
                      {errors.files}
                    </p>
                  )}

                  {files.length > 0 && (
                    <div className="space-y-3">
                      {files.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 p-4"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-700">
                                {item.file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(item.file.size)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.previewUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  previewFile(item)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeFile(item.id)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <AlertDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Replace existing application?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This email has already submitted an application for this
              job. If you continue, the latest form and resume will
              replace the existing application, and the previous
              submission will be kept in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReplacingApplication}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleReplaceApplication();
              }}
              disabled={isReplacingApplication}
              className="bg-[#003B7A] hover:bg-[#002f63]"
            >
              {isReplacingApplication ? "Replacing..." : "Replace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CandidateFooter />
    </div>
  );
}
