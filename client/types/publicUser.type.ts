export interface IPublicUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    github?: string;
    linkedIn?: string;
    x?: string;
    portfolio?: string;
  };
  location?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phone?: string;
  isCertified?: boolean;
  joinedAt: string;
  promptCount: number;
}