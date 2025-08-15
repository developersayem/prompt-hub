"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";

interface CreditsDialogProps {
  open: boolean;
  onClose: () => void;
  currentCredits: number;
  requiredCredits: number;
}

export default function InsufficientCreditsDialog({
  open,
  onClose,
  currentCredits,
  requiredCredits,
}: CreditsDialogProps) {
  const router = useRouter();
  if (currentCredits < 0 || requiredCredits < 0) {
    console.error("Invalid credits values");
    return null;
  }

  const redirectToPurchase = () => {
    router.push("/dashboard/account/billing");
    onClose();
  };

  return (
    <Dialog key="credits-dialog" open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md dark:bg-neutral-900 bg-neutral-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1 text-red-500">
            <CircleAlert className="w-5 h-5" />{" "}
            <span>Insufficient Credits</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            You have <strong>{currentCredits}</strong> credits but this prompt
            requires <strong>{requiredCredits}</strong> credits.
          </p>
          <p className="mt-2 text-gray-500 text-sm">
            Please purchase more credits to continue using this prompt.
          </p>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={redirectToPurchase}>Purchase Credits</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
