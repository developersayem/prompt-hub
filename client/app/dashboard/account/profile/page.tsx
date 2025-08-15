"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AvatarUploadModal from "@/components/dashboard/account/profile/avatar-upload-modal";
import { Textarea } from "@/components/ui/textarea";
import CountryCodeSelect from "@/components/shared/CountryCodeSelect";

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  github: Github,
  linkedIn: Linkedin,
  x: Twitter,
  portfolio: Globe,
};

// helper function to make input filed value capitalized
function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

const PublicProfilePage = () => {
  const { updateUser, user } = useAuth();

  // Inside component
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    publicEmail: user?.publicEmail || "",
    title: user?.title || "",
    bio: user?.bio || "",
    socialLinks: {
      facebook: user?.socialLinks?.facebook || "",
      instagram: user?.socialLinks?.instagram || "",
      github: user?.socialLinks?.github || "",
      linkedIn: user?.socialLinks?.linkedIn || "",
      x: user?.socialLinks?.x || "",
      portfolio: user?.socialLinks?.portfolio || "",
      ...user?.socialLinks,
    },
    phone: user?.phone || "",
    countryCode: user?.countryCode || "+880",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      postalCode: user?.address?.postalCode || "",
      country: user?.address?.country || "",
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

      data.append("name", formData.name ?? "");
      data.append("publicEmail", formData.publicEmail ?? "");
      data.append("title", formData.title ?? "");
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
    <div className="container space-y-4">
      {/* Avatar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar
              className="w-30 h-30 border-4 border-white shadow-lg cursor-pointer"
              onClick={() => setAvatarModalOpen(true)}
            >
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            {/* Avatar Upload Modal */}
            <AvatarUploadModal
              open={isAvatarModalOpen}
              onClose={() => setAvatarModalOpen(false)}
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Personal Information</CardTitle>
            </div>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
            >
              Save
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Full Name</Label>
              <Input
                value={toTitleCase(formData.name || "")}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title</Label>
              <Input
                value={toTitleCase(formData.title || "")}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter Professional Title"
                className="placeholder:capitalize"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bio and email and phone number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* bio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Bio</CardTitle>
            </div>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
            >
              Save
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.bio || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bio: e.target.value,
                })
              }
              required
              placeholder="Write a short bio about yourself"
              className="resize-none h-36"
            />
          </CardContent>
        </Card>
        {/* phone number and public email */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>
                Email and Phone {""}
                <span className="text-muted-foreground text-xs">(public)</span>
              </CardTitle>
            </div>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
            >
              Save
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicEmail">Email</Label>
              <Input
                value={formData.publicEmail || ""}
                onChange={(e) =>
                  handleInputChange("publicEmail", e.target.value)
                }
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex space-x-2 w-full">
                <CountryCodeSelect
                  value={formData.countryCode}
                  onChange={(val) => handleInputChange("countryCode", val)}
                />
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address card */}
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Address</CardTitle>
          <Button type="button" className="cursor-pointer" onClick={handleSave}>
            Save
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.address).map(([field, value]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Label>
                <Input
                  id={field}
                  value={toTitleCase(value as string) || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        [field]: e.target.value,
                      },
                    }))
                  }
                  placeholder={`Your ${field} address`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Social Links</CardTitle>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
            >
              Save
            </Button>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Social Links preview */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect with me on social media</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.socialLinks &&
            Object.entries(user.socialLinks).some(
              ([, url]) => url && url.trim() !== ""
            ) ? (
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                {Object.entries(user.socialLinks)
                  .filter(([, url]) => url && url.trim() !== "")
                  .map(([platform, url]) => {
                    const IconComponent =
                      socialIcons[platform as keyof typeof socialIcons];
                    if (!IconComponent) return null;

                    return (
                      <Link
                        key={platform}
                        href={url}
                        target="_blank"
                        className="block w-full"
                      >
                        <Button className="w-full justify-start gap-2">
                          <IconComponent className="w-4 h-4" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </Button>
                      </Link>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">
                No social links added yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicProfilePage;
