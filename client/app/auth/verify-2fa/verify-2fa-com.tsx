"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

function Verify2FACom() {
  const { updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsEmail = searchParams.get("email");
  const [email, setEmail] = useState<string>(searchParamsEmail || "");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(600); // in seconds (10 mins)

  useEffect(() => {
    if (remainingTime > 0) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [remainingTime]);

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl === "email") {
      // Remove query params after navigating to "code" step
      setEmail(emailFromUrl);
      router.replace("/auth/verify-2fa");
    }
  }, [searchParams, router]);

  //   useEffect(() => {
  //       const timer = setTimeout(() => {
  //         router.push("/auth/login");
  //       }, 3000); // 3 seconds
  //       return () => clearTimeout(timer);
  //   }, [ router]);

  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (code.length !== 6) {
      toast.error("Code must be 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/verify-2fa`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, code }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Code verification failed");
      }

      updateUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(data.data.user)); // ✅ Ensure stored
      toast.success("Code verified successfully");
      // router.push("/feed"); // ✅ Redirect
      window.location.href = "/feed"; // ✅ Redirect to feed page
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Sparkles className="h-10 w-10 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Prompt Hub
              </h1>
            </div>
            <CardTitle className="text-2xl font-bold">
              Verify Your 2FA Code
            </CardTitle>
            <CardDescription>Enter the code sent to your email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleCodeVerify} className="space-y-5">
              <p className="text-sm text-red-500 text-center">
                Code expires in: {Math.floor(remainingTime / 60)}:
                {String(remainingTime % 60).padStart(2, "0")}
              </p>
              <div className="space-y-2 w-full">
                <Label htmlFor="code">Enter the verification code</Label>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  onChange={(value) => setCode(value)}
                  className="w-full"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Verify2FACom;
