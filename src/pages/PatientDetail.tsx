import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completingCaseId, setCompletingCaseId] = useState<string | null>(null);
  const [completionReason, setCompletionReason] = useState<string>("");
  const [completionNotes, setCompletionNotes] = useState<string>("");
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const isAdmin = userRole === "admin";

  useEffect(() => {
    const fetchCases = async () => {
      if (!patientId) return;
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .eq("patient_identifier", patientId)
          .order("date_of_encounter", { ascending: false });

        if (error) throw error;
        setCases(data || []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
        toast({
          title: "Error",
          description: "Failed to load patient cases.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchCases();
  }, [patientId]);

  const handleEdit = (caseItem: any) => {
    // Only admins can edit cases
    if (!isAdmin) {
      toast({
        title: "Access restricted",
        description: "Only admins can edit case details.",
        variant: "destructive",
      });
      return;
    }

    setEditingCaseId(caseItem.id);
    setEditForm({
      current_stage: caseItem.current_stage,
      alert: caseItem.alert,
      classification: caseItem.classification,
      physician: caseItem.physician || "",
      symptoms: caseItem.symptoms || "",
      findings: caseItem.findings || "",
    });
  };

  const handleCompleteCase = (caseItem: any) => {
    // Only admins can complete cases
    if (!isAdmin) {
      toast({
        title: "Access restricted",
        description: "Only admins can mark a case as completed.",
        variant: "destructive",
      });
      return;
    }

    setCompletingCaseId(caseItem.id);
    setCompletionReason("");
    setCompletionNotes("");
  };

  const confirmCompleteCase = async () => {
    if (!completingCaseId || !completionReason) {
      toast({
        title: "Error",
        description: "Please select a completion reason.",
        variant: "destructive",
      });
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const completionStage = `Completed - ${completionReason}`;
      
      // Build completion notes
      const notes = completionNotes 
        ? `Completion Notes: ${completionNotes}` 
        : `Case completed: ${completionReason}`;
      
      const existingFindings = cases.find(c => c.id === completingCaseId)?.findings || "";
      const updatedFindings = existingFindings 
        ? `${existingFindings}\n\n${notes}` 
        : notes;

      const updateData: any = {
        current_stage: completionStage,
        alert: "normal", // Reset alert when completing
        findings: updatedFindings,
      };

      const { error } = await supabase
        .from("cases")
        .update(updateData)
        .eq("id", completingCaseId);

      if (error) {
        console.error("Supabase complete case error:", error);
        throw error;
      }

      toast({
        title: "Case completed",
        description: `Case has been marked as completed: ${completionReason}`,
      });

      setCompletingCaseId(null);
      setCompletionReason("");
      setCompletionNotes("");

      // Refresh cases
      const { data } = await supabase
        .from("cases")
        .select("*")
        .eq("patient_identifier", patientId!)
        .order("date_of_encounter", { ascending: false });
      if (data) setCases(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to complete case.",
        variant: "destructive",
      });
    }
  };

  const isCaseCompleted = (caseItem: any) => {
    return caseItem.current_stage?.startsWith("Completed") || 
           caseItem.completion_reason ||
           caseItem.completion_date;
  };

  const handleSave = async (caseId: string) => {
    try {
      const caseItem = cases.find(c => c.id === caseId);
      const updateData: any = {
        current_stage: editForm.current_stage,
        alert: editForm.alert,
        classification: editForm.classification,
        symptoms: editForm.symptoms,
        findings: editForm.findings,
      };

      // Admin can reassign provider
      if (isAdmin && editForm.physician) {
        const currentPhysician = caseItem?.physician || "";
        const newPhysician = editForm.physician.trim();
        
        updateData.physician = newPhysician;
      }

      const { error } = await supabase
        .from("cases")
        .update(updateData)
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "Case updated",
        description: "The case has been successfully updated.",
      });

      setEditingCaseId(null);
      // Refresh cases
      const { data } = await supabase
        .from("cases")
        .select("*")
        .eq("patient_identifier", patientId!)
        .order("date_of_encounter", { ascending: false });
      if (data) setCases(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update case.",
        variant: "destructive",
      });
    }
  };

  const getAlertBadge = (alert: string) => {
    switch (alert) {
      case "overdue":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Due Soon
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            On Track
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Patient Details">
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Patient: ${patientId}`}>
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => {
            // Return to the correct dashboard based on role
            if (isAdmin) {
              navigate("/admin");
            } else {
              navigate("/provider");
            }
          }}
        >
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>All Cases for {patientId}</CardTitle>
            <CardDescription>
              View and edit all diagnoses and cases for this patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cases.length === 0 ? (
                <p className="text-muted-foreground">No cases found for this patient.</p>
              ) : (
                cases.map((caseItem) => (
                  <Card key={caseItem.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Case {caseItem.id}</CardTitle>
                          <CardDescription>
                            Encounter Date: {new Date(caseItem.date_of_encounter).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getAlertBadge(caseItem.alert)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingCaseId === caseItem.id ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Current Stage</Label>
                              <Select
                                value={editForm.current_stage}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, current_stage: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="New Case">New Case</SelectItem>
                                  <SelectItem value="Initial Imaging">Initial Imaging</SelectItem>
                                  <SelectItem value="Biopsy Pending">Biopsy Pending</SelectItem>
                                  <SelectItem value="Biopsy Performed">Biopsy Performed</SelectItem>
                                  <SelectItem value="MDC Review">MDC Review</SelectItem>
                                  <SelectItem value="Imaging Follow-up">Imaging Follow-up</SelectItem>
                                  <SelectItem value="Benign Result">Benign Result</SelectItem>
                                  <SelectItem value="Malignant Result">Malignant Result</SelectItem>
                                  <SelectItem value="Treatment Plan">Treatment Plan</SelectItem>
                                  <SelectItem value="Completed - Treatment Done">Completed - Treatment Done</SelectItem>
                                  <SelectItem value="Completed - Patient Expired">Completed - Patient Expired</SelectItem>
                                  <SelectItem value="Completed - Patient Opted Out">Completed - Patient Opted Out</SelectItem>
                                  <SelectItem value="Completed - Team Decision">Completed - Team Decision</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Status Alert</Label>
                              <Select
                                value={editForm.alert}
                                onValueChange={(value) => setEditForm({ ...editForm, alert: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">On Track</SelectItem>
                                  <SelectItem value="warning">Due Soon</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="space-y-2">
                              <Label>Provider (Reassign)</Label>
                              <Input
                                value={editForm.physician}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, physician: e.target.value })
                                }
                                placeholder="Enter new provider name"
                              />
                              <p className="text-xs text-muted-foreground">
                                Admin: You can reassign this case to a different provider
                              </p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Classification</Label>
                            <Select
                              value={editForm.classification}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, classification: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pulmonary nodule">Pulmonary nodule</SelectItem>
                                <SelectItem value="Pulmonary nodule with extrathoracic malignancy">
                                  Pulmonary nodule with extrathoracic malignancy
                                </SelectItem>
                                <SelectItem value="Pulmonary mass">Pulmonary mass</SelectItem>
                                <SelectItem value="Pulmonary mass with extrathoracic malignancy">
                                  Pulmonary mass with extrathoracic malignancy
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Symptoms</Label>
                            <Textarea
                              value={editForm.symptoms}
                              onChange={(e) =>
                                setEditForm({ ...editForm, symptoms: e.target.value })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Findings</Label>
                            <Textarea
                              value={editForm.findings}
                              onChange={(e) =>
                                setEditForm({ ...editForm, findings: e.target.value })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleSave(caseItem.id)}>Save Changes</Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingCaseId(null);
                                setEditForm(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Current Stage</p>
                              <p className="text-sm">{caseItem.current_stage}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Classification</p>
                              <p className="text-sm">{caseItem.classification}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Current Physician</p>
                              <p className="text-sm">{caseItem.physician || "—"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Duration</p>
                              <p className="text-sm">{caseItem.duration} days</p>
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
                              <p className="text-sm">{caseItem.completion_reason}</p>
                            </div>
                          )}
                          {caseItem.completion_date && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Completion Date</p>
                              <p className="text-sm">{new Date(caseItem.completion_date).toLocaleDateString()}</p>
                            </div>
                          )}
                          {isAdmin && (
                            <div className="flex gap-2">
                              {!isCaseCompleted(caseItem) && (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleCompleteCase(caseItem)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Complete Case
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleEdit(caseItem)}>
                                Edit Case
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Dialog */}
      <Dialog open={completingCaseId !== null} onOpenChange={(open) => !open && setCompletingCaseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Case</DialogTitle>
            <DialogDescription>
              Select the reason for completing this case. This action will mark the case as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Completion Reason *</Label>
              <Select value={completionReason} onValueChange={setCompletionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select completion reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Treatment Done">Treatment Done (Surgery/Chemotherapy/Immunotherapy started)</SelectItem>
                  <SelectItem value="Patient Expired">Patient Expired</SelectItem>
                  <SelectItem value="Patient Opted Out">Patient Opted Out of Program</SelectItem>
                  <SelectItem value="Team Decision">Team Decision to End Monitoring (e.g., infectious cause identified and treated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any additional notes about the completion..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingCaseId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmCompleteCase} className="bg-green-600 hover:bg-green-700">
              Complete Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PatientDetail;

