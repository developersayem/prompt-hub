export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  github?: string;
  linkedIn?: string;
  x?: string;
  portfolio?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  socialLinks?: ISocialLinks;
  credits: number;
  isGoogleAuthenticated?: boolean;
  isCertified?: boolean;
  prompt: [];
  purchasedPrompts: [];
  bookmarks: [];
  refreshToken: string;
  createdAt: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  countryCode: string;
  updatedAt: string;
}