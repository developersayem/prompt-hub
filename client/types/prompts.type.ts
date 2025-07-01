import { IComment } from "./comments.type";

export interface IPrompt {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  promptText: string;
  resultType: "text" | "image" | "video";
  resultContent: string;
  aiModel: string;
  price: number;
  isPaid: boolean;
  creator: {
    _id: string;
    name: string;
    email: string;
    isGoogleAuthenticated: boolean;
    isCertified: boolean;
    avatar: string;
    bio: string;
    credits: number;
    prompts: string[];
    purchasedPrompts: string[];
    bookmarks: string[];
    socialLinks: {
      facebook: string;
      instagram: string;
      github: string;
      linkedIn: string;
      x: string;
      portfolio: string;
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  likes: string[];
  views: number;
  comments: IComment[];
  buyers: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}