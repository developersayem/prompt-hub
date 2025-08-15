import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPackage extends Document {
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  features: string[];
}

const PackageSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    price: { type: Number, required: true },
    popular: { type: Boolean, default: false },
    features: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Packages", PackageSchema);
