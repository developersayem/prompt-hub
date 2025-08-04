export interface IReportedPost {
  _id: string;
  reason: string;
  additionalDetails: string;
  status: "pending" | "resolved" | "dismissed" | "under-review" | "escalated";
  priority: "low" | "medium" | "high" | "critical";
  actionTaken:
    | "none"
    | "warning-sent"
    | "post-removed"
    | "user-suspended"
    | "user-banned"
    | "post-edited"
    | "false-report";
  reportedAt: string;
  post: {
    _id: string;
    title: string;
    description:string;
    content: string;
    resultContent: string;
    resultType: "text" | "image" | "video";
    createdAt: string;
    slug: string;
    author: {
      _id: string;
      username: string;
      slug: string;
      avatar: string;
    };
  };
  postAuthor: string;
}
