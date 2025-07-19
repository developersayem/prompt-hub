"use client";

import LoginPromptModal from "@/components/feed/LoginPromptModal";
import { createContext, useContext, useState } from "react";

interface LoginPromptContextType {
  triggerLoginModal: () => void;
}

const LoginPromptContext = createContext<LoginPromptContextType | undefined>(
  undefined
);

export const LoginPromptProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  const triggerLoginModal = () => setOpen(true);

  return (
    <LoginPromptContext.Provider value={{ triggerLoginModal }}>
      {children}
      <LoginPromptModal open={open} onClose={() => setOpen(false)} />
    </LoginPromptContext.Provider>
  );
};

export const useLoginPrompt = () => {
  const context = useContext(LoginPromptContext);
  if (!context)
    throw new Error("useLoginPrompt must be used within LoginPromptProvider");
  return context;
};
