import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
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
              completion_reason: c.completion_reason,
              completion_date: c.completion_date,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch admin cases from Supabase", err);
      }
    };

    void fetchCases();
  }, []);

  // Check if case is completed
  const isCaseCompleted = (c: any) => {
    return c.stage?.startsWith("Completed") || 
           c.completion_reason ||
           c.completion_date;
  };

  // Process cases from database only (no mock data, no localStorage)
  const { totalCount, activeCount, overdueCount, completedCount, allCases } = useMemo(() => {
    try {
      // Map casesFromDb to the expected format
      const dbCases = casesFromDb.map((c) => ({
        id: c.id,
        patientId: c.patientId,
        provider: c.provider,
        institution: c.institution,
        stage: c.stage,
        duration: c.duration,
        alert: c.alert,
        completion_reason: c.completion_reason,
        completion_date: c.completion_date,
      }));
      
      const active = dbCases.filter((c) => !isCaseCompleted(c));
      const completed = dbCases.filter((c) => isCaseCompleted(c));
      
      return {
        totalCount: active.length + completed.length,
        activeCount: active.length,
        overdueCount: active.filter((c) => c.alert === "overdue").length,
        completedCount: completed.length,
        allCases: active, // Show only active cases in the main view
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
            <Button
              variant="outline"
              onClick={() => {
                if (allCases.length === 0) {
                  toast({
                    title: "No data",
                    description: "No cases to export.",
                    variant: "destructive",
                  });
                  return;
                }

                const headers = [
                  "Case ID",
                  "Patient ID",
                  "Provider",
                  "Institution",
                  "Current Stage",
                  "Duration (days)",
                  "Alert Status",
                ];

                const rows = allCases.map((c) => [
                  c.id,
                  c.patientId,
                  c.provider,
                  c.institution,
                  c.stage,
                  c.duration,
                  c.alert,
                ]);

                const csvContent = [
                  headers.join(","),
                  ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
                ].join("\n");

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `admin_cases_export_${new Date().toISOString().split("T")[0]}.csv`);
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast({
                  title: "Export successful",
                  description: "Cases have been exported to CSV.",
                });
              }}
            >
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
                    className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/provider/patient/${item.patientId}`)}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/provider/patient/${item.patientId}`);
                        }}
                        className="text-primary hover:underline"
                      >
                        {item.patientId}
                      </button>
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
