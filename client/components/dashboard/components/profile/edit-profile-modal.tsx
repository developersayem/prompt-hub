"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { IUser } from "@/types/users.type";
import { useAuth } from "@/contexts/auth-context";

interface EditProfileModalProps {
  user: IUser;
  onClose: () => void;
}

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const { updateUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio,
    socialLinks: { ...user.socialLinks },
    phone: user.phone || "",
    countryCode: user.countryCode || "+880",
    address: {
      street: user.address?.street || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      postalCode: user.address?.postalCode || "",
      country: user.address?.country || "",
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("bio", formData.bio ?? "");
      data.append("phone", formData.phone);
      data.append("countryCode", formData.countryCode);

      // Append address fields
      Object.entries(formData.address).forEach(([key, value]) => {
        data.append(`address[${key}]`, value);
      });

      // Append social links
      Object.entries(formData.socialLinks).forEach(([key, value]) => {
        data.append(`socialLinks[${key}]`, value);
      });

      // Append avatar file
      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile`,
        {
          method: "PUT",
          credentials: "include",
          body: data,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      const result = await response.json();
      const updatedUser = result.data;
      updateUser(updatedUser);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Picture */}
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={
                  avatarFile
                    ? URL.createObjectURL(avatarFile)
                    : user.avatar || "/placeholder.svg"
                }
                alt={user.name}
              />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div>
              <Label
                htmlFor="avatar"
                className="cursor-pointer flex items-center gap-2 text-sm font-medium btn border rounded px-4 py-2"
              >
                <Upload className="w-4 h-4" />
                Change Photo
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAvatarFile(file);
                }}
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </div>

          {/* Phone with Country Code */}
          <div className="w-full flex gap-2 ">
            <div className="space-y-2">
              <Label htmlFor="countryCode">Country Code</Label>
              <Select
                value={formData.countryCode}
                onValueChange={(value) =>
                  handleInputChange("countryCode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+880">🇧🇩 +880</SelectItem>
                  <SelectItem value="+91">🇮🇳 +91</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                  <SelectItem value="+44">🇬🇧 +44</SelectItem>
                  <SelectItem value="+61">🇦🇺 +61</SelectItem>
                  {/* Add more as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2 w-full">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 1700000000"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Address</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Street"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value },
                  }))
                }
              />
              <Input
                placeholder="City"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))
                }
              />
              <Input
                placeholder="State"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value },
                  }))
                }
              />
              <Input
                placeholder="Postal Code"
                value={formData.address.postalCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, postalCode: e.target.value },
                  }))
                }
              />
              <Input
                placeholder="Country"
                value={formData.address.country}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, country: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.socialLinks).map(([platform, url]) => (
                <div key={platform} className="space-y-2">
                  <Label htmlFor={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Label>
                  <Input
                    id={platform}
                    value={url as string}
                    onChange={(e) =>
                      handleSocialLinkChange(platform, e.target.value)
                    }
                    placeholder={`Your ${platform} URL`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
