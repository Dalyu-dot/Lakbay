import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const AdminReports = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .order("date_of_encounter", { ascending: false });

        if (error) throw error;
        setCases(data || []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
        toast({
          title: "Error",
          description: "Failed to load cases for reporting.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchCases();
  }, []);

  const exportToCSV = (filteredCases: any[], filename: string) => {
    if (filteredCases.length === 0) {
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
      "Current Stage",
      "Classification",
      "Date of Encounter",
      "Physician",
      "Duration (days)",
      "Alert Status",
      "Completion Reason",
      "Completion Date",
      "Symptoms",
      "Findings",
    ];

    const rows = filteredCases.map((c) => [
      c.id,
      c.patient_identifier,
      c.current_stage,
      c.classification,
      c.date_of_encounter,
      c.physician || "",
      c.duration || 0,
      c.alert || "normal",
      c.completion_reason || "",
      c.completion_date || "",
      c.symptoms || "",
      c.findings || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${filename} has been downloaded.`,
    });
  };

  const noduleCases = cases.filter(
    (c) => c.classification && c.classification.toLowerCase().includes("nodule")
  );
  const massCases = cases.filter(
    (c) => c.classification && c.classification.toLowerCase().includes("mass")
  );

  const isCaseCompleted = (c: any) => {
    return c.current_stage?.startsWith("Completed") || 
           c.completion_reason ||
           c.completion_date;
  };

  const totalCases = cases.length;
  const avgDuration =
    cases.length > 0
      ? (cases.reduce((sum, c) => sum + (c.duration || 0), 0) / cases.length).toFixed(1)
      : "0";
  const completedCases = cases.filter((c) => isCaseCompleted(c)).length;
  const completionRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>
              Generate and export various reports for audit and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="border-2 max-w-md">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Nodule Table Report</CardTitle>
                <CardDescription>
                  Complete listing of all pulmonary nodule cases ({noduleCases.length} cases)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => exportToCSV(noduleCases, "nodule_cases_report.csv")}
                  disabled={loading || noduleCases.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold text-foreground">{totalCases}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Duration</p>
                <p className="text-2xl font-bold text-foreground">{avgDuration} days</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
