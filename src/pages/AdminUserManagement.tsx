import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

const AdminUserManagement = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      if (error) throw error;

      const pending = (data || []).filter((u: any) => !u.approved);
      const approved = (data || []).filter((u: any) => u.approved);

      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCaseNumber = async (user: any) => {
    if (user.role !== "patient") {
      toast({
        title: "Not a patient account",
        description: "Only patient users can be assigned a case ID.",
        variant: "destructive",
      });
      return;
    }

    const current = user.case_number || "";
    const input = window.prompt(
      `Assign or update Case ID for ${user.full_name || user.email || "patient"}:`,
      current,
    );

    if (input === null) return; // user cancelled

    const trimmed = input.trim();
    if (!trimmed) {
      toast({
        title: "Case ID required",
        description: "Please provide a non-empty Case ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ case_number: trimmed })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Case ID updated",
        description: `Case ID for ${user.full_name || user.email || "patient"} set to ${trimmed}.`,
      });

      await fetchUsers();
    } catch (err) {
      console.error("Failed to assign case number:", err);
      toast({
        title: "Error",
        description: "Failed to assign Case ID. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ approved: true })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User approved",
        description: "The user can now sign in to their account.",
      });

      fetchUsers();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve user.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User rejected",
        description: "The sign-up request has been removed.",
        variant: "destructive",
      });

      fetchUsers();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject user.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500",
      provider: "bg-blue-500",
      patient: "bg-green-500",
    };
    return (
      <Badge className={colors[role] || "bg-gray-500"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="User Management">
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved Users ({approvedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Sign-up Requests</CardTitle>
              <CardDescription>
                Review and approve or reject new user sign-ups. Verify that the role matches the user's identity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pending sign-up requests.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <Card key={user.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {user.full_name || user.email || "Unknown User"}
                              </h3>
                              {getRoleBadge(user.role)}
                            </div>
                            <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              {user.email && (
                                <div>
                                  <span className="font-medium">Email:</span> {user.email}
                                </div>
                              )}
                              {user.full_name && (
                                <div>
                                  <span className="font-medium">Full Name:</span> {user.full_name}
                                </div>
                              )}
                              {user.case_number && (
                                <div>
                                  <span className="font-medium">Case Number:</span> {user.case_number}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Requested Role:</span> {user.role}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              ⚠️ Verify this user's identity matches their requested role before approving.
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(user.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Users</CardTitle>
              <CardDescription>
                All users who have been approved and can access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No approved users yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold">Name/Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Case Number</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                          <td className="py-3 px-4 text-sm">
                            {user.role === "patient" ? (
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => handleAssignCaseNumber(user)}
                              >
                                {user.full_name || user.email || "Unknown"}
                              </button>
                            ) : (
                              user.full_name || user.email || "Unknown"
                            )}
                          </td>
                          <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {user.case_number || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminUserManagement;

