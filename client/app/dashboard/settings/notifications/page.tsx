"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Volume2, Moon, ShieldCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingCom from "@/components/shared/loading-com";
import NotificationHistory, {
  NotificationHistoryRef,
} from "@/components/dashboard/settings/security-and-privacy/notifications-histories";

type NotificationSettings = {
  isEmailNotificationEnabled: boolean;
  isPushNotificationEnabled: boolean;
  isMarketingNotificationEnabled: boolean;
  loginAlerts: boolean;
  passwordChangeAlerts: boolean;
  twoFactorAlerts: boolean;
  inAppSound: boolean;
  doNotDisturb: boolean;
  dndStart: string;
  dndEnd: string;
};

const defaultSettings: NotificationSettings = {
  isEmailNotificationEnabled: true,
  isPushNotificationEnabled: true,
  isMarketingNotificationEnabled: false,
  loginAlerts: true,
  passwordChangeAlerts: true,
  twoFactorAlerts: true,
  inAppSound: true,
  doNotDisturb: false,
  dndStart: "22:00",
  dndEnd: "07:00",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const notificationHistoryRef = useRef<NotificationHistoryRef>(null);

  // Fetch backend settings and map to frontend state
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/notification-settings`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const result = await res.json();
        if (res.ok && result.data) {
          const s = result.data;
          setSettings({
            isEmailNotificationEnabled: s.isEmailNotificationEnabled ?? false,
            isPushNotificationEnabled: s.isPushNotificationEnabled ?? false,
            isMarketingNotificationEnabled:
              s.isMarketingNotificationEnabled ?? false,
            loginAlerts: s.loginAlerts ?? true,
            passwordChangeAlerts: s.passwordChangeAlerts ?? true,
            twoFactorAlerts: s.twoFactorAlerts ?? true,
            inAppSound: s.inAppSound ?? true,
            doNotDisturb: s.doNotDisturb ?? false,
            dndStart: s.dndStart || "22:00",
            dndEnd: s.dndEnd || "07:00",
          });
        } else {
          toast.error("Failed to load settings");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching notification settings");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchSettings();
  }, [user]);

  // Function to handle setting changes
  const handleSettingChange = async (
    key: keyof NotificationSettings,
    value: string | boolean
  ) => {
    // Add display labels for more readable toast messages
    const settingLabels: Record<keyof NotificationSettings, string> = {
      isEmailNotificationEnabled: "Email Notifications",
      isPushNotificationEnabled: "Push Notifications",
      isMarketingNotificationEnabled: "Marketing Emails",
      loginAlerts: "Login Alerts",
      passwordChangeAlerts: "Password Change Alerts",
      twoFactorAlerts: "2FA Alerts",
      inAppSound: "In-App Sound",
      doNotDisturb: "Do Not Disturb",
      dndStart: "DND Start Time",
      dndEnd: "DND End Time",
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/toggle-notification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ setting: key, value }),
        }
      );

      if (response.ok) {
        // Only update local state after successful API call
        setSettings((prev) => ({ ...prev, [key]: value }));

        const label = settingLabels[key];
        const isToggle = typeof value === "boolean";
        if (isToggle) {
          toast.success(`${label} turned ${value ? "ON" : "OFF"}`);
        } else {
          toast.success(`${label} updated to ${value}`);
        }

        // Refresh notification history after successful update
        setTimeout(() => {
          notificationHistoryRef.current?.refreshHistory();
        }, 100); // Small delay to ensure backend has processed
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        toast.error("Failed to update setting");
      }
    } catch (error) {
      console.error("Network Error:", error);
      toast.error("Failed to update setting");
    }
  };
  // Function to reset settings
  const resetToDefault = async () => {
    setSettings(defaultSettings);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/reset-notification-settings`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    if (!res.ok) {
      toast.error("Failed to reset settings");
      return;
    }
    toast.success("Settings reset to default");
  };

  if (loading || !user) return <LoadingCom />;

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
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
              key: "isEmailNotificationEnabled",
            },
            {
              label: "Push Notifications",
              desc: "Get real-time browser alerts",
              key: "isPushNotificationEnabled",
            },
            {
              label: "Marketing Emails",
              desc: "Receive promotional content & offers",
              key: "isMarketingNotificationEnabled",
            },
          ].map(({ label, desc, key }) => (
            <div key={key} className="flex justify-between items-center">
              <div>
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch
                className="cursor-pointer"
                checked={!!settings[key as keyof NotificationSettings]}
                onCheckedChange={(v) =>
                  handleSettingChange(key as keyof NotificationSettings, v)
                }
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
                checked={!!settings[key as keyof NotificationSettings]}
                onCheckedChange={(v) =>
                  handleSettingChange(key as keyof NotificationSettings, v)
                }
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

      {/* Preferences Summary */}
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
      {/* Notification History */}
      <NotificationHistory ref={notificationHistoryRef} />
    </div>
  );
}
