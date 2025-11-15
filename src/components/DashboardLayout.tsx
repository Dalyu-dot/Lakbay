import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/lungs.png" alt="LAKBAY" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-foreground">LAKBAY</h1>
            </Link>
            
            {/* Role-specific navigation */}
            <nav className="hidden md:flex gap-4">
              {userRole === "provider" && (
                <>
                  <Link to="/provider">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link to="/provider/cases/new">
                    <Button variant="ghost">New Case</Button>
                  </Link>
                  <Button variant="secondary" onClick={() => toast({title: "Automated Risk Stratification", description: "Coming soon!"})}>
                    Automated Risk Stratification
                  </Button>
                </>
              )}
              {userRole === "patient" && (
                <Link to="/patient">
                  <Button variant="ghost">My Timeline</Button>
                </Link>
              )}
              {userRole === "admin" && (
                <>
                  <Link to="/admin">
                    <Button variant="ghost">Overview</Button>
                  </Link>
                  <Link to="/admin/reports">
                    <Button variant="ghost">Reports</Button>
                  </Link>
                  <Link to="/admin/actions">
                    <Button variant="ghost">Quick Actions</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">{title}</h2>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
