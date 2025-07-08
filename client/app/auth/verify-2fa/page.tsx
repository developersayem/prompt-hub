"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Optionally you can create a fallback loader component
const Verify2FACom = dynamic(() => import("./verify-2fa-com"), {
  ssr: false, // Disable SSR to avoid `useSearchParams` issues
});

export default function Verify2FAPage() {
  return (
    <div className="max-h-screen max-w-screen flex items-center justify-center">
      <Suspense fallback={<p>Loading 2FA Verification...</p>}>
        <Verify2FACom />
      </Suspense>
    </div>
  );
}
