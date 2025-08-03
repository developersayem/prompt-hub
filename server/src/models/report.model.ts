import mongoose, { Schema, Document, Model } from "mongoose";

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate-speech"
  | "violence"
  | "inappropriate"
  | "misinformation"
  | "copyright"
  | "other";

export type ReportStatus =
  | "pending"
  | "under-review"
  | "resolved"
  | "dismissed"
  | "escalated";

export type ReportPriority = "low" | "medium" | "high" | "critical";

export type ReportAction =
  | "none"
  | "warning-sent"
  | "post-removed"
  | "user-suspended"
  | "user-banned"
  | "post-edited"
  | "false-report";

export interface IReport extends Document {
  reportId: string;
  postId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  postAuthor: mongoose.Types.ObjectId;
  reason: ReportReason;
  additionalDetails?: string;
  blockUserRequested?: boolean;
  status: ReportStatus;
  priority: ReportPriority;
  moderator?: mongoose.Types.ObjectId | null;
  moderatorNotes?: string;
  actionTaken?: ReportAction;
  reportedAt?: Date;
  reviewedAt?: Date | null;
  resolvedAt?: Date | null;
  reporterIP?: string;
  reporterUserAgent?: string;
  duplicateOf?: mongoose.Types.ObjectId | null;
  autoModerationFlags?: {
    isAutoFlagged: boolean;
    confidence: number;
    aiReason?: string;
  };

  // Virtuals
  ageInHours?: number;
  isOverdue?: boolean;

  // Instance methods
  markAsReviewed: (moderatorId: mongoose.Types.ObjectId, notes?: string) => Promise<IReport>;
  resolve: (action: ReportAction, notes?: string) => Promise<IReport>;
  dismiss: (notes?: string) => Promise<IReport>;
  escalate: (notes?: string) => Promise<IReport>;
}

const reportSchema = new Schema<IReport>(
  {
    reportId: {
      type: String,
      unique: true,
      required: true,
      default: () =>
        `report_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    },

    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Prompt", required: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    postAuthor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    reason: {
      type: String,
      required: true,
      enum: [
        "spam",
        "harassment",
        "hate-speech",
        "violence",
        "inappropriate",
        "misinformation",
        "copyright",
        "other",
      ],
      index: true,
    },

    additionalDetails: { type: String, maxlength: 1000, trim: true },

    blockUserRequested: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["pending", "under-review", "resolved", "dismissed", "escalated"],
      default: "pending",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    moderator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    moderatorNotes: { type: String, maxlength: 500, trim: true },

    actionTaken: {
      type: String,
      enum: [
        "none",
        "warning-sent",
        "post-removed",
        "user-suspended",
        "user-banned",
        "post-edited",
        "false-report",
      ],
      default: "none",
    },

    reportedAt: { type: Date, default: Date.now, index: true },
    reviewedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    reporterIP: String,
    reporterUserAgent: String,

    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null },

    autoModerationFlags: {
      isAutoFlagged: { type: Boolean, default: false },
      confidence: { type: Number, min: 0, max: 1, default: 0 },
      aiReason: { type: String },
    },
  },
  {
    timestamps: true,
    collection: "reports",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
reportSchema.index({ postId: 1, reportedBy: 1 }, { unique: true });
reportSchema.index({ reason: 1, status: 1 });
reportSchema.index({ postAuthor: 1, status: 1 });

// virtuals
reportSchema.virtual("ageInHours").get(function () {
  return Math.floor((Date.now() - (this.reportedAt?.getTime() ?? 0)) / 3600000);
});

reportSchema.virtual("isOverdue").get(function () {
  return this.status === "pending" && (this.ageInHours ?? 0) > 24;
});

// Static methods
reportSchema.statics.findPendingReports = function () {
  return this.find({ status: "pending" })
    .populate("reportedBy", "name email")
    .populate("postAuthor", "name email")
    .populate("postId", "title createdAt");
};

reportSchema.statics.findReportsByPost = function (postId: string) {
  return this.find({ postId }).populate("reportedBy", "name").sort({ reportedAt: -1 });
};

reportSchema.statics.findReportsByUser = function (userId: string) {
  return this.find({ postAuthor: userId })
    .populate("reportedBy", "name")
    .populate("postId", "title")
    .sort({ reportedAt: -1 });
};

reportSchema.statics.getReportStats = function () {
  return this.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
};

reportSchema.statics.getReportsByReason = function () {
  return this.aggregate([
    { $group: { _id: "$reason", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

// Instance methods
reportSchema.methods.markAsReviewed = function (moderatorId: mongoose.Types.ObjectId, notes = "") {
  this.status = "under-review";
  this.moderator = moderatorId;
  this.moderatorNotes = notes;
  this.reviewedAt = new Date();
  return this.save();
};

reportSchema.methods.resolve = function (action: ReportAction, notes = "") {
  this.status = "resolved";
  this.actionTaken = action;
  this.moderatorNotes = notes;
  this.resolvedAt = new Date();
  return this.save();
};

reportSchema.methods.dismiss = function (notes = "") {
  this.status = "dismissed";
  this.actionTaken = "false-report";
  this.moderatorNotes = notes;
  this.resolvedAt = new Date();
  return this.save();
};

reportSchema.methods.escalate = function (notes = "") {
  this.status = "escalated";
  this.priority = "critical";
  this.moderatorNotes = notes;
  return this.save();
};

// Auto-priority pre-save logic
reportSchema.pre<IReport>("save", function (next) {
  if (this.isNew) {
    const high = ["violence", "hate-speech", "harassment"];
    const medium = ["inappropriate", "misinformation"];
    if (high.includes(this.reason)) this.priority = "high";
    else if (medium.includes(this.reason)) this.priority = "medium";
    else this.priority = "low";
  }
  next();
});

// Post-save notification hook
reportSchema.post<IReport>("save", function (doc) {
  if (doc.isNew) {
    console.log(`[🔔] New report submitted: ${doc.reportId}`);
    // Optionally trigger email/moderator alert here
  }
});

export const Report = mongoose.model<IReport>("Report", reportSchema);
