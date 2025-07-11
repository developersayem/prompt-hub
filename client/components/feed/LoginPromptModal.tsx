"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPromptModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl p-6 shadow-xl">
        <DialogHeader className="items-center text-center space-y-2">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-fit mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-semibold">
            Login Required
          </DialogTitle>
          <p className="text-sm text-gray-500">
            You need to log in or create an account to perform this action.
          </p>
        </DialogHeader>

        <div className="flex justify-center mt-6">
          <Button
            className="w-full"
            onClick={() => {
              onClose(); // close the modal
              router.push("/auth/login");
            }}
          >
            Login or Sign Up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
