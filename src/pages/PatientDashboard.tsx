import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabaseClient";

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

      {/* Current Status Alert */}
      {currentStatus && (
        <Card className="mb-6 border-l-4 border-l-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
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
                <strong>Completed On:</strong> {new Date(currentStatus.completion_date).toLocaleDateString()}
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
                          Encounter Date: {new Date(caseItem.date_of_encounter).toLocaleDateString()}
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
                          <p className="text-sm">{new Date(caseItem.completion_date).toLocaleDateString()}</p>
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

      {/* Timeline */}
      {cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Care Journey</CardTitle>
            <CardDescription>
              Track your progress through each stage of care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cases.map((caseItem, index) => (
                <div key={caseItem.id} className="flex gap-4">
                  {/* Icon Column */}
                  <div className="flex flex-col items-center">
                    {getStatusIcon(caseItem)}
                    {index < cases.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{caseItem.current_stage}</h4>
                      {getStatusBadge(caseItem)}
                    </div>
                    
                    <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                      <span>Date: {new Date(caseItem.date_of_encounter).toLocaleDateString()}</span>
                      <span>Day {getDurationDays(caseItem.date_of_encounter)}</span>
                    </div>
                    
                    {caseItem.classification && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Classification: {caseItem.classification}
                      </div>
                    )}
                    {caseItem.completion_reason && (
                      <div className="text-sm text-green-700 font-medium mb-2">
                        Completion Reason: {caseItem.completion_reason}
                      </div>
                    )}
                    {caseItem.completion_date && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Completed: {new Date(caseItem.completion_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
