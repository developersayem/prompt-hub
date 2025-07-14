import { Prompt } from "../models/prompts.model";
import mongoose, { Document } from "mongoose";
import { IPrompt } from "../models/prompts.model";

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
      : promptIdOrDoc;

  if (!prompt) return;

  let shouldUpdate = false;

  // Since this is public controller: no userId, just check IP views
  if (!userId && ip && !prompt.viewedIPs.includes(ip)) {
    prompt.viewedIPs.push(ip);
    prompt.markModified("viewedIPs"); // Notify Mongoose
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    prompt.views += 1;
    await prompt.save();
  }
};

export { trackPromptView };
