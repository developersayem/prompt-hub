"use client";
import { useEffect } from "react";

export default function GoogleAuthSuccess() {
  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      // fetch user if needed and store
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data.data.user));
          window.location.href = "/feed";
        });
    } else {
      window.location.href = "/auth/login";
    }
  }, []);

  return <p>Logging you in with Google...</p>;
}
