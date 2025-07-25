"use client";

import { usePromptModal } from "@/contexts/prompt-modal-context";
import CreatePromptModal from "./create-prompt-modal";
import { usePrompts } from "@/hooks/usePrompts";

export default function PromptModalRenderer() {
  const { isOpen, closeModal } = usePromptModal();
  const filters = { resultType: "all" };
  const selectedCategory = "all";

  const { key, mutate } = usePrompts(filters, selectedCategory);

  return (
    <CreatePromptModal
      open={isOpen}
      onClose={closeModal}
      onSuccess={() => mutate(key)} // Properly refetch
    />
  );
}
