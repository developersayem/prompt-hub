import { TabsContent } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { EditProfileModal } from "./components/profile/edit-profile-modal";
import {
  Calendar,
  Coins,
  Edit,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Settings,
  Shield,
  Twitter,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Separator } from "../ui/separator";
import { PurchaseCreditsModal } from "./components/profile/purchase-credits-modal";
import { GetCertifiedModal } from "./components/profile/get-certified-modal";

const ProfileTab = ({ value }: { value: string }) => {
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPurchaseCredits, setShowPurchaseCredits] = useState(false);
  const [showGetCertified, setShowGetCertified] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    github: Github,
    linkedIn: Linkedin,
    x: Twitter,
    portfolio: Globe,
  };
  return (
    <TabsContent value={value} className="space-y-6">
      <div className=" bg-neutral-50 dark:bg-neutral-950">
        {/* Main Content */}
        <div className="px-4 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                  <AvatarFallback className="text-lg uppercase">
                    {user?.name
                      ? user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "UA"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-2xl">{user?.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" />
                        {user?.email}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditProfile(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={user?.isCertified ? "default" : "secondary"}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {user?.isCertified ? "Certified" : "Not Certified"}
                    </Badge>
                    <Badge
                      variant={
                        user?.isGoogleAuthenticated ? "default" : "outline"
                      }
                    >
                      {user?.isGoogleAuthenticated
                        ? "Google Connected"
                        : "Google Not Connected"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user?.bio ? (
                    <p className="text-gray-700">{user.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">
                      No bio added yet. Click edit profile to add a bio.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                  <CardDescription>
                    Connect with me on social media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(user?.socialLinks || {}).map(
                      ([platform, url]) => {
                        const IconComponent =
                          socialIcons[platform as keyof typeof socialIcons];
                        const isConnected = url && url.trim() !== "";

                        return (
                          <Button
                            key={platform}
                            variant={isConnected ? "default" : "outline"}
                            className="justify-start"
                            disabled={!isConnected}
                          >
                            <IconComponent className="w-4 h-4 mr-2" />
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  {!user?.socialLinks && (
                    <p className="text-gray-500 text-sm mt-4">
                      No social links added yet. Update your profile to add
                      social media links.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Credits</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {user?.credits.toLocaleString()}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Member Since</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(user?.createdAt || "")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowPurchaseCredits(true)}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Purchase Credits
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowGetCertified(true)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Get Certified
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {showEditProfile && user && (
          <EditProfileModal
            user={user}
            onClose={() => setShowEditProfile(false)}
          />
        )}

        {showPurchaseCredits && (
          <PurchaseCreditsModal onClose={() => setShowPurchaseCredits(false)} />
        )}

        {showGetCertified && (
          <GetCertifiedModal onClose={() => setShowGetCertified(false)} />
        )}
      </div>
    </TabsContent>
  );
};

export default ProfileTab;
