"use client";

import { TabsContent } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Bell, Loader2, Mail, Shield, Smartphone } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

import { ChangePasswordComponent } from "./components/settings/password-change";
import { TwoFactorAuthentication } from "./components/settings/two-factor-authentication";
import { toast } from "sonner";
const SettingsTab = ({ value }: { value: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    emailNotifications: false,
    pushNotifications: false,
    marketingEmails: false,
  });

  const settingKeyMap: Record<string, string> = {
    emailNotifications: "Email Notification",
    pushNotifications: "Push Notification",
    marketingEmails: "Marketing Notification",
  };

  useEffect(() => {
    if (user) {
      setSettings({
        emailNotifications: !!user.isEmailNotificationEnabled,
        pushNotifications: !!user.isPushNotificationEnabled,
        marketingEmails: !!user.isMarketingNotificationEnabled,
      });
      setLoading(false);
    }
  }, [user]);

  const toggleSetting = async (key: string, value: boolean) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/toggle-notification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            setting: settingKeyMap[key],
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to toggle setting");

      const data = await res.json();

      setSettings((prev) => ({
        ...prev,
        [key]: data.data[settingKeyMap[key]],
      }));

      toast.success(data.message);
    } catch {
      toast.error("Could not update setting");
      setSettings((prev) => ({
        ...prev,
        [key]: !value,
      }));
    }
  };

  const handleSettingChange = (key: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: checked,
    }));
    toggleSetting(key, checked);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-5 w-5" />
      </div>
    );
  }

  return (
    <TabsContent value={value} className="space-y-6">
      <div>
        <Card className="w-full ">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Account Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your account preferences and security
              </p>
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
                    <input
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
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
                <TwoFactorAuthentication />
                <Separator />

                {/* Password Change Flow */}
                <ChangePasswordComponent />
                {/* TODO: Manage Connected Devices button */}
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Manage Connected Devices
                  </div>
                  <Badge variant="outline" className="ml-auto text-red-500">
                    Coming soon
                  </Badge>
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
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default SettingsTab;
