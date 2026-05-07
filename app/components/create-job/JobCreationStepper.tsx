interface StepperProps {
  currentStep: number;
  isEditMode?: boolean;
}

export function JobCreationStepper({
  currentStep,
  isEditMode = false,
}: StepperProps) {
  const steps = isEditMode
    ? [
        { number: 1, label: "Review Job Details" },
        { number: 2, label: "Update Criteria" },
        { number: 3, label: "Save Changes" },
      ]
    : [
        { number: 1, label: "Upload JD" },
        { number: 2, label: "Set Criteria" },
        { number: 3, label: "Review and Confirm" },
      ];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="flex items-center flex-1"
          >
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step.number === currentStep
                    ? "bg-[#003B7A] text-white ring-4 ring-blue-100"
                    : step.number < currentStep
                      ? "bg-[#003B7A] text-white"
                      : "bg-white border-2 border-[#003B7A] text-[#003B7A]"
                }`}
              >
                {step.number}
              </div>

              <span
                className={`mt-2 text-sm font-medium whitespace-nowrap ${
                  step.number === currentStep
                    ? "text-[#003B7A]"
                    : step.number < currentStep
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 mb-6">
                <div
                  className={`h-full transition-all ${
                    step.number < currentStep
                      ? "bg-[#003B7A]"
                      : "bg-slate-300"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}