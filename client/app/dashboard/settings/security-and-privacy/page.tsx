"use client";

import { ChangePasswordComponent } from "@/components/dashboard/settings/security-and-privacy/password-change";
import { TwoFactorAuthentication } from "@/components/dashboard/settings/security-and-privacy/two-factor-authentication";
import DashboardHeader from "@/components/dashboard/shared/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Key, Shield, Smartphone, AlertTriangle } from "lucide-react";

export default function SecurityAndPrivacyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Security & Privacy"
        description="Manage your account security and privacy settings."
        icon={<Shield className="w-5 h-5" />}
      />
      {/* Security Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Security Alerts
          </CardTitle>
          <Badge variant="outline" className="ml-auto text-red-500">
            Coming soon
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm space-y-2">
            <li>
              <strong>Password changed</strong> on July 18, 2025
            </li>
            <li>
              <strong>2FA Enabled</strong> on July 15, 2025
            </li>
            <li>
              <strong>Login from new device</strong> (MacBook Pro · IP:
              103.123.45.68) on July 14, 2025
            </li>
          </ul>
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
          <TwoFactorAuthentication />
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
          <Badge variant="outline" className="ml-auto text-red-500">
            Coming soon
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-sm space-y-2">
            <li>
              Changed on: July 18, 2025
              <Badge className="ml-2 bg-green-100 text-green-800">Recent</Badge>
            </li>
            <li>Changed on: April 12, 2025</li>
            <li>Changed on: December 2, 2024</li>
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
          <Badge variant="outline" className="ml-auto text-red-500">
            Coming soon
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "iPhone 15 Pro",
              os: "iOS 17",
              browser: "Safari",
              lastActive: "5 minutes ago",
              location: "Dhaka, Bangladesh",
              ip: "103.123.45.67",
              isCurrent: true,
            },
            {
              name: "MacBook Pro M3",
              os: "macOS 14",
              browser: "Chrome",
              lastActive: "1 hour ago",
              location: "Dhaka, Bangladesh",
              ip: "103.123.45.68",
              isCurrent: false,
            },
            {
              name: "Windows PC",
              os: "Windows 11",
              browser: "Edge",
              lastActive: "Yesterday",
              location: "Chittagong, Bangladesh",
              ip: "103.123.45.69",
              isCurrent: false,
            },
          ].map((device, idx) => (
            <div
              key={idx}
              className="border rounded-xl p-4 shadow-sm bg-white dark:bg-neutral-950 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-base">{device.name}</h4>
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
                  Last active: {device.lastActive}
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
                  onClick={() => alert(`Logging out device: ${device.name}`)}
                >
                  Log out
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
