"use client";
import { useEffect } from "react";

export default function SettingsPage() {
  useEffect(() => {
    window.location.href = "/dashboard/settings/account";
  }, []);

  return null;
}
