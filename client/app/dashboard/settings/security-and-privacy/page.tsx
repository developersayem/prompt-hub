"use client";

import { ChangePasswordComponent } from "@/components/dashboard/settings/security-and-privacy/password-change";
import { TwoFactorAuthentication } from "@/components/dashboard/settings/security-and-privacy/two-factor-authentication";
import LoadingCom from "@/components/shared/loading-com";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetcher } from "@/utils/fetcher";
import { Bell, Key, Smartphone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

export interface IConnectedDevice {
  _id: string;
  userId: string;
  ip: string;
  userAgent: string;
  deviceName: string;
  os: string;
  browser: string;
  location: string;
  isCurrent: boolean;
  lastActive: Date;
}

export interface ISecurityEvent {
  message: string;
  date: string;
  type:
    | "NEW_DEVICE_LOGIN"
    | "PASSWORD_CHANGED"
    | "2FA_ENABLED"
    | "2FA_DISABLED"
    | "NEW_DEVICE_LOGIN";
}

export default function SecurityAndPrivacyPage() {
  // get all security events
  const {
    data: securityEvents = [],
    isLoading,
    mutate: securityEventsMutate,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/security-and-privacy/security-events`,
    fetcher
  );
  // get all connected devices
  const {
    data: connectedDevices = [],
    isLoading: isLoadingDevices,
    mutate: devicesMutate,
  } = useSWR<IConnectedDevice[]>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/security-and-privacy/devices`,
    fetcher
  );
  // logout specific device
  const handleLogoutDevice = async (id: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/security-and-privacy/devices/${id}`,
      { method: "GET", credentials: "include" }
    );
    const data = await res.json();
    toast.success(data.message);
    if (res.ok) {
      devicesMutate();
    }
  };
  return (
    <div className="space-y-6">
      {/* Security Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <LoadingCom displayText="Loading security alerts..." />}
          {securityEvents.length ? (
            <ul className="text-sm space-y-2">
              {securityEvents.map((event: ISecurityEvent, i: number) => (
                <li key={i}>
                  <strong>{event.message}</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    on{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(event.date))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recent security events.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Two Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TwoFactorAuthentication
            securityEventsMutate={securityEventsMutate}
          />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChangePasswordComponent />
        </CardContent>
      </Card>
      {/* Password Change History */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password Change History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-sm space-y-2">
            {securityEvents.filter(
              (e: ISecurityEvent) => e.type === "PASSWORD_CHANGED" && e.date
            ).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent password changes.
              </p>
            )}
            {securityEvents
              .filter((e: ISecurityEvent) => e.type === "PASSWORD_CHANGED")
              .map((e: ISecurityEvent, i: number) => (
                <li key={i}>
                  Changed on: {new Date(e.date).toLocaleDateString()}
                  {i === 0 && (
                    <Badge className="ml-2 bg-green-100 text-green-800">
                      Recent
                    </Badge>
                  )}
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Connected Devices
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingDevices ? (
            <LoadingCom displayText="Loading connected devices..." />
          ) : connectedDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No devices connected yet.
            </p>
          ) : (
            connectedDevices.map((device) => (
              <div
                key={device._id}
                className="border rounded-xl p-4 shadow-sm bg-white dark:bg-neutral-950 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base">
                      {device.deviceName || "Unknown Device"}
                    </h4>
                    {device.isCurrent && (
                      <Badge
                        className="bg-green-100 text-green-800"
                        variant="default"
                      >
                        This Device
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {device.location}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last active: {new Date(device.lastActive).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">IP: {device.ip}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 py-0.5 text-xs"
                  >
                    {device.os}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 py-0.5 text-xs"
                  >
                    {device.browser}
                  </Badge>
                </div>
                {!device.isCurrent && (
                  <button
                    className="mt-3 text-sm text-red-500 hover:underline self-start cursor-pointer"
                    onClick={() => handleLogoutDevice(device._id)}
                  >
                    Log out
                  </button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
