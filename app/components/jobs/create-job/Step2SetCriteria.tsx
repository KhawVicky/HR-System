import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";
import type {
  Criteria,
  EligibilityFilters,
} from "../CreateJob";

interface Step2Props {
  criteria: Criteria[];
  setCriteria: (criteria: Criteria[]) => void;
  eligibilityFilters: EligibilityFilters;
  setEligibilityFilters: (filters: EligibilityFilters) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

const TOTAL_WEIGHT = 100;

export function Step2SetCriteria({
  criteria,
  setCriteria,
  eligibilityFilters,
  setEligibilityFilters,
  onNext,
  onBack,
  onSaveDraft,
}: Step2Props) {
  const [isCustomModalOpen, setIsCustomModalOpen] =
    useState(false);
  const [customCriterionName, setCustomCriterionName] =
    useState("");
  const [customCriterionWeight, setCustomCriterionWeight] =
    useState(5);
  const [customCriterionNote, setCustomCriterionNote] =
    useState("");

  useEffect(() => {
    if (criteria.length === 0) {
      setCriteria([
        {
          id: "1",
          name: "Proficiency in SQL, Python, or R",
          weight: 40,
          status: "active",
          explanation:
            "JD mentions data analysis tools such as SQL, Python, and R, so this criterion is generated for skill matching.",
          isAutoDetected: true,
        },
        {
          id: "2",
          name: "Experience with Tableau or Power BI",
          weight: 30,
          status: "active",
          explanation:
            "JD highlights dashboarding and reporting tools. This criterion helps check visualization-related experience.",
          isAutoDetected: true,
        },
        {
          id: "3",
          name: "Statistical analysis and problem solving",
          weight: 30,
          status: "active",
          explanation:
            "The role requires data interpretation and analytical thinking, so this criterion supports job relevance scoring.",
          isAutoDetected: true,
        },
      ]);
    }
  }, [criteria.length, setCriteria]);

  const totalWeight = criteria.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  const rebalanceWeights = (
    currentCriteria: Criteria[],
    changedId: string,
    requestedWeight: number,
  ) => {
    const otherCriteria = currentCriteria.filter(
      (c) => c.id !== changedId,
    );

    if (otherCriteria.length === 0) {
      return currentCriteria.map((c) =>
        c.id === changedId
          ? { ...c, weight: TOTAL_WEIGHT }
          : c,
      );
    }

    const maxAllowedWeight =
      TOTAL_WEIGHT - otherCriteria.length;
    const safeNewWeight = Math.max(
      1,
      Math.min(requestedWeight, maxAllowedWeight),
    );

    const remainingWeight = TOTAL_WEIGHT - safeNewWeight;
    const otherCurrentTotal = otherCriteria.reduce(
      (sum, c) => sum + c.weight,
      0,
    );

    let rebalancedOthers = otherCriteria.map((c) => {
      let adjustedWeight = 1;

      if (otherCurrentTotal > 0) {
        adjustedWeight = Math.floor(
          (c.weight / otherCurrentTotal) * remainingWeight,
        );
      } else {
        adjustedWeight = Math.floor(
          remainingWeight / otherCriteria.length,
        );
      }

      return {
        ...c,
        weight: Math.max(1, adjustedWeight),
      };
    });

    let assignedTotal = rebalancedOthers.reduce(
      (sum, c) => sum + c.weight,
      0,
    );

    let diff = remainingWeight - assignedTotal;
    let index = 0;

    while (diff !== 0 && rebalancedOthers.length > 0) {
      const item =
        rebalancedOthers[index % rebalancedOthers.length];

      if (diff > 0) {
        item.weight += 1;
        diff -= 1;
      } else if (diff < 0 && item.weight > 1) {
        item.weight -= 1;
        diff += 1;
      }

      index++;
      if (index > 1000) break;
    }

    return currentCriteria.map((c) => {
      if (c.id === changedId) {
        return { ...c, weight: safeNewWeight };
      }

      const updated = rebalancedOthers.find(
        (item) => item.id === c.id,
      );
      return updated || c;
    });
  };

  const normalizeCriteriaTo100 = (
    currentCriteria: Criteria[],
  ) => {
    if (currentCriteria.length === 0) return [];

    if (currentCriteria.length === 1) {
      return [{ ...currentCriteria[0], weight: TOTAL_WEIGHT }];
    }

    const currentTotal = currentCriteria.reduce(
      (sum, c) => sum + c.weight,
      0,
    );

    let normalized = currentCriteria.map((c) => ({
      ...c,
      weight: Math.max(
        1,
        Math.floor((c.weight / currentTotal) * TOTAL_WEIGHT),
      ),
    }));

    let assigned = normalized.reduce(
      (sum, c) => sum + c.weight,
      0,
    );
    let diff = TOTAL_WEIGHT - assigned;
    let index = 0;

    while (diff !== 0 && normalized.length > 0) {
      const item = normalized[index % normalized.length];

      if (diff > 0) {
        item.weight += 1;
        diff -= 1;
      } else if (diff < 0 && item.weight > 1) {
        item.weight -= 1;
        diff += 1;
      }

      index++;
      if (index > 1000) break;
    }

    return normalized;
  };

  const handleDeleteCriteria = (id: string) => {
    if (criteria.length === 1) {
      toast.error("At least one criterion is required");
      return;
    }

    const filtered = criteria.filter((c) => c.id !== id);
    const normalized = normalizeCriteriaTo100(filtered);
    setCriteria(normalized);
    toast.success("Criterion deleted");
  };

const handleUpdateCriteria = (
  id: string,
  field: keyof Criteria,
  value: string | number | boolean,
) => {
  if (field === "weight") {
    const parsedWeight = Number(value);
    if (Number.isNaN(parsedWeight)) return;

    const currentIndex = criteria.findIndex((c) => c.id === id);
    const balanceIndex = criteria.length - 1;

    if (currentIndex === -1) return;

    if (criteria.length === 1) {
      setCriteria([{ ...criteria[0], weight: 100 }]);
      return;
    }

    if (currentIndex === balanceIndex) {
      toast.error(
        "The last criterion is used as the balance weight and cannot be adjusted directly.",
      );
      return;
    }

    const updatedCriteria = [...criteria];
    const oldWeight = updatedCriteria[currentIndex].weight;
    const diff = parsedWeight - oldWeight;

    const balanceWeight = updatedCriteria[balanceIndex].weight;
    const newBalanceWeight = balanceWeight - diff;

    if (parsedWeight < 1) {
      toast.error("Weight must be at least 1%");
      return;
    }

    if (newBalanceWeight < 1) {
      toast.error(
        "Not enough remaining weight. Please reduce the selected criterion weight.",
      );
      return;
    }

    updatedCriteria[currentIndex] = {
      ...updatedCriteria[currentIndex],
      weight: parsedWeight,
    };

    updatedCriteria[balanceIndex] = {
      ...updatedCriteria[balanceIndex],
      weight: newBalanceWeight,
    };

    setCriteria(updatedCriteria);
    return;
  }

  setCriteria(
    criteria.map((c) =>
      c.id === id ? { ...c, [field]: value } : c,
    ),
  );
};
  const openCustomModal = () => {
    setCustomCriterionName("");
    setCustomCriterionWeight(5);
    setCustomCriterionNote("");
    setIsCustomModalOpen(true);
  };

  const closeCustomModal = () => {
    setIsCustomModalOpen(false);
  };

  const handleConfirmCustomCriteria = () => {
    if (!customCriterionName.trim()) {
      toast.error("Please enter a criterion name");
      return;
    }

    const safeCustomWeight = Math.max(
      1,
      Math.min(customCriterionWeight, TOTAL_WEIGHT),
    );

    const newCriterion: Criteria = {
      id: Date.now().toString(),
      name: customCriterionName,
      weight: safeCustomWeight,
      status: "active",
      explanation: customCriterionNote,
      isAutoDetected: false,
    };

    const combined = [...criteria, newCriterion];
    const normalized = normalizeCriteriaTo100(combined);

    setCriteria(normalized);
    setIsCustomModalOpen(false);
    toast.success("Custom criterion added");
  };

  const handleContinue = () => {
    if (criteria.length === 0) {
      toast.error("Please add at least one criterion");
      return;
    }

    if (totalWeight !== TOTAL_WEIGHT) {
      toast.error("Total weight must be exactly 100%");
      return;
    }

    onNext();
  };

  return (
    <>
      <div className="space-y-8">
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-8">
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-[#003B7A] mb-2">
      Eligibility Filters
    </h2>
    <p className="text-sm text-slate-600">
      Filters are separated from scoring criteria so
      HR can set minimum requirements clearly.
    </p>
  </div>

  <div className="grid grid-cols-3 gap-6">
    <div>
      <Label className="text-slate-700 font-medium mb-2">
        Minimum CGPA
      </Label>
      <Input
        type="number"
        step="0.01"
        min="0"
        max="4.0"
        value={eligibilityFilters.minCGPA}
        onChange={(e) =>
          setEligibilityFilters({
            ...eligibilityFilters,
            minCGPA: parseFloat(e.target.value) || 0,
          })
        }
        className="mt-2 bg-slate-50 border-slate-300 text-slate-700 px-[12px] py-[19px]"
      />
    </div>

    <div>
      <Label className="text-slate-700 font-medium mb-2">
        Minimum Experience
      </Label>
      <select
        value={eligibilityFilters.minExperience}
        onChange={(e) =>
          setEligibilityFilters({
            ...eligibilityFilters,
            minExperience: e.target.value,
          })
        }
        className="mt-2 flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
      >
        <option value="Internship">Internship</option>
        <option value="0 year">0 year</option>
        <option value="1 year">1 year</option>
        <option value="2 years">2 years</option>
        <option value="3 years">3 years</option>
        <option value="4 years">4 years</option>
        <option value="5+ years">5+ years</option>
      </select>
    </div>

    <div>
      <Label className="text-slate-700 font-medium mb-2">
        Education Level
      </Label>
      <select
        value={eligibilityFilters.educationLevel}
        onChange={(e) =>
          setEligibilityFilters({
            ...eligibilityFilters,
            educationLevel: e.target.value,
          })
        }
        className="mt-2 flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
      >
        <option value="">Select education level</option>
        <option value="SPM">SPM</option>
        <option value="STPM / Foundation / Matriculation">
          STPM / Foundation / Matriculation
        </option>
        <option value="Diploma">Diploma</option>
        <option value="Bachelor Degree">Bachelor Degree</option>
        <option value="Master Degree">Master Degree</option>
        <option value="PhD">PhD</option>
      </select>
    </div>
  </div>
</CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#003B7A] mb-2">
                  Criteria
                </h2>
                <p className="text-sm text-slate-600">
                  Review the generated criteria and add manual
                  criteria if needed. HR can edit the criterion
                  name, weight, and explanation.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openCustomModal}
                className="border-[#003B7A] text-[#003B7A] hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Criteria
              </Button>
            </div>

            <div className="space-y-4">
              {criteria.map((criterion, index) => (
                <div
                  key={criterion.id}
                  className="p-5 border border-slate-200 rounded-lg bg-white hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#003B7A] pl-[0px] pr-[5px] py-[0px]">
                        Criteria {index + 1}
                      </span>

                      <Badge
                        variant="outline"
                        className={
                          criterion.isAutoDetected
                            ? "bg-blue-50 text-blue-600 border-blue-200 text-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 text-xs"
                        }
                      >
                        {criterion.isAutoDetected
                          ? "Auto-detected from JD"
                          : "Manual"}
                      </Badge>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteCriteria(criterion.id)
                      }
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-[1fr_140px] gap-4 items-end mb-4">
                    <div>
                      <Label className="text-xs text-slate-600 mb-2 block">
                        Criterion Name
                      </Label>
                      <Input
                        value={criterion.name}
                        onChange={(e) =>
                          handleUpdateCriteria(
                            criterion.id,
                            "name",
                            e.target.value,
                          )
                        }
                        className="text-sm"
                        placeholder="Enter criterion name"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600 mb-2 block">
                        Weight
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={criterion.weight}
                        onChange={(e) =>
                          handleUpdateCriteria(
                            criterion.id,
                            "weight",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="text-sm text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600 mb-2 block">
                      Explanation
                    </Label>
                    <Textarea
                      value={criterion.explanation || ""}
                      onChange={(e) =>
                        handleUpdateCriteria(
                          criterion.id,
                          "explanation",
                          e.target.value,
                        )
                      }
                      className="text-sm min-h-[64px]"
                      placeholder={
                        criterion.isAutoDetected
                          ? "Enter note or explanation"
                          : "Enter optional note"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 mx-[0px] mt-[20px] mb-[16px] hover:border-blue-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Total Weight
                </p>
                <p className="text-xs text-slate-500">
                  Scoring criteria must always total 100%
                </p>
              </div>
              <div className="text-lg font-bold text-[#003B7A]">
                {totalWeight}%
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
              Back
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
              Save Draft
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleContinue}
            className="bg-[#003B7A] hover:bg-[#002f63] px-8"
          >
            Continue to Review and Confirm
          </Button>
        </div>
      </div>

      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-[#003B7A]">
                Add Custom Criteria
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeCustomModal}
                className="text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-[1fr_140px] gap-4 items-end">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Criterion Name
                  </Label>
                  <Input
                    value={customCriterionName}
                    onChange={(e) =>
                      setCustomCriterionName(e.target.value)
                    }
                    placeholder="e.g., Communication with stakeholders"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Weight
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={customCriterionWeight}
                    onChange={(e) =>
                      setCustomCriterionWeight(
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-medium mb-2">
                  Explanation
                </Label>
                <Textarea
                  value={customCriterionNote}
                  onChange={(e) =>
                    setCustomCriterionNote(e.target.value)
                  }
                  placeholder="Enter optional note"
                  className="mt-2 min-h-[72px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={closeCustomModal}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmCustomCriteria}
                className="bg-[#003B7A] hover:bg-[#002f63]"
              >
                Add Criterion
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}