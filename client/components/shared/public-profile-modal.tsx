"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { IPublicUser } from "@/types/publicUser.type";
import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: IPublicUser;
  isLoading: boolean;
}

export const PublicProfileModal = ({
  open,
  onOpenChange,
  user,
  isLoading,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center">User Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-muted-foreground">
              Loading profile...
            </span>
          </div>
        ) : (
          <Card className="p-4 w-full">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                {user.bio && (
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                )}
                {user.isCertified && <Badge className="mt-1"> Certified</Badge>}
              </div>

              <Separator className="my-2" />

              <div className="text-sm space-y-1 text-left w-full">
                <p>
                  📍 <strong>Location:</strong> {user.location?.city},{" "}
                  {user.location?.country}
                </p>
                <p>
                  🧠 <strong>Prompts Posted:</strong> {user.promptCount}
                </p>
                <p>
                  🗓️ <strong>Joined:</strong>{" "}
                  {new Date(user.joinedAt).toLocaleDateString()}
                </p>
                {user.phone && (
                  <p>
                    📞 <strong>Phone:</strong> {user.phone}
                  </p>
                )}
                <p>
                  📧 <strong>Email:</strong> {user.email}
                </p>
              </div>

              <Separator className="my-2" />

              <div className="flex flex-wrap justify-center gap-3">
                {user.socialLinks?.facebook && (
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={user.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {user.socialLinks?.instagram && (
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={user.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {user.socialLinks?.github && (
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={user.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {user.socialLinks?.linkedIn && (
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={user.socialLinks.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {user.socialLinks?.x && (
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={user.socialLinks.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="X (Twitter)"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {user.socialLinks?.portfolio && (
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={user.socialLinks.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Portfolio"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
