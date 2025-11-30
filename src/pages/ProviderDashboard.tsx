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

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .order("date_of_encounter", { ascending: false });

        if (error) throw error;
        if (data) {
          const mappedCases = data.map((c: any) => ({
            id: c.id,
            patientIdentifier: c.patient_identifier,
            institution: c.institution ?? "",
            currentStage: c.current_stage,
            duration: c.duration ?? 0,
            alert: c.alert ?? "normal",
            classification: c.classification,
            completion_reason: c.completion_reason,
            completion_date: c.completion_date,
          }));
          setCases(mappedCases);
          
          // Get unique patient identifiers
          const patients = Array.from(
            new Set(mappedCases.map((c) => c.patientIdentifier).filter(Boolean))
          ).sort();
          setUniquePatients(patients);
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

    void fetchCases();
  }, []);

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
          institution: c.institution ?? "",
          currentStage: c.current_stage,
          duration: c.duration ?? 0,
          alert: c.alert ?? "normal",
          classification: c.classification,
        }));
        setCases(mappedCases);
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
    </DashboardLayout>
  );
};

export default ProviderDashboard;
