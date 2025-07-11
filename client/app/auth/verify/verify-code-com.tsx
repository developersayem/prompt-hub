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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, AlertCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useAuth } from "@/contexts/auth-context";

export default function VerifyCodeCom() {
  const { manualLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsEmail = searchParams.get("email");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState<string>(searchParamsEmail || "");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingTime, setRemainingTime] = useState(600); // in seconds (10 mins)

  useEffect(() => {
    if (step === "code" && remainingTime > 0) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, remainingTime]);
  useEffect(() => {
    const stepFromUrl = searchParams.get("step");
    if (stepFromUrl === "code") {
      setStep("code");
    }
  }, [searchParams, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email) {
      toast.error("Email is required");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/resend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send code");
      }

      toast.success("Verification code sent to your email");
      setStep("code");
      // Clean URL again after success
      router.replace("/auth/verify");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Something went wrong");
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (code.length !== 6) {
      toast.error("Code must be 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
          credentials: "include", // Include cookies for session management
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Code verification failed");

      await new Promise((res) => setTimeout(res, 500));
      manualLogin(data.data.user);
      await new Promise((res) => setTimeout(res, 500)); // ← additional delay before setting success
      setStep("success");

      toast.success("Verification successful");
      // redirect to feed
      router.replace("/feed");
      // Clean URL after success
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    if (step === "email") {
      return (
        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Enter your email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? "Sending code..." : "Send Verification Code"}
          </Button>
        </form>
      );
    }

    if (step === "code") {
      return (
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
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
        </form>
      );
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Success!</CardTitle>
              <CardDescription>
                Your email has been successfully verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <MailCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                      Email Was Verified
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Now you can use your account.
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/feed">
                <Button className="w-full">Continue to Feed</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              {/* <Sparkles className="h-10 w-10 text-blue-600" /> */}
              <h1 className="text-2xl ml-5 font-bold text-slate-800 dark:text-slate-50 tracking-tight">
                PastPrompt
              </h1>
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === "email" ? "Verify your Email" : "Verify your Code"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Start by entering your email to send a verification code"
                : "Enter the code sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {renderForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
