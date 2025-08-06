import { IUser } from "../models/users.model";

const PROFILE_COMPLETION_FIELDS = [
  "title",
  "avatar",
  "bio",
  "publicEmail",
  "phone",
  "countryCode",
  "publicPhone",
  "publicCountryCode",
  "socialLinks.facebook",
  "socialLinks.instagram",
  "socialLinks.github",
  "socialLinks.linkedIn",
  "socialLinks.x",
  "socialLinks.portfolio",
  "address.street",
  "address.city",
  "address.state",
  "address.postalCode",
  "address.country",
];


export function calculateProfileCompletion(user: IUser): number {
  let completed = 0;
  const total = PROFILE_COMPLETION_FIELDS.length;

  for (const field of PROFILE_COMPLETION_FIELDS) {
    const keys = field.split(".");
    let value: any = user;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        value = null;
        break;
      }
    }

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      completed++;
    }
  }

  return Math.round((completed / total) * 100); // Return percentage
}
