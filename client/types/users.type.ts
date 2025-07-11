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
  isVerified: boolean;
  verificationCodeExpires: Date | null;
  lastVerificationSentAt: Date | null;
  isEmailNotificationEnabled: boolean;
  isPushNotificationEnabled: boolean;
  isMarketingNotificationEnabled: boolean;
  prompt: [];
  purchasedPrompts: string[];
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
  isTwoFactorEnabled: boolean;
  twoFactorCode: string;
  twoFactorCodeExpires: Date | null;

}