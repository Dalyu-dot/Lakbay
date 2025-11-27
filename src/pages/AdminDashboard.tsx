import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabaseClient";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [casesFromDb, setCasesFromDb] = useState<any[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .order("date_of_encounter", { ascending: false });

        if (error) throw error;

        if (data) {
          setCasesFromDb(
            data.map((c: any) => ({
              id: c.id,
              patientId: c.patient_identifier,
              provider: c.physician ?? "—",
              institution: c.institution ?? "—",
              stage: c.current_stage,
              duration: c.duration ?? 0,
              alert: c.alert ?? "normal",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch admin cases from Supabase", err);
      }
    };

    void fetchCases();
  }, []);

  // Combine all cases for stats and overview table.
  const { totalCount, activeCount, overdueCount, completedCount, allCases } = useMemo(() => {
    try {
      const stored = localStorage.getItem("providerCases");
      const archivedRaw = localStorage.getItem("archivedCaseIds");
      const storedCases = stored ? JSON.parse(stored) : [];
      const archivedIds = archivedRaw ? JSON.parse(archivedRaw) : [];
      
      // Map casesFromDb to the expected format
      const dbCases = casesFromDb.map((c) => ({
        id: c.id,
        patientId: c.patientId,
        provider: c.provider,
        institution: c.institution,
        stage: c.stage,
        duration: c.duration,
        alert: c.alert,
      }));
      
      // Map localStorage cases
      const localCases = storedCases.map((c: any) => ({
        id: c.id,
        patientId: c.patientIdentifier,
        provider: c.meta?.physician || "—",
        institution: c.meta?.institution || "—",
        stage: c.currentStage,
        duration: c.duration,
        alert: c.alert,
      }));
      
      const all = [...dbCases, ...localCases];
      const active = all.filter((c) => !archivedIds.includes(c.id));
      const archived = all.filter((c) => archivedIds.includes(c.id));
      
      return {
        totalCount: active.length,
        activeCount: active.length,
        overdueCount: active.filter((c) => c.alert === "overdue").length,
        completedCount: archived.length,
        allCases: active,
      };
    } catch (err) {
      console.error("Error processing cases:", err);
      return { totalCount: 0, activeCount: 0, overdueCount: 0, completedCount: 0, allCases: [] };
    }
  }, [casesFromDb]);

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
                    <td className="py-3 px-4">
                      {typeof item.id === "string" && (
                        <Button variant="destructive" size="sm" onClick={() => {
                          const stored = localStorage.getItem("providerCases");
                          const cases = stored ? JSON.parse(stored) : [];
                          const updated = cases.filter((c) => c.id !== item.id);
                          localStorage.setItem("providerCases", JSON.stringify(updated));
                          window.location.reload();
                        }}>
                          Delete
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
    </DashboardLayout>
  );
};

export default AdminDashboard;
