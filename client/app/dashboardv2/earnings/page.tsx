"use client";

import LoadingCom from "@/components/shared/loading-com";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrompts } from "@/hooks/usePrompts";
import { Download } from "lucide-react";

export default function EarningsPage() {
  const filters = { resultType: "all" };
  const selectedCategory = "all";
  const {
    prompts: myPrompts,
    isLoading,
    error,
    // mutate,
  } = usePrompts(filters, selectedCategory);

  const totalEarnings = myPrompts.reduce(
    (sum, prompt) => sum + prompt.earnings,
    0
  );

  if (isLoading) return <LoadingCom displayText="Loading analytics..." />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-2">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$89.50</div>
            <p className="text-sm text-gray-600 mt-2">+23% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available for Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$67.30</div>
            <Button className="mt-4 w-full">
              <Download className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                date: "2024-01-20",
                prompt: "Logo Design Collection",
                amount: 11.69,
                buyer: "john@example.com",
              },
              {
                date: "2024-01-18",
                prompt: "Logo Design Collection",
                amount: 11.69,
                buyer: "sarah@example.com",
              },
              {
                date: "2024-01-15",
                prompt: "Logo Design Collection",
                amount: 11.69,
                buyer: "mike@example.com",
              },
            ].map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b"
              >
                <div>
                  <p className="font-medium">{transaction.prompt}</p>
                  <p className="text-sm text-gray-600">
                    Purchased by {transaction.buyer}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    +${transaction.amount}
                  </p>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
