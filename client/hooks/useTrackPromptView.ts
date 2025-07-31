"use client";

import { useCallback, useState } from "react";

interface UseTrackPromptViewReturn {
  trackView: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export const useTrackPromptView = (promptId: string): UseTrackPromptViewReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const trackView = useCallback(async () => {
    if (!promptId) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/view/${promptId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to track view");

      setSuccess(true);
    } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message || "Unknown error");
  } else {
    setError("Unknown error");
  }
} finally {
      setIsLoading(false);
    }
  }, [promptId]);

  return { trackView, isLoading, error, success };
};
