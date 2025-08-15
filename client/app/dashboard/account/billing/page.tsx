"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Label } from "@/components/ui/label";
import PurchaseCreditsCom from "@/components/dashboard/account/billing/purchase-credits-com";
import DashboardHeader from "@/components/dashboard/shared/dashboard-page-header";

export default function BillingPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Billing Information"
        description="View and manage your billing details."
      />

      {/* Account Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Email Address card */}
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                <Mail className="w-5 h-5" />
                Email Address
              </Label>
              <p className="text-sm">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
        {/* account status card */}
        <Card>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
        {/* account credits card */}
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Total Credits</Label>
              <p className="text-sm">{user?.credits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Credits Component */}
      <PurchaseCreditsCom />
    </div>
  );
}
