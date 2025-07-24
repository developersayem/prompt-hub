"use client";
import { useEffect } from "react";

export default function MyPromptsPage() {
  useEffect(() => {
    window.location.href = "/dashboard/prompts/my-prompts";
  }, []);

  return null;
}
