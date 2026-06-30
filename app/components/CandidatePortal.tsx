import image_a7e321551d78150f830b1e4870452ab5d2dd7d7e from "../assets/uwc-berhad-logo.png";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Search,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  apiFetch,
  clearStoredCandidate,
  getStoredCandidate,
  storeCandidate,
  type CandidateAccount,
} from "../lib/api";
import {
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatusBadgeClass,
  type CandidateFacingStatus,
} from "../lib/applicationStatus";
import { formatDisplayDate } from "../lib/date";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Dialog,
  DialogContent,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
import { LoadingState } from "./LoadingState";
import { PasswordInput } from "./PasswordInput";

const CAREERS_JOBS_PER_PAGE = 15;

type CareerJob = {
  id: number;
  jobCode: string;
  title: string;
  department: string;
  location: string | null;
  salaryRange: string | null;
  employmentType: string | null;
  description: string | null;
  publishedAt: string | null;
  closingDate: string | null;
  createdAt: string;
};

type CareerJobDetails = CareerJob & {
  requiredQualification: string | null;
  requiredExperience: string | null;
  responsibilities: Array<{ responsibility: string }>;
  skills: Array<{ skillName: string; skillType: string; importance: string }>;
};

type CandidateApplication = {
  id: number;
  jobTitle: string;
  department: string;
  submittedDate: string;
  updatedDate: string;
  status: CandidateFacingStatus;
};

type CandidateApplicationDetails = CandidateApplication & {
  fullName: string;
  email: string;
  phone: string;
  currentCgpa: string | null;
  noticePeriodDays: number | null;
  address: string | null;
  education: string | null;
  location: string | null;
  employmentType: string | null;
  documents: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  interview: null | {
    scheduledAt: string | null;
    sentAt: string | null;
    subject: string | null;
  };
};

type CandidateBreadcrumbItem = {
  label: string;
  to?: string;
};

function CandidateBreadcrumb({ items }: { items: CandidateBreadcrumbItem[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#496a94]" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-[#8aa0bd]" />}
            {item.to && !isLast ? (
              <Link to={item.to} className="transition hover:text-[#003B7A]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-slate-950" : ""}>{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function CandidateFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={image_a7e321551d78150f830b1e4870452ab5d2dd7d7e} alt="UWC Logo" className="h-7 w-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-900">UWC Berhad Recruitment</p>
              <p className="text-sm text-slate-500">Submit your application securely through this page.</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">© 2026 UWC Berhad. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

type CandidateAuthMode = "login" | "register";

function CandidateAuthPanel({
  mode,
  returnTo,
  onModeChange,
  onSuccess,
}: {
  mode: CandidateAuthMode;
  returnTo: string;
  onModeChange: (mode: CandidateAuthMode) => void;
  onSuccess: (candidate: CandidateAccount) => void;
}) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiFetch<{ candidate: CandidateAccount }>(
        mode === "login" ? "/candidate-auth/login" : "/candidate-auth/register",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      storeCandidate(response.candidate);
      toast.success(mode === "login" ? "Welcome back" : "Candidate account created");
      onSuccess(response.candidate);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="space-y-1 px-0 pb-5 pt-0 text-center">
        <img
          src={image_a7e321551d78150f830b1e4870452ab5d2dd7d7e}
          alt="UWC Logo"
          className="mx-auto h-16 w-auto"
        />
        <CardTitle className="text-2xl">UWC Careers</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to track your applications and manage your profile"
            : "Create an account to apply for UWC job openings"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                minLength={6}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="pr-10"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button disabled={isSubmitting} className="w-full bg-[#003B7A] hover:bg-[#002f63]">
            {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </Button>
          <p className="text-center text-sm text-slate-600">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "login" ? "register" : "login")}
              className="font-semibold text-[#003B7A] hover:underline"
            >
              {mode === "login" ? "Register here" : "Login here"}
            </button>
          </p>
          {returnTo !== "/candidate/applications" && (
            <p className="text-center text-xs text-slate-500">You will continue after signing in.</p>
          )}
        </form>
      </CardContent>
    </div>
  );
}

export function CandidateAuthModal({
  open,
  returnTo,
  onOpenChange,
}: {
  open: boolean;
  returnTo: string;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CandidateAuthMode>("login");

  useEffect(() => {
    if (open) {
      setMode("login");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-slate-200 px-6 pb-0 pt-6 shadow-xl">
        <CandidateAuthPanel
          mode={mode}
          returnTo={returnTo}
          onModeChange={setMode}
          onSuccess={() => {
            onOpenChange(false);
            if (returnTo) {
              navigate(returnTo);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function CandidateLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const candidate = getStoredCandidate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const logout = async () => {
    try {
      await apiFetch("/candidate-auth/logout", { method: "POST" });
    } catch {
      // Local logout still clears the browser session if the server session already expired.
    }
    clearStoredCandidate();
    toast.success("Logged out");
    navigate("/careers");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/careers" className="flex items-center gap-3">
            <img src={image_a7e321551d78150f830b1e4870452ab5d2dd7d7e} alt="UWC" className="h-8 w-auto" />
            <div>
              <p className="font-semibold text-slate-950">UWC Careers</p>
              <p className="text-xs text-slate-500">Candidate Portal</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/careers">Careers</Link>
            </Button>
            {candidate ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/candidate/applications">My Applications</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/candidate/profile">Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAuthModalOpen(true)}
              >
                Login
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">{children}</main>
      <CandidateFooter />
      <CandidateAuthModal
        open={authModalOpen}
        returnTo={`${location.pathname}${location.search}`}
        onOpenChange={setAuthModalOpen}
      />
    </div>
  );
}

function requireCandidate() {
  return getStoredCandidate();
}

export function CareersHome() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState<CareerJobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSelectedJob, setIsLoadingSelectedJob] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [selectedJobCode, setSelectedJobCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReturnTo, setAuthReturnTo] = useState("/candidate/applications");

  useEffect(() => {
    apiFetch<{ jobs: CareerJob[] }>("/career/jobs")
      .then((data) => setJobs(data.jobs))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load careers"))
      .finally(() => setIsLoading(false));
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.department))).sort(),
    [jobs],
  );
  const jobTypes = useMemo(
    () =>
      Array.from(
        new Set(jobs.map((job) => job.employmentType).filter(Boolean)),
      ).sort() as string[],
    [jobs],
  );
  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title} ${job.department} ${job.location ?? ""}`.toLowerCase();
    return (
      text.includes(search.toLowerCase()) &&
      (department === "all" || job.department === department) &&
      (jobType === "all" || job.employmentType === jobType)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / CAREERS_JOBS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pagedJobs = filteredJobs.slice(
    (safeCurrentPage - 1) * CAREERS_JOBS_PER_PAGE,
    safeCurrentPage * CAREERS_JOBS_PER_PAGE,
  );
  const selectedJob = pagedJobs.find((job) => job.jobCode === selectedJobCode) || pagedJobs[0] || null;
  const detailJob = selectedJobDetails?.jobCode === selectedJob?.jobCode ? selectedJobDetails : null;
  const displayJob = detailJob || selectedJob;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, department, jobType]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (!pagedJobs.length) {
      setSelectedJobCode("");
      return;
    }

    if (!pagedJobs.some((job) => job.jobCode === selectedJobCode)) {
      setSelectedJobCode(pagedJobs[0].jobCode);
    }
  }, [pagedJobs, selectedJobCode]);

  useEffect(() => {
    if (!selectedJob?.jobCode) {
      setSelectedJobDetails(null);
      return;
    }

    setIsLoadingSelectedJob(true);
    apiFetch<{ job: CareerJobDetails }>(`/career/jobs/${selectedJob.jobCode}`)
      .then((data) => setSelectedJobDetails(data.job))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load job details"))
      .finally(() => setIsLoadingSelectedJob(false));
  }, [selectedJob?.jobCode]);

  const applyToJob = (job: CareerJob) => {
    if (!getStoredCandidate()) {
      setAuthReturnTo(`/apply/${job.jobCode}`);
      setAuthModalOpen(true);
      return;
    }

    navigate(`/apply/${job.jobCode}`);
  };

  return (
    <CandidateLayout>
     <div className="mb-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job title, department or location" className="pl-9" />
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Types</SelectItem>
                {jobTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingState title="Loading careers" />
      ) : filteredJobs.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 p-8 text-center text-slate-500">No active jobs match your search.</Card>
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-sm font-normal text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredJobs.length}</span> {filteredJobs.length === 1 ? "job" : "jobs"}
          </p>
          <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
            <div className="space-y-3">
              {pagedJobs.map((job) => {
              const isSelected = selectedJob?.jobCode === job.jobCode;

              return (
                <button
                  key={job.jobCode}
                  type="button"
                  onClick={() => setSelectedJobCode(job.jobCode)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-[#003B7A] hover:shadow-md ${
                    isSelected ? "border-[#003B7A] ring-2 ring-blue-100" : "border-slate-200"
                  }`}
                >
                  <h2 className="text-lg font-semibold text-slate-950">{job.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" />{job.department}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location || "Malaysia"}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{job.description || "Join UWC and contribute to a high-performing team."}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{job.employmentType || "Not specified"}</span>
                    <span>{formatDisplayDate(job.publishedAt || job.createdAt)}</span>
                  </div>
                </button>
              );
              })}
              {pageCount > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-slate-600">
                    Page <span className="font-semibold text-slate-900">{safeCurrentPage}</span> of {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                    disabled={safeCurrentPage === pageCount}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <Card className="min-h-[560px] rounded-2xl border-slate-200 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <CardContent className="p-6">
              {displayJob && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#003B7A]">{displayJob.department}</p>
                      <h1 className="mt-1 text-3xl font-bold text-slate-950">{displayJob.title}</h1>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{displayJob.location || "Malaysia"}</span>
                        <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{displayJob.employmentType || "Not specified"}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDisplayDate(displayJob.publishedAt || displayJob.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><Banknote className="h-4 w-4" />{displayJob.salaryRange || "Not specified"}</span>
                      </div>
                    </div>
                    <Button onClick={() => applyToJob(displayJob)} className="bg-[#003B7A] px-6 hover:bg-[#002f63]">Apply Now</Button>
                  </div>

                  {isLoadingSelectedJob && <p className="text-sm text-slate-500">Loading full job details...</p>}

                  <section>
                    <h2 className="mb-3 text-lg font-semibold text-slate-950">Job Description</h2>
                    <p className="whitespace-pre-line leading-7 text-slate-700">{displayJob.description || "Join UWC and contribute to a high-performing manufacturing and technology team."}</p>
                  </section>

                  {detailJob && (
                    <section>
                      <h2 className="mb-3 text-lg font-semibold text-slate-950">Responsibilities</h2>
                      <ul className="space-y-2 text-slate-700">
                        {detailJob.responsibilities.length > 0 ? detailJob.responsibilities.map((item, index) => (
                          <li key={index} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{item.responsibility}</li>
                        )) : <li className="text-slate-500">Responsibilities will be shared during screening.</li>}
                      </ul>
                    </section>
                  )}

                  {detailJob && (
                    <section className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h2 className="mb-2 font-semibold text-slate-950">Qualification</h2>
                        <p className="text-sm leading-6 text-slate-700">{detailJob.requiredQualification || "Not specified"}</p>
                      </div>
                      <div>
                        <h2 className="mb-2 font-semibold text-slate-950">Experience</h2>
                        <p className="text-sm leading-6 text-slate-700">{detailJob.requiredExperience || "Not specified"}</p>
                      </div>
                    </section>
                  )}

                  {detailJob && (
                    <section>
                      <h2 className="mb-3 text-lg font-semibold text-slate-950">Required Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {detailJob.skills.length > 0 ? detailJob.skills.map((skill) => (
                          <span key={skill.skillName} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#003B7A]">{skill.skillName}</span>
                        )) : <span className="text-sm text-slate-500">No specific skills listed.</span>}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </div>
      )}
      <CandidateAuthModal
        open={authModalOpen}
        returnTo={authReturnTo}
        onOpenChange={setAuthModalOpen}
      />
    </CandidateLayout>
  );
}

export function CareerJobDetailsPage() {
  const { jobCode = "" } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<CareerJobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    apiFetch<{ job: CareerJobDetails }>(`/career/jobs/${jobCode}`)
      .then((data) => setJob(data.job))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load job details"))
      .finally(() => setIsLoading(false));
  }, [jobCode]);

  const apply = () => {
    if (!getStoredCandidate()) {
      setAuthModalOpen(true);
      return;
    }
    navigate(`/apply/${jobCode}`);
  };

  return (
    <CandidateLayout>
      {isLoading ? (
        <LoadingState title="Loading job details" />
      ) : !job ? (
        <Card className="rounded-2xl p-8 text-center text-slate-500">This job is not available.</Card>
      ) : (
        <div className="space-y-5">
          <CandidateBreadcrumb
            items={[
              { label: "Careers", to: "/careers" },
              { label: job.title },
            ]}
          />
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#003B7A]">{job.department}</p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-950">{job.title}</h1>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location || "Malaysia"}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.employmentType || "Not specified"}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Closing {job.closingDate ? formatDisplayDate(job.closingDate) : "Open until filled"}</span>
                  </div>
                </div>
                <Button onClick={apply} className="bg-[#003B7A] px-6 hover:bg-[#002f63]">Apply Now</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
              <CardContent className="space-y-6 text-slate-700">
                <p className="leading-7">{job.description || "No description provided."}</p>
                <section>
                  <h2 className="mb-2 font-semibold text-slate-950">Responsibilities</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.length > 0 ? job.responsibilities.map((item, index) => (
                      <li key={index} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{item.responsibility}</li>
                    )) : <li className="text-slate-500">Responsibilities will be shared during screening.</li>}
                  </ul>
                </section>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Qualification</p>
                  <p className="mt-1 text-sm text-slate-800">{job.requiredQualification || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Experience</p>
                  <p className="mt-1 text-sm text-slate-800">{job.requiredExperience || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Required Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.skills.length > 0 ? job.skills.map((skill) => (
                      <span key={skill.skillName} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#003B7A]">{skill.skillName}</span>
                    )) : <span className="text-sm text-slate-500">No specific skills listed.</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <CandidateAuthModal
        open={authModalOpen}
        returnTo={`/apply/${jobCode}`}
        onOpenChange={setAuthModalOpen}
      />
    </CandidateLayout>
  );
}

function CandidateAuthForm({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<CandidateAuthMode>(mode);
  const returnTo = searchParams.get("returnTo") || "/candidate/applications";

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  return (
    <CandidateLayout>
      <div className="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md items-center">
        <Card className="w-full rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <CandidateAuthPanel
              mode={authMode}
              returnTo={returnTo}
              onModeChange={setAuthMode}
              onSuccess={() => navigate(returnTo)}
            />
          </CardContent>
        </Card>
      </div>
    </CandidateLayout>
  );
}

export function CandidateLogin() {
  return <CandidateAuthForm mode="login" />;
}

export function CandidateRegister() {
  return <CandidateAuthForm mode="register" />;
}

function CandidateProtected({ children }: { children: React.ReactNode }) {
  if (!requireCandidate()) {
    return <Navigate to="/candidate/login" replace />;
  }
  return <>{children}</>;
}

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiFetch<{ applications: CandidateApplication[] }>(`/candidate/applications?status=${status}`)
      .then((data) => setApplications(data.applications))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load applications"))
      .finally(() => setIsLoading(false));
  }, [status]);

  return (
    <CandidateProtected>
      <CandidateLayout>
        <CandidateBreadcrumb
          items={[
            { label: "Careers", to: "/careers" },
            { label: "My Applications" },
          ]}
        />
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">My Applications</h1>
            <p className="mt-1 text-slate-600">Track your submitted applications and current status.</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-white md:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CANDIDATE_STATUS_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState title="Loading applications" />
        ) : applications.length === 0 ? (
          <Card className="rounded-2xl border-slate-200 p-8 text-center text-slate-500">No applications found.</Card>
        ) : (
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4">Current Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => (
                    <tr key={application.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <p className="break-words font-medium leading-snug text-slate-950">{application.jobTitle}</p>
                        <p className="mt-1 break-words text-xs text-slate-500">{application.department}</p>
                      </td>
                      <td className="px-6 py-5 leading-snug text-slate-600">
                        {formatDisplayDate(application.submittedDate)}
                      </td>
                      <td className="px-6 py-5 leading-snug text-slate-600">
                        {formatDisplayDate(application.updatedDate)}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCandidateStatusBadgeClass(application.status)}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/candidate/applications/${application.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </CandidateLayout>
    </CandidateProtected>
  );
}

export function CandidateApplicationDetailsPage() {
  const { applicationId = "" } = useParams();
  const [application, setApplication] = useState<CandidateApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const load = () => {
    setIsLoading(true);
    apiFetch<{ application: CandidateApplicationDetails }>(`/candidate/applications/${applicationId}`)
      .then((data) => setApplication(data.application))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load application"))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [applicationId]);

  const canWithdraw = application?.status === "Submitted" || application?.status === "Under Review" || application?.status === "Shortlisted";
  const withdraw = async () => {
    try {
      await apiFetch(`/candidate/applications/${applicationId}/withdraw`, { method: "PATCH" });
      toast.success("Application withdrawn");
      setConfirmWithdraw(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to withdraw application");
    }
  };

  return (
    <CandidateProtected>
      <CandidateLayout>
        {isLoading ? (
          <LoadingState title="Loading application details" />
        ) : !application ? (
          <Card className="rounded-2xl p-8 text-center text-slate-500">Application not found.</Card>
        ) : (
          <div className="space-y-5">
            <CandidateBreadcrumb
              items={[
                { label: "Careers", to: "/careers" },
                { label: "My Applications", to: "/candidate/applications" },
                { label: application.jobTitle },
              ]}
            />
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#003B7A]">{application.department}</p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-950">{application.jobTitle}</h1>
                  <p className="mt-2 text-sm text-slate-500">Submitted {formatDisplayDate(application.submittedDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getCandidateStatusBadgeClass(application.status)}`}>{application.status}</span>
                  {canWithdraw && <Button variant="outline" onClick={() => setConfirmWithdraw(true)}>Withdraw</Button>}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader><CardTitle>Submitted Details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Name:</strong> {application.fullName}</p>
                  <p><strong>Email:</strong> {application.email}</p>
                  <p><strong>Phone:</strong> {application.phone}</p>
                  <p><strong>CGPA:</strong> {application.currentCgpa || "-"}</p>
                  <p><strong>Notice period:</strong> {application.noticePeriodDays ?? "-"} days</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader><CardTitle>Uploaded Documents</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {application.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">No uploaded documents found.</p>
                  ) : application.documents.map((document) => (
                    <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                      <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-[#003B7A]" />{document.fileName}</span>
                      <span className="text-xs text-slate-500">Open</span>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>

            {application.interview && (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader><CardTitle>Interview Information</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-700">
                  <p><strong>Email sent:</strong> {application.interview.sentAt ? formatDisplayDate(application.interview.sentAt) : "-"}</p>
                  <p><strong>Scheduled interview:</strong> {application.interview.scheduledAt || "Please refer to the interview email."}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <AlertDialog open={confirmWithdraw} onOpenChange={setConfirmWithdraw}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
              <AlertDialogDescription>This action will mark your application as withdrawn. HR will see the updated status.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={withdraw}>Withdraw Application</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CandidateLayout>
    </CandidateProtected>
  );
}

export function CandidateProfilePage() {
  const [candidate, setCandidate] = useState<CandidateAccount | null>(getStoredCandidate());
  const [form, setForm] = useState({
    fullName: candidate?.fullName || "",
    email: candidate?.email || "",
    phone: candidate?.phone || "",
    address: candidate?.address || "",
    education: candidate?.education || "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    apiFetch<{ candidate: CandidateAccount }>("/candidate/me")
      .then((data) => {
        setCandidate(data.candidate);
        storeCandidate(data.candidate);
        setForm({
          fullName: data.candidate.fullName,
          email: data.candidate.email,
          phone: data.candidate.phone || "",
          address: data.candidate.address || "",
          education: data.candidate.education || "",
        });
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load profile"));
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (resume) body.append("defaultResume", resume);
    try {
      const response = await apiFetch<{ candidate: CandidateAccount }>("/candidate/profile", { method: "PATCH", body });
      setCandidate(response.candidate);
      storeCandidate(response.candidate);
      setResume(null);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    try {
      await apiFetch("/candidate/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    }
  };

  return (
    <CandidateProtected>
      <CandidateLayout>
        <CandidateBreadcrumb
          items={[
            { label: "Careers", to: "/careers" },
            { label: "Profile" },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950">Your Profile</h1>
          <p className="mt-1 text-slate-600">Manage your contact details, education and default resume.</p>
        </div>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Full name</Label><Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} required /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /></div>
                    <div className="space-y-2"><Label>Phone number</Label><Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} /></div>
                    <div className="space-y-2"><Label>Education</Label><Input value={form.education} onChange={(event) => setForm((prev) => ({ ...prev, education: event.target.value }))} /></div>
                  </div>
                  <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label>Default Resume</Label>
                    <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event: ChangeEvent<HTMLInputElement>) => setResume(event.target.files?.[0] || null)} />
                    <p className="text-xs text-slate-500">{resume?.name || candidate?.defaultResumeFileName || "No default resume uploaded"}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-[#003B7A] hover:bg-[#002f63]">Save Profile</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={changePassword} className="space-y-4">
                  <div className="space-y-2"><Label>Current Password</Label><PasswordInput value={passwords.currentPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))} required /></div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <PasswordInput minLength={8} value={passwords.newPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))} required />
                    <p className="text-xs text-slate-500">Password must be at least 8 characters long</p>
                  </div>
                  <div className="space-y-2"><Label>Confirm New Password</Label><PasswordInput minLength={8} value={passwords.confirmPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))} required /></div>
                  <div className="flex justify-end">
                    <Button className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5">
                      <Lock className="w-4 h-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CandidateLayout>
    </CandidateProtected>
  );
}
