import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotificationHistory extends Document {
  userId: Types.ObjectId;
  message: string;
  date: Date;
}

const notificationHistorySchema = new Schema<INotificationHistory>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
},
{ timestamps: true }
);

// Remove unique index to allow multiple notification history entries
// notificationHistorySchema.index({ userId: 1, date: -1 }); // Optional: for performance

export const NotificationHistory = mongoose.model<INotificationHistory>("NotificationHistory", notificationHistorySchema);
