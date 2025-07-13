// utils/trackPromptView.ts
import mongoose, { Document } from "mongoose";
import { Prompt } from "../models/prompts.model";
import { IPrompt } from "../models/prompts.model"; // adjust if IPrompt is exported separately

type PromptDoc = Document<unknown, any, IPrompt> & IPrompt;

interface TrackPromptViewOptions {
  promptIdOrDoc: string | PromptDoc;
  userId?: mongoose.Types.ObjectId;
  ip?: string;
}

const trackPromptView = async ({
  promptIdOrDoc,
  userId,
  ip,
}: TrackPromptViewOptions): Promise<void> => {
  const prompt: PromptDoc | null =
    typeof promptIdOrDoc === "string"
      ? await Prompt.findById(promptIdOrDoc)
      : (promptIdOrDoc as PromptDoc);

  if (!prompt) return;

  let shouldUpdate = false;

  // ✅ Check unique user view
  if (userId && !prompt.viewedBy.some((id) => id.equals(userId))) {
    prompt.viewedBy.push(userId);
    shouldUpdate = true;
  }

  // ✅ Check unique IP view
  if (!userId && ip && !prompt.viewedIPs.includes(ip)) {
    prompt.viewedIPs.push(ip);
    prompt.markModified("viewedIPs"); // Tell Mongoose the array changed
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    prompt.views += 1;
    await prompt.save();
  }
};

export {
  trackPromptView
}