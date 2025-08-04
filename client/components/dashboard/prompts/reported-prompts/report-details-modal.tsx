"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  AlertTriangle,
  MessageSquare,
  Shield,
  Clock,
} from "lucide-react";
import { IReportedPost } from "@/types/reported-post.types";

interface ReportDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reportedPost: IReportedPost | null;
}

export function ReportDetailsModal({
  isOpen,
  onOpenChange,
  reportedPost,
}: ReportDetailsModalProps) {
  if (!reportedPost) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatReason = (reason: string) => {
    return reason
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatActionTaken = (action: string) => {
    return action
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "under-review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "dismissed":
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
      case "escalated":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-900 border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Details
          </DialogTitle>
          <DialogDescription className="dark:text-neutral-400">
            Detailed information about the report on your post
          </DialogDescription>
        </DialogHeader>

        <Separator />
        <div className="space-y-6">
          {/* Report Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-neutral-100">
              Report Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium dark:text-neutral-300">
                    Reason
                  </span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {formatReason(reportedPost.reason)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge
                  className={`capitalize ${getStatusColor(
                    reportedPost.status
                  )}`}
                >
                  {reportedPost.status.replace("-", " ")}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Priority</span>
                </div>
                <Badge variant="outline" className="text-sm capitalize">
                  {reportedPost.priority} priority
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Reported On</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDate(reportedPost.reportedAt)}
                </p>
              </div>
            </div>

            {reportedPost.additionalDetails && (
              <div className="space-y-2 capitalize">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    Additional Details
                  </span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {reportedPost.additionalDetails}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Taken */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold dark:text-neutral-100">
              Moderation Action
            </h3>
            <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-neutral-300">
                  Action Taken:
                </span>
                <Badge
                  variant={
                    reportedPost.actionTaken === "none"
                      ? "secondary"
                      : "default"
                  }
                  className={
                    reportedPost.actionTaken === "none"
                      ? "bg-neutral-100 text-neutral-800"
                      : reportedPost.actionTaken.includes("removed") ||
                        reportedPost.actionTaken.includes("banned")
                      ? "bg-red-100 text-red-800"
                      : reportedPost.actionTaken === "false-report"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {formatActionTaken(reportedPost.actionTaken)}
                </Badge>
              </div>

              {reportedPost.actionTaken === "none" &&
                reportedPost.status === "pending" && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    This report is still being reviewed by our moderation team.
                  </p>
                )}

              {reportedPost.actionTaken === "false-report" && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  After review, this report was determined to be false. No
                  action was taken against your post.
                </p>
              )}

              {reportedPost.actionTaken === "warning-sent" && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  A warning was sent regarding this post. Please review our
                  community guidelines.
                </p>
              )}

              {reportedPost.actionTaken === "post-removed" && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  This post was removed for violating our community guidelines.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
