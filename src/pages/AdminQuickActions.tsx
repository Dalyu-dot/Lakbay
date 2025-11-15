import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AdminQuickActions = () => {
  return (
    <DashboardLayout title="Quick Actions">
      <div className="text-muted-foreground text-lg mb-6"></div>
      <Button variant="secondary" onClick={() => toast({title: "Automated Risk Stratification", description: "Coming soon!"})}>
        Automated Risk Stratification
      </Button>
    </DashboardLayout>
  );
};

export default AdminQuickActions;
