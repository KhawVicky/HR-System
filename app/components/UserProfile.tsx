import { useState } from "react";
import { useNavigate } from "react-router";
import { PageLayout } from "./PageLayout";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Upload,
  Camera,
  Save,
  Shield,
  Bell,
  Lock,
  Pencil,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export function UserProfile() {
  const navigate = useNavigate();

  // Get user from localStorage
  const userEmail =
    localStorage.getItem("hr_user") || "hr@company.com";

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: "Joseph Tan",
    email: userEmail,
    phone: "+60 12-345 6789",
    department: "Human Resources",
    jobTitle: "Senior HR Manager",
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    candidateInterviewEnabled: true,
    candidateInterviewSubject:
      "Interview invitation for {jobTitle}",
    candidateInterviewMessage:
      "Dear {candidateName},\n\nWe would like to invite you for an interview for the {jobTitle} position on {interviewDate}.\n\nPlease complete the attached file and reply to this email before attending the interview.\n\nRegards,\n{companyName}",
    candidateInterviewAttachmentName: "",

    candidateRejectedEnabled: true,
    candidateRejectedSubject: "Update on your job application",
    candidateRejectedMessage:
      "Dear {candidateName},\n\nThank you for your interest in {jobTitle}. After careful review, we regret to inform you that you have not been selected for this role.\n\nWe appreciate your time and interest in {companyName}.\n\nRegards,\n{companyName}",

    pushNewApplicant: true,
    pushInterviewReminder: true,
  });
  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<
    string | null
  >(null);

  const handleProfileUpdate = () => {
    toast.success("Profile updated successfully!", {
      description: "Your changes have been saved.",
    });
  };

  const handlePasswordChange = () => {
    if (
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      toast.error("Passwords don't match!", {
        description:
          "Please make sure your new passwords match.",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password too short!", {
        description:
          "Password must be at least 8 characters long.",
      });
      return;
    }

    toast.success("Password changed successfully!", {
      description: "Your password has been updated.",
    });
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleAvatarUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        toast.success("Avatar uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationUpdate = () => {
    toast.success("Notification settings updated!", {
      description: "Your preferences have been saved.",
    });
  };

  const handleInterviewAttachmentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Attachment size must be less than 10MB");
      return;
    }

    setNotifications({
      ...notifications,
      candidateInterviewAttachmentName: file.name,
    });

    toast.success(
      "Interview attachment uploaded successfully!",
    );
  };

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);
  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "User Profile" },
      ]}
      title="User Profile"
      subtitle="Manage your account settings and preferences"
      useCard={false}
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}

        <TabsContent value="profile" className="space-y-6">
          <Card className="border border-slate-200 shadow-md rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">
                Employee Profile Settings
              </CardTitle>
              <CardDescription className="text-base">
                Review and update your profile details, contact
                information, and professional role.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Top summary */}
              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {profileData.fullName.charAt(0)}
                      </span>
                    )}
                  </div>

                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-slate-600" />
                  </label>

                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-semibold text-slate-900 truncate">
                      {profileData.fullName}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        setIsEditingProfile((prev) => !prev)
                      }
                      className="inline-flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-base text-slate-600 mb-1">
                    {profileData.department} ·{" "}
                    {profileData.jobTitle}
                  </p>

                  <p className="text-base text-slate-500 mb-4 break-all">
                    {profileData.email}
                  </p>

                  <label htmlFor="avatar-upload">
                    <Button
                      variant="outline"
                      className="h-10 px-5"
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Photo
                      </span>
                    </Button>
                  </label>

                  <p className="text-sm text-slate-500 mt-3">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>

              {/* Editable form */}
              {isEditingProfile && (
                <>
                  <div className="border-t border-slate-200 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              fullName: e.target.value,
                            })
                          }
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">
                          Department
                        </Label>
                        <Select
                          value={profileData.department}
                          onValueChange={(value) =>
                            setProfileData({
                              ...profileData,
                              department: value,
                            })
                          }
                        >
                          <SelectTrigger
                            id="department"
                            className="h-12"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Human Resources">
                              Human Resources
                            </SelectItem>
                            <SelectItem value="Engineering">
                              Engineering
                            </SelectItem>
                            <SelectItem value="Product">
                              Product
                            </SelectItem>
                            <SelectItem value="Marketing">
                              Marketing
                            </SelectItem>
                            <SelectItem value="Sales">
                              Sales
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+60 12-345 6789"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">
                          Job Title
                        </Label>
                        <Input
                          id="jobTitle"
                          value={profileData.jobTitle}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              jobTitle: e.target.value,
                            })
                          }
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-6 h-11"
                      onClick={() => {
                        handleProfileUpdate();
                        setIsEditingProfile(false);
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-slate-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
                  onClick={handlePasswordChange}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium">
                    Chrome on Windows
                  </p>
                  <p className="text-sm text-slate-500">
                    Kuala Lumpur, Malaysia • Current session
                  </p>
                </div>
                <Badge className="bg-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium">
                    Safari on MacBook
                  </p>
                  <p className="text-sm text-slate-500">
                    Kuala Lumpur, Malaysia • Last active 2 days
                    ago
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent
          value="notifications"
          className="space-y-6"
        >
          {/* Interview Email Template */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Interview Email Template</CardTitle>
              <CardDescription>
                Configure the email sent when HR invites a
                candidate for an interview
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="candidate-interview-enabled">
                    Enable Interview Email
                  </Label>
                  <p className="text-sm text-slate-500">
                    Send this email when a candidate is invited
                    for an interview
                  </p>
                </div>

                <Switch
                  id="candidate-interview-enabled"
                  checked={
                    notifications.candidateInterviewEnabled
                  }
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      candidateInterviewEnabled: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-interview-subject">
                  Subject
                </Label>
                <Input
                  id="candidate-interview-subject"
                  value={
                    notifications.candidateInterviewSubject
                  }
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      candidateInterviewSubject: e.target.value,
                    })
                  }
                  placeholder="Interview invitation for {jobTitle}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-interview-message">
                  Message
                </Label>
                <Textarea
                  id="candidate-interview-message"
                  rows={7}
                  value={
                    notifications.candidateInterviewMessage
                  }
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      candidateInterviewMessage: e.target.value,
                    })
                  }
                  placeholder="Dear {candidateName}, please complete the attached file and reply to this email before the interview on {interviewDate}."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-interview-attachment">
                  Attachment for Candidate
                </Label>

                <div className="flex items-center gap-3">
                  <input
                    id="candidate-interview-attachment"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleInterviewAttachmentUpload}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() =>
                      document
                        .getElementById(
                          "candidate-interview-attachment",
                        )
                        ?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>

                  {notifications.candidateInterviewAttachmentName ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="w-4 h-4 text-[#003B7A]" />
                      <span>
                        {
                          notifications.candidateInterviewAttachmentName
                        }
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No file uploaded
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  This file will be attached to the interview
                  email. The candidate can complete it and reply
                  to the email before the interview.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Available placeholders: {"{candidateName}"},{" "}
                {"{jobTitle}"}, {"{companyName}"},{" "}
                {"{interviewDate}"}
              </p>
            </CardContent>
          </Card>

          {/* Rejected Email Template */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Rejected Email Template</CardTitle>
              <CardDescription>
                Configure the email sent when a candidate is not
                selected
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="candidate-rejected-enabled">
                    Enable Rejected Email
                  </Label>
                  <p className="text-sm text-slate-500">
                    Send this email when a candidate is not
                    selected
                  </p>
                </div>

                <Switch
                  id="candidate-rejected-enabled"
                  checked={
                    notifications.candidateRejectedEnabled
                  }
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      candidateRejectedEnabled: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-rejected-subject">
                  Subject
                </Label>
                <Input
                  id="candidate-rejected-subject"
                  value={notifications.candidateRejectedSubject}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      candidateRejectedSubject: e.target.value,
                    })
                  }
                  placeholder="Update on your job application"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-rejected-message">
                  Message
                </Label>
                <Textarea
                  id="candidate-rejected-message"
                  rows={6}
                  value={notifications.candidateRejectedMessage}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      candidateRejectedMessage: e.target.value,
                    })
                  }
                  placeholder="Dear {candidateName}, thank you for your interest in {jobTitle}."
                />
              </div>

              <p className="text-xs text-slate-500">
                Available placeholders: {"{candidateName}"},{" "}
                {"{jobTitle}"}, {"{companyName}"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Manage browser notifications for internal
                updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-new-applicant">
                    New Applicant
                  </Label>
                  <p className="text-sm text-slate-500">
                    Get notified instantly when someone applies
                  </p>
                </div>
                <Switch
                  id="push-new-applicant"
                  checked={notifications.pushNewApplicant}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      pushNewApplicant: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-interview">
                    Interview Reminders
                  </Label>
                  <p className="text-sm text-slate-500">
                    Get push notifications for interview
                    reminders
                  </p>
                </div>
                <Switch
                  id="push-interview"
                  checked={notifications.pushInterviewReminder}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      pushInterviewReminder: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm px-5"
              onClick={handleNotificationUpdate}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}