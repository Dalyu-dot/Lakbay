import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data
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

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("all");

  const filteredData = systemOverview.filter((item) => {
    const matchesSearch = item.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstitution = filterInstitution === "all" || item.institution === filterInstitution;
    return matchesSearch && matchesInstitution;
  });

  const getAlertBadge = (alert: string) => {
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
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">48</div>
            <p className="text-xs text-muted-foreground mt-1">Across all providers</p>
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
            <div className="text-3xl font-bold text-primary">36</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">7</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Duration
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">14.3</div>
            <p className="text-xs text-muted-foreground mt-1">Days per case</p>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterInstitution} onValueChange={setFilterInstitution}>
              <SelectTrigger className="md:w-[240px]">
                <SelectValue placeholder="Filter by institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                <SelectItem value="Metro Hospital">Metro Hospital</SelectItem>
                <SelectItem value="City Medical Center">City Medical Center</SelectItem>
              </SelectContent>
            </Select>

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
            Monitor all cases across providers and institutions
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
                {filteredData.map((item) => (
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
                      {item.institution}
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

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Send Notifications</Button>
            <Button variant="outline">Generate Reports</Button>
            <Button variant="outline">Manage Users</Button>
            <Button variant="outline">View Analytics</Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
