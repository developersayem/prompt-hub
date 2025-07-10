"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleAuthSuccess() {
  const router = useRouter();

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

        // Optional: manually update AuthContext here if needed

        router.replace("/feed");
      } catch (err) {
        console.error("Google login failed:", err);
        router.replace("/auth/login");
      }
    };

    fetchUser();
  }, [router]);

  return <p className="text-center">Logging you in with Google...</p>;
}
