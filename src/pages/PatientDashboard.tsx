import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";

// Mock patient timeline data
const timelineStages = [
  {
    date: "2025-01-05",
    stage: "Initial Imaging",
    days: 0,
    status: "completed",
    alert: null,
  },
  {
    date: "2025-01-12",
    stage: "Referral to Specialist",
    days: 7,
    status: "completed",
    alert: null,
  },
  {
    date: "2025-01-18",
    stage: "Biopsy Scheduled",
    days: 13,
    status: "completed",
    alert: null,
  },
  {
    date: "2025-01-25",
    stage: "Biopsy Performed",
    days: 20,
    status: "ongoing",
    alert: "Results pending",
  },
  {
    date: "TBD",
    stage: "MDC Review",
    days: null,
    status: "pending",
    alert: null,
  },
  {
    date: "TBD",
    stage: "Treatment Plan",
    days: null,
    status: "pending",
    alert: null,
  },
];

const PatientDashboard = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "ongoing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Completed</Badge>;
      case "ongoing":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <DashboardLayout title="My Care Timeline">
      {/* Patient Info Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patient ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">JD-2025-001</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Care Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">Dr. Maria Santos</div>
            <p className="text-sm text-muted-foreground">Metro Hospital</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days in Care
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">20 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status Alert */}
      <Card className="mb-6 border-l-4 border-l-yellow-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Current Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            Your biopsy was performed on January 25, 2025. Results are currently being processed 
            and will be reviewed by the multidisciplinary team. You will be notified once results 
            are available.
          </p>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Your Care Journey</CardTitle>
          <CardDescription>
            Track your progress through each stage of care
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineStages.map((stage, index) => (
              <div key={index} className="flex gap-4">
                {/* Icon Column */}
                <div className="flex flex-col items-center">
                  {getStatusIcon(stage.status)}
                  {index < timelineStages.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-2" />
                  )}
                </div>

                {/* Content Column */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{stage.stage}</h4>
                    {getStatusBadge(stage.status)}
                  </div>
                  
                  <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                    <span>Date: {stage.date}</span>
                    {stage.days !== null && (
                      <span>Day {stage.days}</span>
                    )}
                  </div>
                  
                  {stage.alert && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      {stage.alert}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What to Expect Next</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Your biopsy results will be available within 5-7 business days</li>
            <li>• Once results are ready, your case will be reviewed by our multidisciplinary team</li>
            <li>• You will receive a notification to schedule a follow-up appointment</li>
            <li>• If you have any questions, please contact your care team</li>
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PatientDashboard;
