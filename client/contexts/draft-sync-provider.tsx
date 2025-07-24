"use client";
import {
  clearPromptDraft,
  clearPromptFile,
  loadPromptDraft,
  loadPromptFile,
} from "@/utils/draftStorage";
import { useEffect } from "react";
import { toast } from "sonner";

const DraftSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const syncDraft = async () => {
      const draft = loadPromptDraft();
      const file = await loadPromptFile();

      if (!draft || !draft.title || !draft.promptText) return;

      try {
        const data = new FormData();
        Object.entries(draft).forEach(([key, value]) => {
          if (key === "tags") {
            data.append("tags", JSON.stringify(value));
          } else {
            data.append(key, value as string);
          }
        });

        if (file) {
          data.append("promptContent", file);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/save-draft`,
          {
            method: "POST",
            body: data,
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Failed to sync draft");

        clearPromptDraft();
        await clearPromptFile();
        toast.success("Prompt draft synced to cloud.");
      } catch (err) {
        console.error("Error syncing draft:", err);
        toast.error("Error syncing draft. Please try again.");
      }
    };

    if (navigator.onLine) {
      syncDraft();
    } else {
      toast.error("You are offline. Please check your internet connection.");
    }

    window.addEventListener("online", syncDraft);
    return () => window.removeEventListener("online", syncDraft);
  }, []);

  return <>{children}</>;
};

export default DraftSyncProvider;
