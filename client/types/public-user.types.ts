export interface IPublicUser {
  _id: string;
  name: string;
  title:string;
  avatar: string;
  email: string;
  phone?: string;
  bio?: string;
  isCertified: boolean;
  joinedAt: string;

  location?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  socialLinks?: {
    facebook?: string;
    instagram?: string;
    github?: string;
    linkedIn?: string;
    x?: string;
    portfolio?: string;
  };

  // Extracted for convenience
  promptCount: number;
  totalLikes?: number;
  totalViews?: number;

  // Full stats object
  promptStats?: {
    totalPrompts: number;
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    totalShares: number;
  };

}
