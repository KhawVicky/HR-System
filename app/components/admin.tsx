import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  UserPlus,
  Users,
  UserCheck,
  Mail,
  KeyRound,
  Pencil,
  Ban,
  CheckCircle2,
  Briefcase,
} from "lucide-react";

import { PageLayout } from "./PageLayout";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { LoadingState } from "./LoadingState";

type UserRole = "HR Staff" | "Hiring Manager";
type UserStatus = "Active" | "Inactive";

type UserAccount = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

type ApiUser = {
  id: number;
  name: string;
  email: string;
  status: string;
  roleId: 1 | 2;
  roleKey: "hr_staff" | "hiring_manager";
  createdAt: string;
};

const mapApiUser = (user: ApiUser): UserAccount => ({
  id: `USR-${String(user.id).padStart(3, "0")}`,
  fullName: user.name,
  email: user.email,
  role: user.roleId === 2 ? "Hiring Manager" : "HR Staff",
  status: user.status === "active" ? "Active" : "Inactive",
  createdAt: user.createdAt.slice(0, 10),
});

const roleToId = (role: UserRole) =>
  role === "Hiring Manager" ? 2 : 1;

const statusToApi = (status: UserStatus) =>
  status === "Active" ? "active" : "inactive";

function getRoleBadgeClass(role: UserRole) {
  if (role === "HR Staff") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

function getStatusBadgeClass(status: UserStatus) {
  return status === "Active"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-slate-100 text-slate-600 border-slate-200";
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    role: "" as "" | UserRole,
    status: "Active" as UserStatus,
    temporaryPassword: "",
  });

  useEffect(() => {
    setIsLoadingUsers(true);
    apiFetch<{ users: ApiUser[] }>("/users")
      .then((data) => setUsers(data.users.map(mapApiUser)))
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load users",
        ),
      )
      .finally(() => setIsLoadingUsers(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword) ||
        user.status.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const totalUsers = users.length;
  const activeUsers = users.filter(
    (user) => user.status === "Active",
  ).length;
  const hrCount = users.filter(
    (user) => user.role === "HR Staff",
  ).length;
  const hiringManagerCount = users.filter(
    (user) => user.role === "Hiring Manager",
  ).length;

  const resetCreateForm = () => {
    setNewUser({
      fullName: "",
      email: "",
      role: "",
      status: "Active",
      temporaryPassword: "",
    });
  };

  const handleCreateUser = async () => {
    if (!newUser.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!newUser.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!newUser.role) {
      toast.error("Please select a role");
      return;
    }

    if (!newUser.temporaryPassword.trim()) {
      toast.error("Temporary password is required");
      return;
    }

    try {
      const data = await apiFetch<{ user: ApiUser }>("/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: newUser.fullName.trim(),
          email: newUser.email.trim(),
          roleId: roleToId(newUser.role),
          status: statusToApi(newUser.status),
          temporaryPassword: newUser.temporaryPassword,
          department:
            newUser.role === "Hiring Manager"
              ? "Engineering"
              : "Human Resources",
        }),
      });

      setUsers((prev) => [mapApiUser(data.user), ...prev]);
      setOpenCreate(false);
      resetCreateForm();

      toast.success("Account created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create account",
      );
    }
  };

  const [openResetPassword, setOpenResetPassword] =
    useState(false);

  const [resetPasswordUser, setResetPasswordUser] =
    useState<UserAccount | null>(null);

  const [resetPasswordForm, setResetPasswordForm] = useState({
    temporaryPassword: "",
    requirePasswordChange: true,
  });

  const handleResetPassword = (user: UserAccount) => {
    setResetPasswordUser(user);
    setResetPasswordForm({
      temporaryPassword: "",
      requirePasswordChange: true,
    });
    setOpenResetPassword(true);
  };

  const handleConfirmResetPassword = () => {
    if (!resetPasswordUser) return;

    if (!resetPasswordForm.temporaryPassword.trim()) {
      toast.error("Temporary password is required");
      return;
    }

    setOpenResetPassword(false);
    toast.success(
      `Temporary password reset for ${resetPasswordUser.fullName}`,
    );
    setResetPasswordUser(null);
  };

  const handleToggleStatus = (user: UserAccount) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status:
                item.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : item,
      ),
    );

    toast.success(
      `${user.fullName} is now ${
        user.status === "Active" ? "inactive" : "active"
      }`,
    );
  };

  const [openEdit, setOpenEdit] = useState(false);

  const [editingUser, setEditingUser] =
    useState<UserAccount | null>(null);

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "HR Staff" as UserRole,
    status: "Active" as UserStatus,
  });

  const handleEdit = (user: UserAccount) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setOpenEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;

    if (!editForm.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!editForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              fullName: editForm.fullName,
              email: editForm.email,
              role: editForm.role,
              status: editForm.status,
            }
          : user,
      ),
    );

    setOpenEdit(false);
    setEditingUser(null);
    toast.success("Account updated successfully");
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "User Management" },
      ]}
      title="User Management"
      subtitle={
        <p className="text-slate-600">
          Create and manage internal accounts for HR staff and
          hiring managers.
        </p>
      }
      useCard={false}
    >
      {isLoadingUsers ? (
        <LoadingState title="Loading user accounts" />
      ) : (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog
            open={openCreate}
            onOpenChange={setOpenCreate}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#003B7A] text-white hover:bg-[#002f63] shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogDescription>
                  Add a new internal user account for the HR
                  system.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter full name"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: UserRole) =>
                        setNewUser((prev) => ({
                          ...prev,
                          role: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HR Staff">
                          HR Staff
                        </SelectItem>
                        <SelectItem value="Hiring Manager">
                          Hiring Manager
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newUser.status}
                      onValueChange={(value: UserStatus) =>
                        setNewUser((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">
                          Active
                        </SelectItem>
                        <SelectItem value="Inactive">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temporaryPassword">
                    Temporary Password
                  </Label>
                  <Input
                    id="temporaryPassword"
                    type="text"
                    placeholder="Enter temporary password"
                    value={newUser.temporaryPassword}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        temporaryPassword: e.target.value,
                      }))
                    }
                  />
                  <p className="text-sm text-slate-500">
                    The user can change this password after
                    first login.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenCreate(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#003B7A] text-white hover:bg-[#002f63]"
                  onClick={handleCreateUser}
                >
                  Create Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent
              className="sm:max-w-[560px]"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Edit Account</DialogTitle>
                <DialogDescription>
                  Update the selected user account details.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-fullName">
                    Full Name
                  </Label>
                  <Input
                    id="edit-fullName"
                    placeholder="Enter full name"
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email address"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(value: UserRole) =>
                        setEditForm((prev) => ({
                          ...prev,
                          role: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HR Staff">
                          HR Staff
                        </SelectItem>
                        <SelectItem value="Hiring Manager">
                          Hiring Manager
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value: UserStatus) =>
                        setEditForm((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">
                          Active
                        </SelectItem>
                        <SelectItem value="Inactive">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenEdit(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#003B7A] text-white hover:bg-[#002f63]"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={openResetPassword}
            onOpenChange={setOpenResetPassword}
          >
            <DialogContent
              className="sm:max-w-[520px]"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set a new temporary password for this account.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">
                    {resetPasswordUser?.fullName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {resetPasswordUser?.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-temporaryPassword">
                    New Temporary Password
                  </Label>
                  <Input
                    id="reset-temporaryPassword"
                    type="text"
                    placeholder="Enter temporary password"
                    value={resetPasswordForm.temporaryPassword}
                    onChange={(e) =>
                      setResetPasswordForm((prev) => ({
                        ...prev,
                        temporaryPassword: e.target.value,
                      }))
                    }
                  />
                  <p className="text-sm text-slate-500">
                    The user will use this password for the next
                    login.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                  <input
                    id="require-password-change"
                    type="checkbox"
                    checked={
                      resetPasswordForm.requirePasswordChange
                    }
                    onChange={(e) =>
                      setResetPasswordForm((prev) => ({
                        ...prev,
                        requirePasswordChange: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="require-password-change"
                      className="cursor-pointer"
                    >
                      Require password change on next login
                    </Label>
                    <p className="text-sm text-slate-500">
                      The user must create a new password after
                      signing in.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenResetPassword(false);
                    setResetPasswordUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#003B7A] text-white hover:bg-[#002f63]"
                  onClick={handleConfirmResetPassword}
                >
                  Reset Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Total Users
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {totalUsers}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3">
                <Users className="h-5 w-5 text-slate-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Active Users
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {activeUsers}
                </p>
              </div>
              <div className="rounded-2xl bg-green-50 p-3">
                <UserCheck className="h-5 w-5 text-green-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  HR Staff
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {hrCount}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <UserPlus className="h-5 w-5 text-blue-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">
                  Hiring Managers
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {hiringManagerCount}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3">
                <Briefcase className="h-5 w-5 text-amber-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                View and manage all internal system accounts.
              </p>
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {user.fullName}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeClass(
                              user.role,
                            )}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusBadgeClass(
                              user.status,
                            )}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-slate-600">
                          {user.createdAt}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(user)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Account
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleResetPassword(user)
                                }
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(user)
                                }
                              >
                                {user.status === "Active" ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Disable Account
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Activate Account
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-slate-500"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </PageLayout>
  );
}
