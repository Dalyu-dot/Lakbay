import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";

// Mock data (preserve for existing cases)
const systemOverview = [
  {
    id: 1,
    patientId: "JD-2025-001",
    provider: "Dr. Maria Santos",
    institution: "Metro Hospital",
    stage: "Biopsy Pending",
    duration: 12,
    alert: "overdue",
  },
  {
    id: 2,
    patientId: "SM-2025-002",
    provider: "Dr. John Lee",
    institution: "City Medical Center",
    stage: "MDC Review",
    duration: 5,
    alert: "normal",
  },
  {
    id: 3,
    patientId: "RB-2025-003",
    provider: "Dr. Maria Santos",
    institution: "Metro Hospital",
    stage: "Imaging Follow-up",
    duration: 20,
    alert: "warning",
  },
];

// Also bring in providerMockCases from before plus provider-created cases.
const providerMockCases = [
  {
    id: "P-001",
    patientIdentifier: "JD-2025-001",
    currentStage: "Biopsy Pending",
    duration: 12,
    alert: "overdue",
    classification: "Pulmonary nodule",
  },
  {
    id: "P-002",
    patientIdentifier: "SM-2025-002",
    currentStage: "MDC Review",
    duration: 5,
    alert: "normal",
    classification: "Pulmonary mass",
  },
  {
    id: "P-003",
    patientIdentifier: "RB-2025-003",
    currentStage: "Imaging Follow-up",
    duration: 20,
    alert: "warning",
    classification: "Pulmonary nodule with extrathoracic malignancy",
  },
];

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Combine all cases for stats and overview table.
  const { totalCount, activeCount, overdueCount, completedCount, allCases } = useMemo(() => {
    try {
      const stored = localStorage.getItem("providerCases");
      const archivedRaw = localStorage.getItem("archivedCaseIds");
      const storedCases = stored ? JSON.parse(stored) : [];
      const archivedIds = archivedRaw ? JSON.parse(archivedRaw) : [];
      // providerMockCases and storedCases use the same structure; systemOverview is separate
      const all = [
        ...storedCases.map((c) => ({
          id: c.id,
          patientId: c.patientIdentifier,
          provider: c.meta?.physician || "—",
          institution: c.meta?.institution || "—",
          stage: c.currentStage,
          duration: c.duration,
          alert: c.alert,
        })),
        // Optionally include systemOverview (comment out if you only want live/tracked cases):
        ...systemOverview,
      ];
      const active = all.filter((c) => !archivedIds.includes(c.id));
      const archived = all.filter((c) => archivedIds.includes(c.id));
      return {
        totalCount: active.length,
        activeCount: active.length,
        overdueCount: active.filter((c) => c.alert === "overdue").length,
        completedCount: archived.length,
        allCases: active,
      };
    } catch {
      return { totalCount: 0, activeCount: 0, overdueCount: 0, completedCount: 0, allCases: [] };
    }
  }, []);

  const filteredData = allCases.filter((item) => {
    // Allow for missing provider data for new cases
    const matchesSearch = (item.patientId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.provider || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getAlertBadge = (alert) => {
    switch (alert) {
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Due Soon</Badge>;
      default:
        return <Badge variant="secondary">On Track</Badge>;
    }
  };

  return (
    <DashboardLayout title="Admin/Navigator Dashboard">
      {/* System Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cases
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Across active list</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Cases
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Archived cases</p>
          </CardContent>
        </Card>
      </div>
      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by patient ID or provider..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* System Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Monitor all cases across providers & institutions
          </CardDescription>
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
                    Provider
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Institution
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Current Stage
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Duration (days)
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                      {item.patientId}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.provider}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.institution || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {item.stage}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {item.duration}
                    </td>
                    <td className="py-3 px-4">
                      {getAlertBadge(item.alert)}
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

export default AdminDashboard;
