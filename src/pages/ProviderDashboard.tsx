import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

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

  const filteredCases = mockCases.filter((case_) =>
    case_.patientIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.institution.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">24</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">18</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">3</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">6</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by patient identifier or institution..."
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
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Cases</CardTitle>
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
                    Institution
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
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {case_.institution}
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
