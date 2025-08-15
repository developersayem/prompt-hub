"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, MessageSquare } from "lucide-react";
import { IReportedPost } from "@/types/reported-post.types";
import { ReportedPostCard } from "@/components/dashboard/prompts/reported-prompts/reported-post-card";
import { ReportDetailsModal } from "@/components/dashboard/prompts/reported-prompts/report-details-modal";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

export default function MyReportedPosts() {
  const [filteredPosts, setFilteredPosts] = useState<IReportedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<IReportedPost | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    reason: "",
    search: "",
  });

  const { data, isLoading } = useSWR<IReportedPost[]>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/reported-prompts`,
    fetcher
  );

  const reportedPosts = useMemo(() => data || [], [data]);

  useEffect(() => {
    let filtered = reportedPosts;

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((post) => post.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter((post) => post.priority === filters.priority);
    }

    if (filters.reason && filters.reason !== "all") {
      filtered = filtered.filter((post) => post.reason === filters.reason);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.post?.title?.toLowerCase().includes(searchLower) ||
          post.post?.resultContent?.toLowerCase().includes(searchLower) ||
          post.reason?.toLowerCase().includes(searchLower) ||
          post.additionalDetails?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPosts(filtered);
  }, [reportedPosts, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (post: IReportedPost) => {
    setSelectedPost(post);
    setIsDetailsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your reported posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  placeholder="Search posts, reasons, or details..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-[140px] border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => handleFilterChange("priority", value)}
              >
                <SelectTrigger className="w-[120px] border">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.reason}
                onValueChange={(value) => handleFilterChange("reason", value)}
              >
                <SelectTrigger className="w-[140px] border">
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="hate-speech">Hate Speech</SelectItem>
                  <SelectItem value="violence">Violence</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              No reported posts found
            </h3>
            <p className="text-neutral-500 text-center">
              {reportedPosts.length === 0
                ? "You don't have any reported posts yet."
                : "No posts match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPosts.map((reportedPost) => (
            <ReportedPostCard
              key={reportedPost._id}
              reportedPost={reportedPost}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      <ReportDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        reportedPost={selectedPost}
      />
    </div>
  );
}
