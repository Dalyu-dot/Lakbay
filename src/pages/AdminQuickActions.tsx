import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

const AdminQuickActions = () => {
  const openBrockCalculator = () => {
    window.open(
      "https://www.uptodate.com/contents/calculator-solitary-pulmonary-nodule-malignancy-risk-in-adults-brock-university-cancer-prediction-equation",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <DashboardLayout title="Quick Actions">
      <div className="text-muted-foreground text-lg mb-6">
        Launch tools that support automated risk stratification and system monitoring.
      </div>
      <div className="grid gap-4 max-w-md">
        <Button variant="secondary" className="justify-start h-auto py-4 px-6" onClick={openBrockCalculator}>
          Brock University Calculator
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default AdminQuickActions;
