"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthorId: string;
  postAuthorName?: string; // Optional display name
}
function ReportModal({
  isOpen,
  onOpenChange,
  postId,
  postAuthorId,
  postAuthorName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  // const [blockUser, setBlockUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    {
      id: "spam",
      label: "Spam",
      description: "Repetitive or irrelevant content",
    },
    {
      id: "harassment",
      label: "Harassment or Bullying",
      description: "Content that targets or intimidates someone",
    },
    {
      id: "hate-speech",
      label: "Hate Speech",
      description: "Content that promotes hatred against individuals or groups",
    },
    {
      id: "violence",
      label: "Violence or Dangerous Content",
      description: "Content that promotes or depicts violence",
    },
    {
      id: "inappropriate",
      label: "Inappropriate Content",
      description: "Sexual, graphic, or disturbing content",
    },
    {
      id: "misinformation",
      label: "False Information",
      description: "Content that spreads false or misleading information",
    },
    {
      id: "copyright",
      label: "Intellectual Property Violation",
      description: "Unauthorized use of copyrighted material",
    },
    {
      id: "other",
      label: "Other",
      description: "Something else that violates community guidelines",
    },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);

    try {
      // Make API call to submit report
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // If needed:
            // Authorization: `Bearer ${yourToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            postId,
            postAuthorId,
            reason: selectedReason,
            details: additionalDetails.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Error submitting report:",
          data.message || res.statusText
        );
        toast.error(data.message || "Failed to submit report.");
        return;
      }
      toast.success("Report submitted successfully");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedReason("");
    setAdditionalDetails("");
    // setBlockUser(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report Post
          </DialogTitle>
          <DialogDescription>
            Help us understand what&apos;s happening with this post by{" "}
            <strong className="font-semibold capitalize">
              {postAuthorName || postAuthorId}
            </strong>
            . Your report is anonymous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reason Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Why are you reporting this post?
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
            >
              <div className="space-y-3">
                {reportReasons.map((reason) => (
                  <div key={reason.id} className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={reason.id}
                      id={reason.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={reason.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {reason.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div>
            <Label htmlFor="details" className="text-sm font-medium mb-2 block">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional context..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
          </div>

          {/* TODO : feature plan  Block User Option  */}
          {/* <div className="flex items-center space-x-2">
            <Checkbox
              id="block-user"
              checked={blockUser}
              onCheckedChange={(checked) => setBlockUser(!!checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="block-user" className="text-sm cursor-pointer">
              Also block {postAuthorName || postAuthorId} so you won&apos;t see
              their posts
            </Label>
          </div> */}

          {selectedReason === "other" && additionalDetails.trim() === "" && (
            <p className="text-xs text-red-500 mt-1">
              Please provide more details for this report.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedReason ||
                isSubmitting ||
                (selectedReason === "other" && additionalDetails.trim() === "")
              }
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportModal;
