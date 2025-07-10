"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function GoogleAuthSuccess() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("Auth State →", { isAuthenticated, isLoading });

    if (isLoading) return;
    if (!isLoading && isAuthenticated && pathname === "/auth/google/success") {
      window.location.href = "/feed";
    } else if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <p className="text-center">Logging you in with Google...</p>;
}
