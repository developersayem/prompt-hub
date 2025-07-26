import { IPrompt, Prompt } from "../models/prompts.model";
import { IUser, User } from "../models/users.model";
import mongoose from "mongoose";


export const cleanInvalidPromptReferences = async (
  userId: mongoose.Types.ObjectId | string
) => {
  const user:IUser | null = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // All IDs to validate
  const promptFields: Array<keyof typeof user> = [
    "bookmarks",
    "purchasedPrompts",
    "prompts",
  ];

  let hasChanges = false;

  for (const field of promptFields) {
    const promptIds = user[field] as mongoose.Types.ObjectId[];
    if (!promptIds || promptIds.length === 0) continue;

    // Fetch valid prompts for the field
    const validPrompts = await Prompt.find({ _id: { $in: promptIds } }).select("_id") as mongoose.Document<IPrompt>[];
    const validIds = new Set(validPrompts.map((p) => p._id.toString()));

    // Filter out invalid ones
    const filteredIds = promptIds.filter((id) => validIds.has(id.toString()));

    if (filteredIds.length !== promptIds.length) {
     (user[field] as mongoose.Types.ObjectId[]) = filteredIds;
      hasChanges = true;
    }
  }

  if (hasChanges) await user.save();
};
