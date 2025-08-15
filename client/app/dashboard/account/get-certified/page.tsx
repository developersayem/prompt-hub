"use client";

import { GetCertifiedCom } from "@/components/dashboard/account/get-certified/get-certified-com";
import DashboardHeader from "@/components/dashboard/shared/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress-com";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

interface ProfileCompletion {
  completionPercentage: number;
  suggestions: Array<{
    field: string;
    displayName: string;
    impact: string;
  }>;
}

export default function GetCertifiedPage() {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] =
    useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileCompletion = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/completion`,
          {
            credentials: "include",
          }
        );

        console.log(response);
        if (response.ok) {
          const data = await response.json();
          setProfileCompletion(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile completion:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileCompletion();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Get Certified"
        description="View and manage your certification details."
      />

      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Profile Completion</span>
              <span>
                {loading
                  ? "Loading..."
                  : `${profileCompletion?.completionPercentage || 0}%`}
              </span>
            </div>
            <Progress value={profileCompletion?.completionPercentage || 0} />

            {/* Suggestions for improvement */}
            {profileCompletion?.suggestions &&
              profileCompletion.suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Complete these to improve your profile:
                  </p>
                  <div className="space-y-1">
                    {profileCompletion.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-xs text-gray-500"
                      >
                        <span>{suggestion.displayName}</span>
                        <span className="text-green-600">
                          {suggestion.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Get Certified Component */}
      <GetCertifiedCom />
    </div>
  );
}
