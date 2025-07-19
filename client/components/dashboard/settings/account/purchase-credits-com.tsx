import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Coins, CreditCard } from "lucide-react";
import { useState } from "react";

const PurchaseCreditsCom = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const packages = [
    {
      id: "starter",
      name: "Starter Pack",
      credits: 500,
      price: 9.99,
      popular: false,
      features: ["500 Credits", "Basic Support", "30 Days Validity"],
    },
    {
      id: "professional",
      name: "Professional",
      credits: 1500,
      price: 24.99,
      popular: true,
      features: [
        "1,500 Credits",
        "Priority Support",
        "90 Days Validity",
        "Bonus Features",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      credits: 5000,
      price: 79.99,
      popular: false,
      features: [
        "5,000 Credits",
        "24/7 Support",
        "1 Year Validity",
        "All Premium Features",
        "Custom Integration",
      ],
    },
    {
      id: "custom",
      name: "Custom",
      credits: 5000,
      price: 79.99,
      popular: false,
      features: [
        "5,000 Credits",
        "24/7 Support",
        "1 Year Validity",
        "All Premium Features",
        "Custom Integration",
      ],
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:shadow-md"
                } ${pkg.popular ? "border-blue-500" : ""}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <CardHeader className="text-center">
                  {pkg.popular && (
                    <Badge className="w-fit mx-auto mb-2">Most Popular</Badge>
                  )}
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">${pkg.price}</div>
                    <div className="text-sm text-gray-500">
                      {pkg.credits.toLocaleString()} Credits
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

                  {selectedPackage === pkg.id && (
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
                    {packages.find((p) => p.id === selectedPackage)?.name} -{" "}
                    {packages
                      .find((p) => p.id === selectedPackage)
                      ?.credits.toLocaleString()}{" "}
                    Credits
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${packages.find((p) => p.id === selectedPackage)?.price}
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
