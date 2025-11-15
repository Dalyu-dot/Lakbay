import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    const isPatient = role === "patient";
    const valid =
      (isPatient && fullName && caseNumber) ||
      (!isPatient && email && password && role);

    if (valid) {
      localStorage.setItem("userRole", role);
      if (isPatient) {
        localStorage.setItem("patientFullName", fullName);
        localStorage.setItem("patientCaseId", caseNumber);
      }
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      
      // Navigate based on role
      switch(role) {
        case "provider":
          navigate("/provider");
          break;
        case "patient":
          navigate("/patient");
          break;
        case "admin":
          navigate("/admin");
          break;
      }
    } else {
      toast({
        title: "Error",
        description: "Please fill in all required fields including role selection.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const isPatient = role === "patient";
    const valid =
      (isPatient && fullName && caseNumber) ||
      (!isPatient && email && password && role);

    if (valid) {
      localStorage.setItem("userRole", role);
      if (isPatient) {
        localStorage.setItem("patientFullName", fullName);
        localStorage.setItem("patientCaseId", caseNumber);
      }
      toast({
        title: "Account created!",
        description: "Welcome to LAKBAY.",
      });
      
      // Navigate based on role
      switch(role) {
        case "provider":
          navigate("/provider");
          break;
        case "patient":
          navigate("/patient");
          break;
        case "admin":
          navigate("/admin");
          break;
      }
    } else {
      toast({
        title: "Error",
        description: "Please fill in all required fields including role selection.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/lungs.png" alt="LAKBAY" className="h-10 w-10" />
          <h1 className="text-3xl font-bold text-foreground">LAKBAY</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider">Healthcare Provider</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="admin">Admin/Navigator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {role === "patient" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signin-fullname">Full Name</Label>
                        <Input
                          id="signin-fullname"
                          placeholder="e.g., Juan Dela Cruz"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-casenumber">Case Number</Label>
                        <Input
                          id="signin-casenumber"
                          placeholder="Case number"
                          value={caseNumber}
                          onChange={(e) => setCaseNumber(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@hospital.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider">Healthcare Provider</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="admin">Admin/Navigator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {role === "patient" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-fullname">Full Name</Label>
                        <Input
                          id="signup-fullname"
                          placeholder="e.g., Juan Dela Cruz"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-casenumber">Case Number</Label>
                        <Input
                          id="signup-casenumber"
                          placeholder="Case number"
                          value={caseNumber}
                          onChange={(e) => setCaseNumber(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your.email@hospital.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
