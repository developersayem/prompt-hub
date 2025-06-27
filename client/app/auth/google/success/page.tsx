"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function GoogleSuccessPage() {
  console.log("auth/google/success/page.tsx");
  const { updateUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
          {
            method: "GET",
            credentials: "include", // so cookies (tokens) are sent
          }
        );

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();

        // save user in localStorage
        localStorage.setItem("user", JSON.stringify(data.data.user));

        // update AuthContext
        updateUser(data.data.user);
        console.log("userData:", data.data.user);

        // redirect to dashboard
        router.push("/profile");
      } catch (err) {
        console.error("Google login fetch error", err);
        router.push("/login?error=google_fetch_failed");
      }
    }

    fetchUser();
  }, [router, updateUser]);

  return <p className="text-center py-10">Signing you in with Google...</p>;
}
