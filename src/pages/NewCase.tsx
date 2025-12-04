import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const NewCase = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    patientId: "",
    dateOfEncounter: today,
    physician: "",
    classification: "",
    symptoms: "",
    imagingDate: "",
    imagingType: "",
    findings: "",
  });
  const [existingPatients, setExistingPatients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatientOption, setSelectedPatientOption] = useState<string>("");
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>("");
  const [showPatientDropdown, setShowPatientDropdown] = useState<boolean>(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Get unique patient identifiers from cases
        const { data, error } = await supabase
          .from("cases")
          .select("patient_identifier");

        if (error) throw error;

        // Get unique patient identifiers
        const uniquePatients = Array.from(
          new Set((data || []).map((c: any) => c.patient_identifier).filter(Boolean))
        ).sort();

        // Also get from users table (patients)
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("case_number")
          .eq("role", "patient")
          .not("case_number", "is", null);

        if (!usersError && usersData) {
          const userCaseNumbers = usersData.map((u: any) => u.case_number).filter(Boolean);
          const allPatients = Array.from(new Set([...uniquePatients, ...userCaseNumbers])).sort();
          setExistingPatients(allPatients);
        } else {
          setExistingPatients(uniquePatients);
        }
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      }
    };

    void fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Generate unique case ID using timestamp to avoid duplicates
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const caseId = `CASE-${timestamp}-${randomSuffix}`;

    const classification =
      formData.classification === "nodule"
        ? "Pulmonary nodule"
        : formData.classification === "nodule-with-malignancy"
        ? "Pulmonary nodule with extrathoracic malignancy"
        : formData.classification === "mass"
        ? "Pulmonary mass"
        : formData.classification === "mass-with-malignancy"
        ? "Pulmonary mass with extrathoracic malignancy"
        : "Unspecified";

    // Save to Supabase `cases` table
    try {
      const { error } = await supabase.from("cases").insert({
        id: caseId,
        patient_identifier: formData.patientId,
        current_stage: "New Case",
        duration: 0,
        alert: "normal",
        classification: classification,
        date_of_encounter: formData.dateOfEncounter,
        physician: formData.physician,
        symptoms: formData.symptoms || null,
        imaging_date: formData.imagingDate || null,
        imaging_type: formData.imagingType || null,
        findings: formData.findings || null,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        toast({
          title: "Error",
          description: "Failed to create case. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Case created successfully",
        description: "The patient case has been added to the database.",
      });

      navigate("/provider");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter patients based on search term
  const filteredPatients = existingPatients.filter((patientId) =>
    patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  const handlePatientSelect = (patientId: string) => {
    setFormData(prev => ({ ...prev, patientId }));
    setPatientSearchTerm(patientId);
    setSelectedPatientOption(patientId);
    setShowPatientDropdown(false);
  };

  const handlePatientInputChange = (value: string) => {
    setPatientSearchTerm(value);
    setShowPatientDropdown(true);
    if (value === "") {
      setSelectedPatientOption("");
      handleChange("patientId", "");
    }
  };

  return (
    <DashboardLayout title="New Patient Case">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* System Data */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Basic encounter details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="patientId">Case ID *</Label>
                      <div className="relative">
                        <Input
                          id="patientId"
                          placeholder="Search or enter new Case ID (e.g., JD-2025-001)"
                          value={patientSearchTerm}
                          onChange={(e) => {
                            handlePatientInputChange(e.target.value);
                            handleChange("patientId", e.target.value);
                          }}
                          onFocus={() => setShowPatientDropdown(true)}
                          onBlur={() => {
                            // Delay to allow click on dropdown item
                            setTimeout(() => setShowPatientDropdown(false), 200);
                          }}
                          required
                        />
                        {showPatientDropdown && patientSearchTerm && filteredPatients.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredPatients.slice(0, 10).map((patientId) => (
                              <div
                                key={patientId}
                                className="px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handlePatientSelect(patientId);
                                }}
                              >
                                {patientId}
                              </div>
                            ))}
                            {filteredPatients.length > 10 && (
                              <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                                {filteredPatients.length - 10} more results...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {patientSearchTerm && filteredPatients.length === 0 && existingPatients.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          No matching patients found. This will create a new case.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfEncounter">Date of Encounter *</Label>
                      <Input
                        id="dateOfEncounter"
                        type="date"
                        value={formData.dateOfEncounter}
                        onChange={(e) => handleChange("dateOfEncounter", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="space-y-2">
                    {/* Removed Patient Name input */}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="physician">Physician Name *</Label>
                      <Input
                        id="physician"
                        placeholder="Dr. Name"
                        value={formData.physician}
                        onChange={(e) => handleChange("physician", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
              <CardDescription>Select the appropriate classification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="classification">Classification *</Label>
                <Select value={formData.classification} onValueChange={(value) => handleChange("classification", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nodule">Pulmonary nodule</SelectItem>
                    <SelectItem value="nodule-with-malignancy">Pulmonary nodule with extrathoracic malignancy</SelectItem>
                    <SelectItem value="mass">Pulmonary mass</SelectItem>
                    <SelectItem value="mass-with-malignancy">Pulmonary mass with extrathoracic malignancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Information</CardTitle>
              <CardDescription>Symptoms and imaging details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symptoms">Presenting Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe patient symptoms..."
                  value={formData.symptoms}
                  onChange={(e) => handleChange("symptoms", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imagingDate">Imaging Date</Label>
                  <Input
                    id="imagingDate"
                    type="date"
                    value={formData.imagingDate}
                    onChange={(e) => handleChange("imagingDate", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imagingType">Imaging Type</Label>
                  <Select value={formData.imagingType} onValueChange={(value) => handleChange("imagingType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chest-xray">Chest X-ray</SelectItem>
                      <SelectItem value="ct-scan">CT Scan</SelectItem>
                      <SelectItem value="pet-scan">PET Scan</SelectItem>
                      <SelectItem value="mri">MRI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="findings">Imaging Findings</Label>
                <Textarea
                  id="findings"
                  placeholder="Describe imaging findings..."
                  value={formData.findings}
                  onChange={(e) => handleChange("findings", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/provider")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default NewCase;
