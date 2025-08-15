"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  Users,
  Award,
  BookOpen,
  CheckCircle,
} from "lucide-react";

export function GetCertifiedCom() {
  const [selectedCertification, setSelectedCertification] = useState<
    string | null
  >(null);

  const certifications = [
    {
      id: "basic",
      name: "Basic Certification",
      description: "Perfect for beginners to get started",
      duration: "2-3 hours",
      questions: 50,
      passingScore: 70,
      price: 29.99,
      features: [
        "50 Multiple Choice Questions",
        "2 Attempts Included",
        "Digital Certificate",
        "Basic Support",
      ],
    },
    {
      id: "advanced",
      name: "Advanced Certification",
      description: "For experienced professionals",
      duration: "4-5 hours",
      questions: 100,
      passingScore: 80,
      price: 59.99,
      popular: true,
      features: [
        "100 Mixed Questions",
        "3 Attempts Included",
        "Premium Digital Certificate",
        "Priority Support",
        "LinkedIn Badge",
      ],
    },
    {
      id: "expert",
      name: "Expert Certification",
      description: "Master level certification",
      duration: "6-8 hours",
      questions: 150,
      passingScore: 85,
      price: 99.99,
      features: [
        "150 Comprehensive Questions",
        "Unlimited Attempts",
        "Premium Certificate with Verification",
        "24/7 Support",
        "LinkedIn Badge",
        "Industry Recognition",
      ],
    },
  ];

  const requirements = [
    "Complete profile setup",
    "Minimum 500 credits in account",
    "Active account for 30+ days",
    "Complete practice tests",
  ];

  const handleStartCertification = () => {
    if (selectedCertification) {
      console.log("Starting certification:", selectedCertification);
    }
  };

  return (
    <Card className="w-full  overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Get Certified
          </CardTitle>
          <CardDescription>
            Validate your skills with our professional certifications
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Requirements Check */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{req}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certification Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <Card
              key={cert.id}
              className={`cursor-pointer transition-all ${
                selectedCertification === cert.id
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:shadow-md"
              } ${cert.popular ? "border-blue-500" : ""}`}
              onClick={() => setSelectedCertification(cert.id)}
            >
              <CardHeader>
                {cert.popular && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle className="text-lg">{cert.name}</CardTitle>
                <CardDescription>{cert.description}</CardDescription>
                <div className="text-2xl font-bold text-blue-600">
                  ${cert.price}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {cert.duration}
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {cert.questions} Questions
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {cert.passingScore}% Pass
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Professional
                  </div>
                </div>

                <div className="space-y-2">
                  {cert.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                </div>

                {selectedCertification === cert.id && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Selected
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCertification && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Ready to Start?</h3>
                <p className="text-sm text-gray-600">
                  {
                    certifications.find((c) => c.id === selectedCertification)
                      ?.name
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  $
                  {
                    certifications.find((c) => c.id === selectedCertification)
                      ?.price
                  }
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartCertification}
              className="w-full"
              size="lg"
            >
              <Shield className="w-4 h-4 mr-2" />
              Start Certification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
