import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IPackage } from "@/types/package.type";
import { fetcher } from "@/utils/fetcher";
import { Check, Coins, CreditCard, Infinity } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const PurchaseCreditsCom = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const {
    data: packages = [],
    // isLoading,
    // mutate,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/credits/packages`,
    fetcher
  );

  const handlePurchase = () => {
    if (selectedPackage) {
      // Here you would integrate with payment processor
      console.log("Processing purchase for package:", selectedPackage);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <Card className="w-full  max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Purchase Credits
            </CardTitle>
            <CardDescription>
              Choose a credit package that fits your needs
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg: IPackage) => (
              <Card
                key={pkg.name}
                className={`cursor-pointer transition-all ${
                  selectedPackage === pkg.name
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:shadow-md"
                } ${pkg.popular ? "border-blue-500" : ""}`}
                onClick={() => setSelectedPackage(pkg.name)}
              >
                <CardHeader className="text-center">
                  {pkg.popular && (
                    <Badge className="w-fit mx-auto mb-2">Most Popular</Badge>
                  )}
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">${pkg.price}</div>
                    <div className="text-sm text-gray-500">
                      {pkg.credits === -1 ? (
                        <div className="flex items-center justify-center gap-1">
                          <Infinity className="w-4 h-4" />
                          <span>Unlimited Credits</span>
                        </div>
                      ) : (
                        `${pkg.credits.toLocaleString()} Credits`
                      )}
                      {pkg.duration && (
                        <div className="text-xs text-orange-600 mt-1">
                          ({pkg.duration} days)
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}

                  {selectedPackage === pkg.name && (
                    <div className="pt-2">
                      <Badge
                        variant="secondary"
                        className="w-full justify-center"
                      >
                        Selected
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPackage && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Payment Summary</h3>
                  <p className="text-sm text-gray-600">
                    {
                      packages.find((p: IPackage) => p.name === selectedPackage)
                        ?.name
                    }{" "}
                    -{" "}
                    {(() => {
                      const pkg = packages.find(
                        (p: IPackage) => p.name === selectedPackage
                      );
                      if (pkg?.credits === -1) {
                        return `Unlimited Credits (${pkg.duration} days)`;
                      }
                      return `${pkg?.credits.toLocaleString()} Credits`;
                    })()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    $
                    {
                      packages.find((p: IPackage) => p.name === selectedPackage)
                        ?.price
                    }
                  </div>
                </div>
              </div>

              <Button onClick={handlePurchase} className="w-full" size="lg">
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseCreditsCom;
