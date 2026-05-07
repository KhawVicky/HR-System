import { useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { PageLayout } from "./PageLayout";
import { Step1UploadJD } from "./create-job/Step1UploadJD";
import { Step2SetCriteria } from "./create-job/Step2SetCriteria";
import { Step3ReviewConfirm } from "./create-job/Step3ReviewConfirm";
import { JobCreationStepper } from "./create-job/JobCreationStepper";

export interface JobData {
  title: string;
  department: string;
  salary: string;
  location: string;
  description: string;
  jdFile: File | null;
}

export interface Criteria {
  id: string;
  name: string;
  weight: number;
  status: "active" | "inactive";
  explanation: string;
  isAutoDetected: boolean;
}

export interface EligibilityFilters {
  minCGPA: number;
  minExperience: string;
  educationLevel: string;
}

export function CreateJob() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const editingJob = location.state?.job;
  const isEditMode = Boolean(jobId && editingJob);

  const [currentStep, setCurrentStep] = useState(1);

  const [jobData, setJobData] = useState<JobData>({
    title: editingJob?.title || "",
    department: editingJob?.department || "",
    salary: editingJob?.salary || "",
    location: editingJob?.location || "",
    description: editingJob?.description || "",
    jdFile: null,
  });

  const [criteria, setCriteria] = useState<Criteria[]>(
    editingJob?.criteria || [],
  );

  const [eligibilityFilters, setEligibilityFilters] =
    useState<EligibilityFilters>(
      editingJob?.eligibilityFilters || {
        minCGPA: 3.0,
        minExperience: "2 years",
        educationLevel: "Bachelor Degree",
      },
    );

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = () => {
    // Draft persistence will be connected to the job API.
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        {
          label: isEditMode ? "Edit Job" : "Create Job",
        },
      ]}
      title={isEditMode ? "Edit Job" : "Create Job"}
      subtitle={
        currentStep === 1
          ? isEditMode
            ? "Review and update the job details before continuing."
            : "Upload the JD file first, then review extracted job details before continuing."
          : currentStep === 2
            ? "Review auto-detected criteria from the uploaded JD, edit weights, and add your own custom rules."
            : isEditMode
              ? "Review the updated setup before saving the job changes."
              : "Review the full setup before publishing the job and sharing the application link."
      }
      useCard={false}
    >
      <JobCreationStepper
        currentStep={currentStep}
        isEditMode={isEditMode}
      />

      {currentStep === 1 && (
        <Step1UploadJD
          jobData={jobData}
          setJobData={setJobData}
          onNext={handleNext}
          onCancel={() => navigate("/dashboard")}
          onSaveDraft={handleSaveDraft}
          isEditMode={isEditMode}
        />
      )}

      {currentStep === 2 && (
        <Step2SetCriteria
          criteria={criteria}
          setCriteria={setCriteria}
          eligibilityFilters={eligibilityFilters}
          setEligibilityFilters={setEligibilityFilters}
          onNext={handleNext}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {currentStep === 3 && (
        <Step3ReviewConfirm
          jobData={jobData}
          criteria={criteria}
          eligibilityFilters={eligibilityFilters}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
          onPublish={() => navigate("/dashboard")}
          isEditMode={isEditMode}
        />
      )}
    </PageLayout>
  );
}
