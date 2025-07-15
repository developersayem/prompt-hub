import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  isUserCreated?: boolean;
  creator?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    isUserCreated: { type: Boolean, default: false },
    creator: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
