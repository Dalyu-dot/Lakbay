import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const SUPERUSER_EMAIL = "lakbay@gmail.com";
const SUPERUSER_PASSWORD = "LAKBAY2025";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Ensure superuser exists on component mount
  useEffect(() => {
    const ensureSuperuser = async () => {
      try {
        // Check if superuser exists
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("*")
          .eq("email", SUPERUSER_EMAIL)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          // PGRST116 is "not found" which is fine
          console.error("Error checking superuser:", checkError);
          return;
        }

        // If superuser doesn't exist, create it
        if (!existingUser) {
          const insertData: any = {
            email: SUPERUSER_EMAIL,
            password: SUPERUSER_PASSWORD,
            role: "admin",
            full_name: "LAKBAY Super Admin",
          };
          
          // Only add approved if column exists
          try {
            insertData.approved = true;
          } catch (e) {
            // Column doesn't exist yet - will be handled by SQL
          }

          const { error: insertError } = await supabase.from("users").insert(insertData);

          if (insertError) {
            console.error("Error creating superuser:", insertError);
          } else {
            console.log("Superuser created successfully");
          }
        } else if (existingUser.approved === false) {
          // If superuser exists but not approved, approve it (if column exists)
          try {
            const { error: updateError } = await supabase
              .from("users")
              .update({ approved: true })
              .eq("email", SUPERUSER_EMAIL);

            if (updateError) {
              console.error("Error approving superuser:", updateError);
            } else {
              console.log("Superuser approved");
            }
          } catch (e) {
            // Column doesn't exist - that's okay, user is already created
            console.log("Approved column not found, but superuser exists");
          }
        }
      } catch (err) {
        console.error("Error ensuring superuser:", err);
      }
    };

    void ensureSuperuser();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPatient = role === "patient";
    if (!role) {
      toast({
        title: "Error",
        description: "Please select a role.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      let data: any = null;

      if (isPatient) {
        // Patient sign-in via full name (case-insensitive) + password in Supabase `users` table
        if (!fullName || !patientPassword) {
          throw new Error("Please provide full name and password.");
        }

        // Case-insensitive search for patient by name
        const { data: allPatients, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("role", "patient");

        if (fetchError) throw fetchError;
        
        // Find patient with case-insensitive name match and password match
        const patient = allPatients?.find(
          (p: any) => 
            p.full_name?.toLowerCase().trim() === fullName.toLowerCase().trim() &&
            p.password === patientPassword
        );

        if (!patient) {
          throw new Error("Invalid credentials. Please check your name and password.");
        }
        
        data = patient;
        
        // Check if user is approved (if approved column exists)
        if (data.approved === false) {
          throw new Error("Your account is pending approval. Please wait for admin approval.");
        }
      } else {
        // Provider / Admin sign-in via email + password in Supabase `users` table
        if (!email || !password) {
          throw new Error("Please provide email and password.");
        }

        // Check if this is superuser login - handle specially
        const isSuperuser = email.toLowerCase().trim() === SUPERUSER_EMAIL.toLowerCase();
        
        if (isSuperuser && password === SUPERUSER_PASSWORD) {
          // Superuser login - find or create superuser
          const { data: superuserData, error: superuserError } = await supabase
            .from("users")
            .select("*")
            .eq("email", SUPERUSER_EMAIL)
            .maybeSingle();

          if (superuserError && superuserError.code !== "PGRST116") {
            throw superuserError;
          }

          // If superuser doesn't exist, create it
          if (!superuserData) {
            const { error: createError } = await supabase.from("users").insert({
              email: SUPERUSER_EMAIL,
              password: SUPERUSER_PASSWORD,
              role: "admin",
              approved: true,
              full_name: "LAKBAY Super Admin",
            });

            if (createError) throw createError;

            // Set session for newly created superuser
            localStorage.setItem("userRole", "admin");
            toast({
              title: "Welcome back!",
              description: "Successfully signed in as superuser.",
            });
            navigate("/admin");
            return;
          }

          // Superuser exists - ensure approved and sign in
          if (!superuserData.approved) {
            await supabase
              .from("users")
              .update({ approved: true })
              .eq("email", SUPERUSER_EMAIL);
          }

          localStorage.setItem("userRole", "admin");
          toast({
            title: "Welcome back!",
            description: "Successfully signed in as superuser.",
          });
          navigate("/admin");
          return;
        }

        // Regular user login
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("role", role)
          .eq("email", email.trim())
          .eq("password", password)
          .maybeSingle();

        if (error) throw error;
        if (!userData) throw new Error("Login failed. Please check your account information, or note that your signup may have been declined.");
        
        data = userData;
        
        // Check if user is approved (if approved column exists)
        if (data.approved === false) {
          throw new Error("Your account is pending approval. Please wait for admin approval.");
        }
      }

      // Persist basic session info on the client for routing
      localStorage.setItem("userRole", role);
      if (isPatient) {
        localStorage.setItem("patientFullName", data.full_name);
        localStorage.setItem("patientCaseId", data.case_number || "");
      }
      // Store provider email for case filtering
      if (role === "provider" && data.email) {
        localStorage.setItem("providerEmail", data.email);
      }
      // Store admin email if needed
      if (role === "admin" && data.email) {
        localStorage.setItem("adminEmail", data.email);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in using the database.",
      });

      // Navigate based on role
      switch (role) {
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
    } catch (err: any) {
      toast({
        title: "Sign-in failed",
        description: err.message ?? "There was a problem signing you in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPatient = role === "patient";

    if (!role) {
      toast({
        title: "Error",
        description: "Please select a role.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (isPatient) {
        if (!fullName || !patientPassword) {
          throw new Error("Please provide full name and password.");
        }

        const trimmedName = fullName.trim();

        // Check if patient with same name already exists (case insensitive)
        const { data: existingPatients, error: checkError } = await supabase
          .from("users")
          .select("full_name")
          .eq("role", "patient");

        if (checkError) throw checkError;

        const nameExists = existingPatients?.some(
          (p: any) => p.full_name?.toLowerCase().trim() === trimmedName.toLowerCase()
        );

        if (nameExists) {
          throw new Error("A patient with this name already exists. Please sign in instead.");
        }

        // Validate that patient name exactly matches an existing case patient_name
        const { data: casesData, error: casesError } = await supabase
          .from("cases")
          .select("patient_name, patient_identifier")
          .not("patient_name", "is", null);

        if (casesError) throw casesError;

        // Find exact match (case-sensitive for names)
        const matchingCase = (casesData || []).find(
          (c: any) => c.patient_name && c.patient_name.trim() === trimmedName
        );

        if (!matchingCase) {
          throw new Error(
            `No case found for patient name "${trimmedName}". Please ensure the name matches exactly as entered in the case (case-sensitive).`
          );
        }

        // Auto-assign case_number from matching case
        const caseNumber = matchingCase.patient_identifier;

        const { error } = await supabase.from("users").insert({
          role: "patient",
          full_name: trimmedName,
          password: patientPassword,
          case_number: caseNumber, // Auto-assign case number from matching case
          approved: false, // Still pending admin approval
        });

        if (error) throw error;

        toast({
          title: "Sign-up request submitted!",
          description: `Your account is linked to case ${caseNumber} and is pending admin approval.`,
        });
      } else {
        if (!email || !password) {
          throw new Error("Please provide email and password.");
        }

        const { error } = await supabase.from("users").insert({
          role,
          email,
          password,
          full_name: fullName || null,
          approved: false, // Pending approval
        });

        if (error) throw error;

        toast({
          title: "Sign-up request submitted!",
          description: "Your account is pending admin approval. You will be notified once approved.",
        });
      }

      // Don't navigate - user must wait for approval
      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
      setCaseNumber("");
      setPatientPassword("");
      setRole("");
    } catch (err: any) {
      toast({
        title: "Sign-up failed",
        description: err.message ?? "There was a problem creating your account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={patientPassword}
                          onChange={(e) => setPatientPassword(e.target.value)}
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
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
                        <p className="text-xs text-muted-foreground">
                         
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={patientPassword}
                          onChange={(e) => setPatientPassword(e.target.value)}
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
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
