"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import LoadingCom from "@/components/shared/loading-com";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Bell, History, Volume2, Moon, ShieldCheck, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    emailNotifications: false,
    pushNotifications: false,
    marketingEmails: false,
    loginAlerts: true,
    passwordChangeAlerts: true,
    twoFactorAlerts: true,
    inAppSound: true,
    doNotDisturb: false,
    dndStart: "22:00",
    dndEnd: "07:00",
  });

  const [history] = useState([
    { message: "Login from new device", date: "July 19, 2025" },
    { message: "Password changed", date: "July 18, 2025" },
    { message: "2FA enabled", date: "July 17, 2025" },
  ]);

  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        emailNotifications: !!user.isEmailNotificationEnabled,
        pushNotifications: !!user.isPushNotificationEnabled,
        marketingEmails: !!user.isMarketingNotificationEnabled,
      }));
      setLoading(false);
    }
  }, [user]);

  const handleSettingChange = async (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/toggle-notification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ setting: key, value }),
        }
      );
      toast.success(`Updated ${key.replace(/([A-Z])/g, " $1")}`);
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const resetToDefault = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      loginAlerts: true,
      passwordChangeAlerts: true,
      twoFactorAlerts: true,
      inAppSound: true,
      doNotDisturb: false,
      dndStart: "22:00",
      dndEnd: "07:00",
    });
    toast.success("Reset to default preferences");
  };

  if (loading || !user) return <LoadingCom />;

  return (
    <div className="space-y-6">
      {/* Main Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            {
              label: "Email Notifications",
              desc: "Receive important updates via email",
              key: "emailNotifications",
            },
            {
              label: "Push Notifications",
              desc: "Get real-time browser alerts",
              key: "pushNotifications",
            },
            {
              label: "Marketing Emails",
              desc: "Receive promotional content & offers",
              key: "marketingEmails",
            },
          ].map(({ label, desc, key }) => (
            <div key={key} className="flex justify-between items-center">
              <div>
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch
                className="cursor-pointer"
                checked={!!settings[key as keyof typeof settings]}
                onCheckedChange={(v) => handleSettingChange(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Alert Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Security Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            {
              label: "Login Alerts",
              desc: "Notify on login from a new IP or device",
              key: "loginAlerts",
            },
            {
              label: "Password Change Alerts",
              desc: "Notify when your password is changed",
              key: "passwordChangeAlerts",
            },
            {
              label: "2FA Change Alerts",
              desc: "Notify when 2FA is enabled or disabled",
              key: "twoFactorAlerts",
            },
          ].map(({ label, desc, key }) => (
            <div key={key} className="flex justify-between items-center">
              <div>
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch
                className="cursor-pointer"
                checked={!!settings[key as keyof typeof settings]}
                onCheckedChange={(v) => handleSettingChange(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* In-App Sound */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            In-App Notification Sound
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Label>Play sound on notifications</Label>
            <Switch
              className="cursor-pointer"
              checked={settings.inAppSound}
              onCheckedChange={(v) => handleSettingChange("inAppSound", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Do Not Disturb
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Enable DND</Label>
            <Switch
              checked={settings.doNotDisturb}
              onCheckedChange={(v) => handleSettingChange("doNotDisturb", v)}
            />
          </div>
          <div className="flex gap-4 items-center">
            <Label>From</Label>
            <Input
              type="time"
              value={settings.dndStart}
              onChange={(e) => handleSettingChange("dndStart", e.target.value)}
              className="max-w-[120px] cursor-pointer"
            />
            <Label>To</Label>
            <Input
              type="time"
              value={settings.dndEnd}
              onChange={(e) => handleSettingChange("dndEnd", e.target.value)}
              className="max-w-[120px] cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {history.map((h, i) => (
            <div key={i} className="border-b pb-2">
              <p>{h.message}</p>
              <p className="text-xs text-gray-400">{h.date}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary / Reset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="w-5 h-5" />
            Preferences Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You last updated your notification preferences on{" "}
            <span className="font-medium">July 19, 2025</span>
          </p>
          <Button
            onClick={resetToDefault}
            variant="outline"
            className="text-red-600 border-red-500 hover:bg-red-50 cursor-pointer"
          >
            Reset to Default
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
