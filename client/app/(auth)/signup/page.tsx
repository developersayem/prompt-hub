"use client";

import type React from "react";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep(2); // Move to verification step
      console.log("Signup:", formData);
    }, 1000);
  };

  const handleSocialSignup = (provider: string) => {
    setIsLoading(true);
    console.log(`Signup with ${provider}`);
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-slate-900/50 transition-all duration-200">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Check your email
            </CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent a verification link to <br />
              <span className="font-medium text-slate-900 dark:text-white">
                {formData.email}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click the link in the email to verify your account and start
                creating amazing AI prompts.
              </p>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => (window.location.href = "mailto:")}
                >
                  Open Email App
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Back to Sign Up
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Didn&apos;t receive the email? Check your spam folder or
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                resend verification email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md relative">
        <Card className="border-0 shadow-2xl dark:shadow-slate-900/50 transition-all duration-200">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <Sparkles className="h-10 w-10 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Prompt Hub
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Create your account
            </CardTitle>
            <CardDescription className="text-base">
              Join 50,000+ creators and start monetizing your AI prompts
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 h-11"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-11"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10 h-11"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>

                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Password strength</span>
                      <span
                        className={`font-medium ${
                          passwordStrength < 50
                            ? "text-red-500"
                            : passwordStrength < 75
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {passwordStrength < 50
                          ? "Weak"
                          : passwordStrength < 75
                          ? "Good"
                          : "Strong"}
                      </span>
                    </div>
                    <Progress
                      value={passwordStrength}
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        agreeToTerms: checked as boolean,
                      })
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to the
                    <Link
                      href="/terms"
                      className="text-blue-600 p-0.5 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Terms of Service
                    </Link>
                    and
                    <Link
                      href="/privacy"
                      className="text-blue-600 p-0.5 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        agreeToMarketing: checked as boolean,
                      })
                    }
                    className="mt-1"
                  />
                  <Label
                    htmlFor="marketing"
                    className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                  >
                    I&apos;d like to receive updates about new features and
                    creator tips (optional)
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium text-white transition-colors duration-200"
                disabled={!formData.agreeToTerms || isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#181818]  px-2 text-slate-500 transition-colors duration-200">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="h-11"
                onClick={() => handleSocialSignup("google")}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Login with Google
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Already have an account?
              </span>
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
