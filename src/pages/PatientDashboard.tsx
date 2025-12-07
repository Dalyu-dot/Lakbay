import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatDateDDMMYYYY } from "@/lib/utils";

const PatientDashboard = () => {
  const caseId = (typeof window !== "undefined" && localStorage.getItem("patientCaseId")) || "";
  const fullName = (typeof window !== "undefined" && localStorage.getItem("patientFullName")) || "";
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getDurationDays = (dateStr: string | null | undefined) => {
    if (!dateStr) return 0;
    const start = new Date(dateStr).getTime();
    const now = Date.now();
    if (Number.isNaN(start)) return 0;
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  useEffect(() => {
    const fetchCases = async () => {
      if (!caseId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .eq("patient_identifier", caseId)
          .order("date_of_encounter", { ascending: true });

        if (error) throw error;
        setCases(data || []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchCases();
  }, [caseId]);

  const isCaseCompleted = (caseItem: any) => {
    return caseItem.current_stage?.startsWith("Completed") || 
           caseItem.completion_reason ||
           caseItem.completion_date;
  };

  const getStatusIcon = (caseItem: any) => {
    if (isCaseCompleted(caseItem)) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    const status = caseItem.current_stage;
    switch (status) {
      case "Benign Result":
      case "Malignant Result":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "In Progress":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (caseItem: any) => {
    if (isCaseCompleted(caseItem)) {
      const reason = caseItem.completion_reason || 
                     caseItem.current_stage?.replace("Completed - ", "") || 
                     "Completed";
      return <Badge variant="secondary" className="bg-green-600/10 text-green-700 border-green-600/20">
        Completed: {reason}
      </Badge>;
    }
    const status = caseItem.current_stage;
    switch (status) {
      case "Benign Result":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700">Benign Result</Badge>;
      case "Malignant Result":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-700">Malignant Result</Badge>;
      case "In Progress":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Calculate days in care from first case
  const daysInCare = cases.length > 0
    ? Math.floor(
        (new Date().getTime() - new Date(cases[0].date_of_encounter).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Get current status from most recent case
  const currentStatus = cases.length > 0 ? cases[cases.length - 1] : null;

  if (loading) {
    return (
      <DashboardLayout title="My Care Timeline">
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Care Timeline">
      {/* Patient Info Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Case ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">{caseId || "—"}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patient Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">{fullName || "—"}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days in Care
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">{daysInCare} days</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {currentStatus && (
        <>
          {currentStatus.alert === "overdue" && (
            <Card className="mb-6 border-l-4 border-l-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle>Action Required</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">
                  Your case requires immediate attention from your provider. Please contact your healthcare team.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Current Stage:</strong> {currentStatus.current_stage}
                </p>
              </CardContent>
            </Card>
          )}
          
          {currentStatus.alert === "warning" && (
            <Card className="mb-6 border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <CardTitle>Upcoming Action</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">
                  Your case has an upcoming milestone. Your provider will contact you soon.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Current Stage:</strong> {currentStatus.current_stage}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Current Status Alert */}
          {currentStatus.alert === "normal" && (
            <Card className="mb-6 border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Current Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">
                  <strong>Stage:</strong> {currentStatus.current_stage}
                  {isCaseCompleted(currentStatus) && (
                    <span className="ml-2 text-green-600 font-semibold">✓ Case Completed</span>
                  )}
                  {currentStatus.current_stage === "Benign Result" && !isCaseCompleted(currentStatus) && (
                    <span className="ml-2 text-green-600 font-semibold">✓ Benign Result</span>
                  )}
                  {currentStatus.current_stage === "Malignant Result" && !isCaseCompleted(currentStatus) && (
                    <span className="ml-2 text-red-600 font-semibold">⚠ Malignant Result</span>
                  )}
                </p>
                {currentStatus.completion_reason && (
                  <p className="text-foreground mt-2">
                    <strong>Completion Reason:</strong> {currentStatus.completion_reason}
                  </p>
                )}
                {currentStatus.completion_date && (
                  <p className="text-foreground mt-1">
                    <strong>Completed On:</strong> {formatDateDDMMYYYY(currentStatus.completion_date)}
                  </p>
                )}
                {currentStatus.findings && (
                  <p className="text-foreground mt-2">
                    <strong>Latest Findings:</strong> {currentStatus.findings}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* All Cases - Separate Entries */}
      {cases.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All My Cases</CardTitle>
            <CardDescription>
              All diagnoses and cases for this patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cases.map((caseItem, index) => (
                <Card key={caseItem.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Case {index + 1}: {caseItem.classification}
                        </CardTitle>
                        <CardDescription>
                          Encounter Date: {formatDateDDMMYYYY(caseItem.date_of_encounter)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(caseItem)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Current Stage</p>
                          <p className="text-sm">{caseItem.current_stage}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Physician</p>
                          <p className="text-sm">{caseItem.physician || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Duration</p>
                          <p className="text-sm">{getDurationDays(caseItem.date_of_encounter)} days</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Classification</p>
                          <p className="text-sm">{caseItem.classification}</p>
                        </div>
                      </div>
                      {caseItem.symptoms && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Symptoms</p>
                          <p className="text-sm">{caseItem.symptoms}</p>
                        </div>
                      )}
                      {caseItem.findings && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Findings</p>
                          <p className="text-sm whitespace-pre-wrap">{caseItem.findings}</p>
                        </div>
                      )}
                      {caseItem.completion_reason && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Completion Reason</p>
                          <p className="text-sm text-green-700">{caseItem.completion_reason}</p>
                        </div>
                      )}
                      {caseItem.completion_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Completion Date</p>
                          <p className="text-sm">{formatDateDDMMYYYY(caseItem.completion_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Care Journey - Stage-based Timeline */}
      {cases.length > 0 && (() => {
        // Define standard care journey stages
        const careStages = [
          { id: "new", label: "New Case", description: "Initial consultation and case creation" },
          { id: "imaging", label: "Initial Imaging", description: "CT scan/imaging performed and reviewed" },
          { id: "biopsy_pending", label: "Biopsy Pending", description: "Planning and scheduling for biopsy" },
          { id: "biopsy_performed", label: "Biopsy Performed", description: "Biopsy completed, awaiting results" },
          { id: "mdc_review", label: "MDC Review", description: "Multidisciplinary conference review" },
          { id: "imaging_followup", label: "Imaging Follow-up", description: "Follow-up imaging scheduled" },
          { id: "results", label: "Results", description: "Pathology results received" },
          { id: "treatment", label: "Treatment Plan", description: "Treatment plan established" },
        ];

        // Get the most recent case to determine current stage
        const currentCase = cases[cases.length - 1];
        const currentStageValue = currentCase.current_stage || "New Case";
        
        // Determine which stages are completed, current, or pending
        const getStageStatus = (stageLabel: string) => {
          if (isCaseCompleted(currentCase)) {
            // If case is completed, all stages are completed
            return "completed";
          }
          
          // Map stage labels to determine progress
          const stageMap: { [key: string]: number } = {
            "New Case": 0,
            "Initial Imaging": 1,
            "Biopsy Pending": 2,
            "Biopsy Performed": 3,
            "MDC Review": 4,
            "Imaging Follow-up": 5,
            "Benign Result": 6,
            "Malignant Result": 6,
            "Treatment Plan": 7,
          };

          const currentIndex = stageMap[currentStageValue] ?? 0;
          const stageIndex = stageMap[stageLabel] ?? -1;

          if (stageIndex < 0) return "pending";
          if (stageIndex < currentIndex) return "completed";
          if (stageIndex === currentIndex) {
            // Check if it's a result stage
            if (currentStageValue === "Benign Result" || currentStageValue === "Malignant Result") {
              return stageLabel === "Results" ? "current" : "pending";
            }
            return "current";
          }
          return "pending";
        };

        return (
          <Card>
            <CardHeader>
              <CardTitle>Your Care Journey</CardTitle>
              <CardDescription>
                Track your progress through each stage of care - Updated by your provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {careStages.map((stage, index) => {
                  const status = getStageStatus(stage.label);
                  const isCompleted = status === "completed";
                  const isCurrent = status === "current";
                  const isPending = status === "pending";

                  // Special handling for Results stage
                  let displayLabel = stage.label;
                  if (stage.id === "results" && isCurrent) {
                    if (currentStageValue === "Benign Result") {
                      displayLabel = "Benign Result";
                    } else if (currentStageValue === "Malignant Result") {
                      displayLabel = "Malignant Result";
                    }
                  }

                  return (
                    <div key={stage.id} className="flex gap-4">
                      {/* Icon Column */}
                      <div className="flex flex-col items-center">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <Clock className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        {index < careStages.length - 1 && (
                          <div className={`w-0.5 h-12 mt-2 ${
                            isCompleted ? "bg-green-600" : "bg-border"
                          }`} />
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold ${
                            isCompleted ? "text-green-700" : 
                            isCurrent ? "text-primary" : 
                            "text-muted-foreground"
                          }`}>
                            {displayLabel}
                          </h4>
                          {isCompleted && (
                            <Badge variant="secondary" className="bg-green-600/10 text-green-700 border-green-600/20">
                              Completed
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="bg-primary text-primary-foreground">
                              In Progress
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="outline">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                        {isCurrent && currentCase.date_of_encounter && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Started: {formatDateDDMMYYYY(currentCase.date_of_encounter)} • 
                            Day {getDurationDays(currentCase.date_of_encounter)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show completion info if case is completed */}
                {isCaseCompleted(currentCase) && (
                  <div className="flex gap-4 mt-4 pt-4 border-t">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-700">Case Completed</h4>
                      {currentCase.completion_reason && (
                        <p className="text-sm text-muted-foreground">
                          Reason: {currentCase.completion_reason}
                        </p>
                      )}
                      {currentCase.completion_date && (
                        <p className="text-sm text-muted-foreground">
                          Completed: {formatDateDDMMYYYY(currentCase.completion_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Educational Timeline for Lung Mass/Nodule Management */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Potential Timeline for Management (Lung Mass/Nodules)</CardTitle>
          <CardDescription>
            This is an example of how care may progress over time. Your actual plan may differ based on your case.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[900px] border border-border rounded-md">
              <div className="grid grid-cols-8 divide-x divide-border bg-muted/60">
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 1</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 2</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 3</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 4</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 5</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 6</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 7</div>
                <div className="px-3 py-2 text-center font-semibold text-sm">Week 8</div>
              </div>
              <div className="grid grid-cols-8 divide-x divide-border">
                <div className="px-3 py-4 text-xs text-center">
                  Initial consultations, scheduling for chest CT scan/imaging
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Chest CT scan/imaging performed, review of initial results
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Planning and scheduling for biopsy (including multidisciplinary conference/MDC)
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Awaiting histopathology report
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Review and discussion of histopathology report
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Possible further histopathology testing or replanning biopsy (if needed)
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Preparation for therapeutic multidisciplinary conference (MDC)
                </div>
                <div className="px-3 py-4 text-xs text-center">
                  Therapeutic MDC for definitive management planning
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {cases.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No cases found. Please contact your provider.
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default PatientDashboard;
