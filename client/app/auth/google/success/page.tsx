"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function GoogleAuthSuccess() {
  const router = useRouter();
  const { updateUser } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/me`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("User not authenticated");

        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data.data.user));

        // Manually update context
        updateUser(data.data.user);

        // router.replace("/feed");
        window.location.href = "/feed";
      } catch (err) {
        console.error("Google login failed:", err);
        router.replace("/auth/login");
        window.location.href = "/auth/login";
      }
    };

    fetchUser();
  }, [router, updateUser]);

  return <p className="text-center">Logging you in with Google...</p>;
}
