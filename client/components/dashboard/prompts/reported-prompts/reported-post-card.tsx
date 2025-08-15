"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Calendar,
  MessageSquare,
  //   ExternalLink,
  Eye,
} from "lucide-react";
import { IReportedPost } from "@/types/reported-post.types";
import { Separator } from "@/components/ui/separator";
import { getEmbeddableVideoUrl } from "@/helper/getEmbeddableVideoUrl";
import isValidUrl from "@/helper/check-url";
import isWhitelistedDomain from "@/helper/isWhiteListedDomain";
import Image from "next/image";
import { useState } from "react";

interface ReportedPostCardProps {
  reportedPost: IReportedPost;
  onViewDetails: (post: IReportedPost) => void;
}

export function ReportedPostCard({
  reportedPost,
  onViewDetails,
}: ReportedPostCardProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});

  // Function for toggle description text
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  const getActionColor = (action: string) => {
    switch (action) {
      case "none":
        return "bg-neutral-100 text-neutral-800";
      case "warning-sent":
        return "bg-yellow-100 text-yellow-800";
      case "post-removed":
        return "bg-red-100 text-red-800";
      case "user-suspended":
        return "bg-red-100 text-red-800";
      case "user-banned":
        return "bg-red-100 text-red-800";
      case "post-edited":
        return "bg-blue-100 text-blue-800";
      case "false-report":
        return "bg-green-100 text-green-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700">
      <CardHeader className="">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage
                src={reportedPost.post.author.avatar || "/placeholder.svg"}
                alt={reportedPost.post.author.username}
              />
              <AvatarFallback className="uppercase">
                {reportedPost.post.author.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 dark:text-neutral-100 capitalize">
                {reportedPost.post.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Calendar className="h-4 w-4" />
                <span>Posted {formatDate(reportedPost.post.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 capitalize">
            <Badge className={getStatusColor(reportedPost.status)}>
              {reportedPost.status.replace("-", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 -pt-0">
        {/* Post Description Preview */}
        <div>
          <div className="text-neutral-400 text-sm whitespace-pre-wrap capitalize break-words w-full overflow-hidden">
            <span className="mr-1">Description:</span>
            {expandedDescriptions[reportedPost.post._id]
              ? reportedPost.post?.description ?? ""
              : (reportedPost.post?.description ?? "").length > 150
              ? `${(reportedPost.post?.description ?? "").slice(0, 150)}...`
              : reportedPost.post?.description ?? ""}
            {reportedPost.post?.description &&
              reportedPost.post.description.length > 150 && (
                <button
                  onClick={() => toggleDescription(reportedPost.post?._id)}
                  className="text-white hover:underline ml-1 text-sm cursor-pointer"
                >
                  {expandedDescriptions[reportedPost.post?._id]
                    ? "See less"
                    : "See more"}
                </button>
              )}
          </div>
        </div>
        {/* Post Content Preview */}
        <div
          className={`${
            reportedPost.post.resultType === "text"
              ? "bg-neutral-50 dark:bg-neutral-700"
              : ""
          } p-3 rounded-lg`}
        >
          {reportedPost.post.resultType === "image" ? (
            isValidUrl(reportedPost.post.resultContent) ? (
              isWhitelistedDomain(reportedPost.post.resultContent) ? (
                <Image
                  width={700}
                  height={300}
                  src={reportedPost.post.resultContent}
                  alt={reportedPost.post.title || "Reported image"}
                  className="mx-auto rounded-lg object-contain max-h-[500px]"
                />
              ) : (
                // fallback for non-whitelisted domains
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reportedPost.post.resultContent}
                  alt={reportedPost.post.title || "Reported image"}
                  className="mx-auto rounded-lg object-contain max-h-[500px]"
                  loading="lazy"
                  decoding="async"
                />
              )
            ) : (
              <p className="text-center text-sm text-gray-500">
                Invalid image URL
              </p>
            )
          ) : reportedPost.post.resultType === "video" ? (
            (() => {
              const embed = getEmbeddableVideoUrl(
                isValidUrl(reportedPost.post.resultContent)
                  ? reportedPost.post.resultContent
                  : ""
              );

              if (!embed) {
                return (
                  <p className="text-center text-sm text-gray-500">
                    Unsupported or private media URL
                  </p>
                );
              }

              return embed.type === "video" ? (
                <video
                  controls
                  className="w-full rounded-xl bg-black"
                  src={reportedPost.post.resultContent}
                />
              ) : (
                <iframe
                  src={embed.url}
                  className="w-full h-[315px] rounded-xl"
                  allowFullScreen
                  title={reportedPost.post.title}
                />
              );
            })()
          ) : (
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap line-clamp-3">
              {reportedPost.post.resultContent}
            </p>
          )}
        </div>

        <Separator />

        {/* Report Details */}
        <div className="space-y-3 capitalize">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">
              Reported for: {formatReason(reportedPost.reason)}
            </span>
          </div>

          {reportedPost.additionalDetails && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border-l-4 border-orange-200 dark:border-orange-700">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Additional Details:
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {reportedPost.additionalDetails}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
            <span>Reported on {formatDate(reportedPost.reportedAt)}</span>
            {reportedPost.actionTaken !== "none" && (
              <Badge className={getActionColor(reportedPost.actionTaken)}>
                Action: {formatActionTaken(reportedPost.actionTaken)}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(reportedPost)}
            className="flex-1"
          >
            <Eye />
            View Details
          </Button>
          {/* <Button variant="outline" size="sm" asChild>
            <a
              href={`/posts/${reportedPost.post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink   />
              View Post
            </a>
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
}
