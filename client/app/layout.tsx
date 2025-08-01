import type React from "react";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import { LoginPromptProvider } from "@/contexts/login-prompt-context";
import DraftSyncProvider from "@/contexts/draft-sync-provider";
import { PromptModalProvider } from "@/contexts/prompt-modal-context";
import PromptModalRenderer from "@/components/shared/prompt-modal-renderer";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt Hub - AI Prompt Directory",
  description: "Discover, share, and monetize AI prompts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Toaster />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="Prompt Hub-theme"
        >
          <AuthProvider>
            <LoginPromptProvider>
              <PromptModalProvider>
                <PromptModalRenderer />
                <DraftSyncProvider>{children}</DraftSyncProvider>
              </PromptModalProvider>
            </LoginPromptProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
