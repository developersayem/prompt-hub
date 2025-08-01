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
  trackView?: () => Promise<void>;
}

export function ShareDialogButton({ shareUrl, trackView }: ShareDialogProps) {
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
        <button
          onClick={trackView}
          className="flex-1 flex items-center justify-center min-w-[60px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-neutral-50 dark:bg-neutral-900">
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
          <Button
            onClick={copyToClipboard}
            aria-label="Copy link to clipboard"
            className="cursor-pointer"
          >
            {copied ? <Check className="text-green-500" /> : <Clipboard />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
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
        <div className="flex-1 flex items-center justify-start">Share</div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-neutral-50 dark:bg-neutral-900">
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
          <Button
            onClick={copyToClipboard}
            aria-label="Copy link to clipboard"
            className="cursor-pointer"
          >
            {copied ? <Check className="text-green-500" /> : <Clipboard />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
