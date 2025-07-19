"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Label } from "@/components/ui/label";
import PurchaseCreditsCom from "@/components/dashboard/settings/account/purchase-credits-com";
import { GetCertifiedCom } from "@/components/dashboard/settings/account/get-certified-com";
import DashboardHeader from "@/components/dashboard/shared/dashboard-page-header";

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Account Information"
        description="View and manage your account details."
      />
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div className="space-y-4">
              <Label>Account Status</Label>
              <div className="flex gap-2 mt-2">
                <Badge
                  variant={user?.isGoogleAuthenticated ? "default" : "outline"}
                >
                  {user?.isGoogleAuthenticated
                    ? "Google Connected"
                    : "Email Only"}
                </Badge>
                <Badge variant={user?.isCertified ? "default" : "outline"}>
                  {user?.isCertified ? "Certified" : "Not Certified"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Purchase Credits Component */}
      <PurchaseCreditsCom />
      {/* Get Certified Component */}
      <GetCertifiedCom />
    </div>
  );
}
