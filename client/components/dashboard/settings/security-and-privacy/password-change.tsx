"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, EyeOff, Key } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function ChangePasswordComponent() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"initial" | "password" | "otp" | "success">(
    "initial"
  );
  const [otp, setOtp] = useState("");
  const [remainingTime, setRemainingTime] = useState(600); // 10 minutes

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Individual visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (step === "otp" && remainingTime > 0) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, remainingTime]);

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        router.push("/auth/login");
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    const { currentPassword, newPassword, confirmPassword } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            action: "password-change",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setRemainingTime(600); // Reset countdown
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (error) {
      toast.error((error as Error).message || "Failed to send OTP");
    }
  };

  const handleVerifyAndChangePassword = async () => {
    const { currentPassword, newPassword } = form;

    try {
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user?.email, code: otp }),
        }
      );

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Invalid OTP");
      }

      const changeRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: user?.email,
            oldPassword: currentPassword,
            newPassword,
          }),
        }
      );

      const changeData = await changeRes.json();
      if (!changeRes.ok)
        throw new Error(changeData.message || "Failed to change password");

      toast.success("Password changed successfully");
      setStep("success");
    } catch (error) {
      toast.error((error as Error).message || "Failed to update password");
    }
  };

  return (
    <div className="space-y-3">
      {step === "initial" && (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setStep("password")}
        >
          <Key className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      )}

      {step === "password" && (
        <div className="space-y-3">
          {/* Current Password */}
          <div className="relative">
            <Input
              name="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              value={form.currentPassword}
              onChange={handleChange}
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-muted-foreground"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* New Password */}
          <div className="relative">
            <Input
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={form.newPassword}
              onChange={handleChange}
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-muted-foreground"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-muted-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
          </div>

          <Button onClick={handleSendOtp}>Send Code</Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-3">
          <p className="text-sm text-red-500">
            Code expires in: {Math.floor(remainingTime / 60)}:
            {String(remainingTime % 60).padStart(2, "0")}
          </p>
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            onChange={(value) => setOtp(value)}
            className="w-full"
          >
            <InputOTPGroup>
              {[...Array(6)].map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <Button
            onClick={handleVerifyAndChangePassword}
            disabled={otp.length !== 6}
          >
            Verify & Change Password
          </Button>
        </div>
      )}

      {step === "success" && (
        <Card className="bg-green-100 border-green-400">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span>Password changed successfully!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600">
              Your password has been updated and verified via OTP.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
