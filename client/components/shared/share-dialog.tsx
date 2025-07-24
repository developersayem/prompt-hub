"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clipboard, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  shareUrl: string;
}

export function ShareDialog({ shareUrl }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      inputRef.current?.focus();
      inputRef.current?.select();
    } catch (error) {
      console.log(error);
      toast.error("Failed to copy");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex-1 flex items-center justify-center min-w-[60px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this link</DialogTitle>
          <DialogDescription>
            Copy and share the link below with anyone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4">
          <Input
            ref={inputRef}
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-grow"
            aria-label="Shareable link"
          />
          <Button onClick={copyToClipboard} aria-label="Copy link to clipboard">
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Clipboard className="w-5 h-5" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
