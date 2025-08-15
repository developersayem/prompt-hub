"use client";

import { GetCertifiedCom } from "@/components/dashboard/account/get-certified/get-certified-com";
import DashboardHeader from "@/components/dashboard/shared/dashboard-page-header";

export default function GetCertifiedPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Get Certified"
        description="View and manage your certification details."
      />
      {/* Get Certified Component */}
      <GetCertifiedCom />
    </div>
  );
}
