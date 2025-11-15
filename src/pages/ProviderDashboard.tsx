import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockCases = [
  {
    id: "P-001",
    patientIdentifier: "JD-2025-001",
    institution: "Metro Hospital",
    currentStage: "Biopsy Pending",
    duration: 12,
    alert: "overdue",
    classification: "Pulmonary nodule",
  },
  {
    id: "P-002",
    patientIdentifier: "SM-2025-002",
    institution: "City Medical Center",
    currentStage: "MDC Review",
    duration: 5,
    alert: "normal",
    classification: "Pulmonary mass",
  },
  {
    id: "P-003",
    patientIdentifier: "RB-2025-003",
    institution: "Metro Hospital",
    currentStage: "Imaging Follow-up",
    duration: 20,
    alert: "warning",
    classification: "Pulmonary nodule with extrathoracic malignancy",
  },
];

const ProviderDashboard = () => {
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

  const cases = useMemo(() => {
    const stored = localStorage.getItem("providerCases");
    const parsed = stored ? (JSON.parse(stored) as any[]) : [];
    return [...parsed, ...mockCases];
  }, []);

  const activeCases = cases.filter((case_) => !archivedIds.includes(case_.id));
  const archivedCases = cases.filter((case_) => archivedIds.includes(case_.id));

  const base = showArchived ? archivedCases : activeCases;
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
        const totalCases = activeCases.length;
        const activeCount = activeCases.length;
        const overdueCount = activeCases.filter((c) => c.alert === "overdue").length;
        const completedCount = archivedCases.length;
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
              {showArchived ? "Active Cases" : "Archived"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>{showArchived ? "Archived Cases" : "Patient Cases"}</CardTitle>
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
                    className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                      {case_.patientIdentifier}
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
                        <Button variant="outline" size="sm" onClick={() => unarchiveCase(case_.id)}>
                          Unarchive
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => archiveCase(case_.id)}>
                          Archive
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ProviderDashboard;
