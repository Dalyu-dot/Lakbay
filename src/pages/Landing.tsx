import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/lungs.png" alt="LAKBAY" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-foreground">LAKBAY</h1>
          </div>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Guiding Every Step in the Journey of Lung Health
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Streamlining Lung Nodule and Mass Management—Together. A comprehensive system for tracking, 
            documentation, and monitoring of patients with lung nodules and masses.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
        </div>
      </section>


      {/* User Roles Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Built for Every Role
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Healthcare Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Add and edit patient cases</li>
                  <li>• Track case progress and timelines</li>
                  <li>• Receive automated alerts</li>
                  <li>• Export audit data</li>
                  <li>• Visualize patient journey</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• View personal timeline</li>
                  <li>• Track management status</li>
                  <li>• Receive timely alerts</li>
                  <li>• Monitor completed stages</li>
                  <li>• Stay informed on progress</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Admin/Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Manage user roles</li>
                  <li>• Monitor overall progress</li>
                  <li>• Generate system reports</li>
                  <li>• Trigger notifications</li>
                  <li>• Export audit data</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 LAKBAY - Empowering Care, Tracking Progress, Improving Outcomes</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
