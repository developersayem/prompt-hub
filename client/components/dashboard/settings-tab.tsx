"use client";

import { TabsContent } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  AlertTriangle,
  Bell,
  Download,
  Globe,
  Mail,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

import { ChangePasswordComponent } from "./components/settings/password-change";

const SettingsTab = ({ value }: { value: string }) => {
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    profileVisibility: "public",
    twoFactorAuth: false,
    dataSharing: false,
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = () => {
    console.log("Saving settings:", settings);
  };

  const handleExportData = () => {
    console.log("Exporting user data...");
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion requested...");
  };

  return (
    <TabsContent value={value} className="space-y-6">
      <div className="">
        <Card className="w-full ">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user?.email} disabled />
                  </div>
                  <div className="space-y-4">
                    <Label>Account Status</Label>
                    <div className="flex gap-2 mt-2">
                      <Badge
                        variant={
                          user?.isGoogleAuthenticated ? "default" : "secondary"
                        }
                      >
                        {user?.isGoogleAuthenticated
                          ? "Google Connected"
                          : "Email Only"}
                      </Badge>
                      <Badge
                        variant={user?.isCertified ? "default" : "outline"}
                      >
                        {user?.isCertified ? "Certified" : "Not Certified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      handleSettingChange("twoFactorAuth", checked)
                    }
                  />
                </div>

                <Separator />

                {/* Password Change Flow */}
                <ChangePasswordComponent />
                {/* Manage Connected Devices button */}
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Manage Connected Devices
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("pushNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-600">
                      Receive promotional content and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) =>
                      handleSettingChange("marketingEmails", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Data & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Data Sharing</Label>
                    <p className="text-sm text-gray-600">
                      Allow anonymous usage data collection
                    </p>
                  </div>
                  <Switch
                    checked={settings.dataSharing}
                    onCheckedChange={(checked) =>
                      handleSettingChange("dataSharing", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportData}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export My Data
                  </Button>
                  <p className="text-xs text-gray-600">
                    Download a copy of all your data
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveSettings} className="flex-1">
                Save Settings
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default SettingsTab;
