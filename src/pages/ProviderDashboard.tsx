import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabaseClient";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("archivedCaseIds");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [cases, setCases] = useState<any[]>([]);
  const [uniquePatients, setUniquePatients] = useState<string[]>([]);
  const [hasNotified, setHasNotified] = useState(false);

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
      try {
        // Get provider email from localStorage to filter cases
        const providerEmail = typeof window !== "undefined" ? localStorage.getItem("providerEmail") : null;
        
        // Build query - try to filter by provider_email if available and column exists
        let query = supabase
          .from("cases")
          .select("*");
        
        // Only show cases created by this provider (if provider_email column exists)
        // If column doesn't exist, show all cases as fallback
        if (providerEmail) {
          // Try filtering by provider_email, but if it fails, fetch all and filter client-side
          query = query.eq("provider_email", providerEmail);
        }
        
        const { data, error } = await query.order("date_of_encounter", { ascending: false });

        if (error) {
          // If error is due to missing column, try without filter
          if (error.message?.includes("provider_email") || error.code === "PGRST116") {
            console.warn("provider_email column may not exist, fetching all cases");
            const { data: allData, error: allError } = await supabase
              .from("cases")
              .select("*")
              .order("date_of_encounter", { ascending: false });
            
            if (allError) throw allError;
            
            // Filter client-side by physician field as fallback
            const filtered = providerEmail 
              ? (allData || []).filter((c: any) => c.physician?.toLowerCase().includes(providerEmail.toLowerCase().split("@")[0]))
              : (allData || []);
            
            processCases(filtered);
            return;
          }
          throw error;
        }
        
        if (data) {
          processCases(data);
        }
      } catch (err) {
        console.error("Failed to load cases from Supabase", err);
        toast({
          title: "Database unavailable",
          description: "Failed to load cases from database.",
          variant: "destructive",
        });
      }
    };

    const processCases = (caseData: any[]) => {
      if (!caseData) return;
      const mappedCases = caseData.map((c: any) => ({
        id: c.id,
        patientIdentifier: c.patient_identifier,
        currentStage: c.current_stage,
        duration: getDurationDays(c.date_of_encounter),
        alert: c.alert ?? "normal",
        classification: c.classification,
        completion_reason: c.completion_reason,
        completion_date: c.completion_date,
        date_of_encounter: c.date_of_encounter,
      }));
      setCases(mappedCases);
      
      // Get unique patient identifiers
      const patients = Array.from(
        new Set(mappedCases.map((c) => c.patientIdentifier).filter(Boolean))
      ).sort();
      setUniquePatients(patients);

      // Check for overdue cases and show notifications (only once per load)
      if (!hasNotified) {
        const activeCases = mappedCases.filter((c: any) => 
          !archivedIds.includes(c.id) && 
          !(c.currentStage?.startsWith("Completed") || c.completion_reason || c.completion_date)
        );
        
        const overdueCases = activeCases.filter((c: any) => c.alert === "overdue");
        
        if (overdueCases.length > 0) {
          // Show individual notifications for each overdue case (limit to 3 to avoid spam)
          overdueCases.slice(0, 3).forEach((case_: any, index: number) => {
            setTimeout(() => {
              toast({
                title: "⚠️ Overdue Case Alert",
                description: `Case for patient ${case_.patientIdentifier} is overdue and requires attention.`,
                variant: "destructive",
                duration: 8000,
              });
            }, index * 500);
          });

          // If there are more than 3, show a summary
          if (overdueCases.length > 3) {
            setTimeout(() => {
              toast({
                title: "Multiple Overdue Cases",
                description: `You have ${overdueCases.length} overdue case(s) that need attention. Please review your dashboard.`,
                variant: "destructive",
                duration: 6000,
              });
            }, 2000);
          }
          
          setHasNotified(true);
        }
      }
    };

    void fetchCases();
  }, [archivedIds, hasNotified]);

  // Check if case is completed based on stage or completion_reason
  const isCaseCompleted = (case_: any) => {
    return case_.currentStage?.startsWith("Completed") || 
           case_.completion_reason ||
           case_.completion_date;
  };

  const activeCases = cases.filter((case_) => 
    !archivedIds.includes(case_.id) && !isCaseCompleted(case_)
  );
  const completedCases = cases.filter((case_) => isCaseCompleted(case_));
  const archivedCases = cases.filter((case_) => 
    archivedIds.includes(case_.id) && !isCaseCompleted(case_)
  );

  const base = showArchived ? [...archivedCases, ...completedCases] : activeCases;
  const filteredCases = base.filter((case_) => {
    const term = searchTerm.toLowerCase();
    return (
      case_.patientIdentifier.toLowerCase().includes(term) ||
      (case_.classification || "").toLowerCase().includes(term)
    );
  });

  const archiveCase = (id: string) => {
    setArchivedIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      localStorage.setItem("archivedCaseIds", JSON.stringify(next));
      return next;
    });
    toast({
      title: "Case archived",
      description: "The case has been moved out of the active list.",
    });
  };

  const unarchiveCase = (id: string) => {
    setArchivedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      localStorage.setItem("archivedCaseIds", JSON.stringify(next));
      return next;
    });
    toast({
      title: "Case restored",
      description: "The case has been returned to the active list.",
    });
  };

  const deleteCase = async (id: string) => {
    try {
      const { error } = await supabase.from("cases").delete().eq("id", id);
      if (error) throw error;
      
      toast({
        title: "Case deleted",
        description: "This case has been permanently removed.",
        variant: "destructive"
      });
      
      // Refresh cases
      const { data } = await supabase
        .from("cases")
        .select("*")
        .order("date_of_encounter", { ascending: false });
      if (data) {
        const mappedCases = data.map((c: any) => ({
          id: c.id,
          patientIdentifier: c.patient_identifier,
          currentStage: c.current_stage,
          duration: getDurationDays(c.date_of_encounter),
          alert: c.alert ?? "normal",
          classification: c.classification,
          completion_reason: c.completion_reason,
          completion_date: c.completion_date,
          date_of_encounter: c.date_of_encounter,
        }));
        setCases(mappedCases);
        
        // Get unique patient identifiers
        const patients = Array.from(
          new Set(mappedCases.map((c) => c.patientIdentifier).filter(Boolean))
        ).sort();
        setUniquePatients(patients);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete case.",
        variant: "destructive"
      });
    }
  };

  const getAlertBadge = (alert: string) => {
    switch (alert) {
      case "overdue":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Due Soon
        </Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          On Track
        </Badge>;
    }
  };

  return (
    <DashboardLayout title="Provider Dashboard">
      {/* Quick Stats */}
      {(() => {
        const totalCases = activeCases.length + completedCases.length;
        const activeCount = activeCases.length;
        const overdueCount = activeCases.filter((c) => c.alert === "overdue").length;
        const completedCount = completedCases.length;
        return (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalCases}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{activeCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{completedCount}</div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Alerts Section */}
      {(() => {
        const overdueCases = activeCases.filter((c) => c.alert === "overdue");
        const warningCases = activeCases.filter((c) => c.alert === "warning");
        
        if (overdueCases.length === 0 && warningCases.length === 0) {
          return null;
        }

        return (
          <Card className="mb-6 border-l-4 border-l-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Active Alerts</CardTitle>
              </div>
              <CardDescription>Cases requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueCases.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue ({overdueCases.length})
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {overdueCases.slice(0, 5).map((case_) => (
                        <div key={case_.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-md">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-medium">
                              <button
                                onClick={() => navigate(`/provider/patient/${case_.patientIdentifier}`)}
                                className="text-primary hover:underline"
                              >
                                {case_.patientIdentifier}
                              </button>
                              {" - "}{case_.currentStage}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{case_.duration} days</span>
                        </div>
                      ))}
                      {overdueCases.length > 5 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          + {overdueCases.length - 5} more overdue case(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {warningCases.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due Soon ({warningCases.length})
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {warningCases.slice(0, 5).map((case_) => (
                        <div key={case_.id} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-md">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium">
                              <button
                                onClick={() => navigate(`/provider/patient/${case_.patientIdentifier}`)}
                                className="text-primary hover:underline"
                              >
                                {case_.patientIdentifier}
                              </button>
                              {" - "}{case_.currentStage}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{case_.duration} days</span>
                        </div>
                      ))}
                      {warningCases.length > 5 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          + {warningCases.length - 5} more case(s) due soon
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

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={showArchived ? "Search archived by patient identifier or classification..." : "Search by patient identifier or classification..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link to="/provider/cases/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowArchived((s) => !s)}>
              {showArchived ? "Active Cases" : "Completed Cases"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Patients</CardTitle>
          <CardDescription>Click on a patient to view and edit all their cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uniquePatients.map((patientId) => (
              <Button
                key={patientId}
                variant="outline"
                onClick={() => navigate(`/provider/patient/${patientId}`)}
                className="justify-start"
              >
                {patientId}
              </Button>
            ))}
            {uniquePatients.length === 0 && (
              <p className="text-muted-foreground col-span-full">No patients found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>{showArchived ? "Completed Cases" : "Active Cases"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Patient ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Current Stage
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Classification
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Duration (days)
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((case_) => (
                  <tr
                    key={case_.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                      <button
                        onClick={() => navigate(`/provider/patient/${case_.patientIdentifier}`)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {case_.patientIdentifier}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {case_.currentStage}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {case_.classification}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {case_.duration}
                    </td>
                    <td className="py-3 px-4">
                      {getAlertBadge(case_.alert)}
                    </td>
                    <td className="py-3 px-4">
                      {showArchived ? (
                        <>
                          <Button variant="destructive" size="sm" onClick={() => deleteCase(case_.id)}>
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => archiveCase(case_.id)}>
                            Archive
                          </Button>
                          <Button variant="destructive" size="sm" className="ml-2" onClick={() => deleteCase(case_.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Nodule Size Growth Chart */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Nodule Size Progression</CardTitle>
          <CardDescription>
            Visual representation of nodule size (mm) over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{height:"270px"}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { day: 0, size: 8 },
                  { day: 30, size: 8.2 },
                  { day: 90, size: 8.6 },
                  { day: 180, size: 9.1 },
                  { day: 365, size: 10 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: "Day", position: "insideBottomRight", offset: 0 }} />
                <YAxis label={{ value: "Size (mm)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Line type="monotone" dataKey="size" stroke="#16a34a" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Automated Risk Stratification tools */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Brock University Calculator</CardTitle>
          <CardDescription>
            Launch validated tools to estimate malignancy risk for solitary pulmonary nodules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            className="w-full text-left border rounded-md p-4 hover:bg-secondary/40 transition-colors"
            onClick={() =>
              window.open(
                "https://www.uptodate.com/contents/calculator-solitary-pulmonary-nodule-malignancy-risk-in-adults-brock-university-cancer-prediction-equation",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <div className="font-semibold text-foreground">Brock University Calculator</div>
          </button>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Timeline for Management (Lung Mass/Nodules)</CardTitle>
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
                Initial consult; CT ordered; scheduling; clinical baseline recorded
                </div>
                <div className="px-3 py-4 text-xs text-center">
                CT completed; radiology report reviewed; assess nodule characteristics
                </div>
                <div className="px-3 py-4 text-xs text-center">
                MDC planning; biopsy method selection; biopsy scheduled
                </div>
                <div className="px-3 py-4 text-xs text-center">
                Biopsy performed; histopathology processing initiated
                </div>
                <div className="px-3 py-4 text-xs text-center">
                Pathology report reviewed; determine need for further tests
                </div>
                <div className="px-3 py-4 text-xs text-center">
                Additional tests or repeat biopsy (if needed)
                </div>
                <div className="px-3 py-4 text-xs text-center">
                Pre-treatment preparation; integrate clinical + pathology + imaging data
                </div>
                <div className="px-3 py-4 text-xs text-center">
                Therapeutic MDC; final treatment plan established
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </DashboardLayout>
  );
};

export default ProviderDashboard;
