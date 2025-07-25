// context/PromptModalContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

interface PromptModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const PromptModalContext = createContext<PromptModalContextType | undefined>(
  undefined
);

export const PromptModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <PromptModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </PromptModalContext.Provider>
  );
};

export const usePromptModal = () => {
  const context = useContext(PromptModalContext);
  if (!context)
    throw new Error("usePromptModal must be used within a PromptModalProvider");
  return context;
};
