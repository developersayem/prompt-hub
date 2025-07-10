"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false); // prevent multiple redirects

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      setTimeout(() => {
        router.replace("/auth/login");
      }, 300); // slight delay allows context to update if needed
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <p className="text-center">Checking authentication...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
