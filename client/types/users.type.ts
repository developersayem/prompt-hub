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
  slug:string
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
  loginAlerts?: boolean;
  passwordChangeAlerts?: boolean;
  twoFactorAlerts?: boolean;
  inAppSound?: boolean;
  doNotDisturb?: boolean;
  dndStart?: string; // "HH:mm"
  dndEnd?: string;   // "HH:mm"
  prompt: [];
  purchasedPrompts: string[];
  bookmarks: string[];
  refreshToken: string;
  createdAt: string;
  updatedAt: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  countryCode: string;
  isTwoFactorEnabled: boolean;
  twoFactorCode: string;
  twoFactorCodeExpires: Date | null;
}
