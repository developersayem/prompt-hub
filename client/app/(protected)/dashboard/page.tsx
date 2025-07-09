import { Suspense } from "react";
import DashboardTabs from "./dashboard-tabs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Suspense fallback={<div className="p-10">Loading Dashboard...</div>}>
        <DashboardTabs />
      </Suspense>
    </div>
  );
}
