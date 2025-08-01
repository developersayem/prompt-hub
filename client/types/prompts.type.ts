import { IComment } from "./comments.type";

export interface ISocialLinks {
  facebook: string;
  instagram: string;
  github: string;
  linkedIn: string;
  x: string;
  portfolio: string;
}

export interface IPromptCreator {
  _id: string;
  slug:string
  name:string;
  avatar: string;
}

export interface IPrompt {
  _id: string;
  title: string;
  description?: string;
  tags: string[];
  category: string;
  promptText: string;
  resultType: "text" | "image" | "video";
  resultContent: string;
  aiModel: string;
  price?: number;
  paymentStatus: "free" | "paid";
  creator: IPromptCreator; // populated User
  likes: string[]; // Like IDs
  views: number;
  viewedBy: string[]; // User IDs
  viewedIPs: string[];
  comments: IComment[]; // populated Comment objects
  purchasedBy: string[];
  slug: string;
  isPublic: boolean;
  shareCount: number;
  sharedBy: {
    users: string[]; // User IDs
    ips: string[];
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}
