"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function GoogleAuthSuccess() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname === "/auth/google/success") {
      router.replace("/feed");
    } else if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <p className="text-center">Logging you in with Google...</p>;
}
