"use client";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { KeyedMutator } from "swr";
import { ISecurityEvent } from "@/app/dashboard/settings/security-and-privacy/page";

interface TwoFactorAuthenticationProps {
  securityEventsMutate: KeyedMutator<ISecurityEvent>;
}
export const TwoFactorAuthentication: FC<TwoFactorAuthenticationProps> = ({
  securityEventsMutate,
}) => {
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<"initial" | "otp">("initial");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(
    user?.isTwoFactorEnabled ?? false
  );
  const [remainingTime, setRemainingTime] = useState(600); // 10 minutes

  // Sync switch state with user data
  useEffect(() => {
    if (typeof user?.isTwoFactorEnabled === "boolean") {
      setIsEnabled(user.isTwoFactorEnabled);
    }
  }, [user?.isTwoFactorEnabled]);

  // ⏱ Countdown for OTP expiration
  useEffect(() => {
    if (step === "otp" && remainingTime > 0) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, remainingTime]);

  // When user toggles switch
  const handleToggleChange = async (checked: boolean) => {
    if (checked) {
      // Enabling 2FA: send code and show OTP input
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/send-2fa`,
          {
            method: "POST",
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success("OTP code sent to your email");

        setStep("otp");
        setRemainingTime(600);
        setOtp("");
        setIsEnabled(false); // keep false until verified
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        toast.error(errorMessage || "Failed to send code");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Disabling 2FA immediately
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/toggle-2fa`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enable: false }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success("Two-Factor Authentication Turned Off");

        setIsEnabled(false);
        updateUser({ isTwoFactorEnabled: false });
        setStep("initial");
        setOtp("");
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        toast.error(errorMessage || "Failed to disable");
      } finally {
        setIsLoading(false);
      }
    }
    // Update security events
    securityEventsMutate();
  };

  //   Verify 2FA code
  const handleVerify = async () => {
    if (otp.length !== 6) return;
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/verify-2fa`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: otp, email: user?.email }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Two-Factor Authentication enabled successfully");

      setIsEnabled(true);
      setStep("initial");
      updateUser({ isTwoFactorEnabled: true });
      setOtp("");
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      toast.error(errorMessage || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Two-Factor Authentication</Label>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
        <Switch
          className={`cursor-pointer`}
          checked={isEnabled}
          disabled={isLoading}
          onCheckedChange={handleToggleChange}
        />
      </div>

      {/* Show loading indicator when processing */}
      {isLoading && step === "initial" && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="animate-spin h-4 w-4" />
          Processing, please wait...
        </p>
      )}

      {/* Show OTP input only when enabling */}
      {step === "otp" && (
        <div className="space-y-4">
          <p className="text-sm text-red-500">
            Code expires in: {Math.floor(remainingTime / 60)}:
            {String(remainingTime % 60).padStart(2, "0")}
          </p>

          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            value={otp}
            onChange={(value) => setOtp(value)}
            className="w-full"
            disabled={isLoading}
          >
            <InputOTPGroup>
              {[...Array(6)].map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button
            className="w-full cursor-pointer"
            onClick={handleVerify}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
