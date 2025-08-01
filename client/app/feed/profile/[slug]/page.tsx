"use client";

import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { IPublicUser } from "@/types/public-user.types";
import { IPrompt } from "@/types/prompts.type";
import PromptCard from "@/components/shared/prompt-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  MapPin,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  CalendarCheck2,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/app/constants";
import formatNumber from "@/utils/formatNumber";

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  github: Github,
  linkedIn: Linkedin,
  x: Twitter,
  portfolio: Globe,
};

const PublicProfilePage = () => {
  const { slug } = useParams();
  const searchParams = useSearchParams();

  const category = searchParams.get("category");
  const isPaid = searchParams.get("isPaid");
  const searchString = searchParams.get("searchString");

  const query = new URLSearchParams();
  if (category) query.append("category", category);
  if (isPaid) query.append("isPaid", isPaid);
  if (searchString) query.append("searchString", searchString);

  const { data: user } = useSWR<IPublicUser>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/${slug}`,
    fetcher
  );

  const location = [user?.location?.city, user?.location?.country]
    .filter(Boolean)
    .join(", ");

  const phone = user?.phone && user.phone !== "undefine" ? user.phone : null;

  const { data: prompts, mutate: mutatePrompts } = useSWR<
    IPrompt[] | undefined
  >(
    `${
      process.env.NEXT_PUBLIC_BACKEND_URL
    }/api/v1/prompts/user/${slug}?${query.toString()}`,
    fetcher
  );

  const [filters, setFilters] = useState({
    categories: [] as string[],
    paymentStatus: [] as string[],
    resultType: [] as string[],
  });
  const [sortBy, setSortBy] = useState<"createdAt" | "likes" | "views">(
    "createdAt"
  );

  const filteredPrompts = (prompts || [])
    .filter((prompt: IPrompt) => {
      const query = (searchString || "").toLowerCase();
      const matchSearch =
        prompt.title?.toLowerCase().includes(query) ||
        prompt.description?.toLowerCase().includes(query) ||
        prompt.tags?.some((tag) => tag.toLowerCase().includes(query));

      const matchCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(prompt.category);

      const matchPayment =
        filters.paymentStatus.length === 0 ||
        filters.paymentStatus.includes(prompt.paymentStatus);

      const matchResultType =
        filters.resultType.length === 0 ||
        filters.resultType.includes(prompt.resultType);

      return matchSearch && matchCategory && matchPayment && matchResultType;
    })
    .sort((a: IPrompt, b: IPrompt) => {
      if (sortBy === "createdAt") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "likes") {
        return b.likes.length - a.likes.length;
      }
      if (sortBy === "views") {
        return b.views - a.views;
      }
      return 0;
    });

  console.log("user:", user);

  return (
    <div className="container space-y-4">
      {/* Cover + Avatar + Basic Info */}
      <Card>
        <CardHeader className="flex items-center gap-4">
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-1 capitalize text-foreground">
              {user?.name}
              {user?.isCertified && (
                <ShieldCheck size={16} className="text-yellow-500" />
              )}
            </h2>
            {user?.title && (
              <p className="text-sm text-muted-foreground capitalize">
                {user?.title}
              </p>
            )}
            <Badge variant="default">
              <ShieldCheck />
              <span className="text-xs capitalize text-neutral-950">
                {user?.isCertified
                  ? `Certified by ${APP_NAME}`
                  : "Not Certified"}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bio */}
          <div className="space-y-2">
            {user?.bio && user.bio === "" ? (
              <p className="text-sm text-foreground">{user?.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No bio</p>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Personal info */}
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-foreground">{user?.email}</span>
              </p>
              {phone !== "undefined" &&
                phone !== "" &&
                phone !== "undefinedundefined" && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-foreground">{phone}</span>
                  </p>
                )}
              {location && (
                <p className="flex items-center gap-2 capitalize">
                  <MapPin className="h-4 w-4" />
                  <span className="text-foreground">{location}</span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4" />
                Joined:{" "}
                <strong className="text-foreground">
                  {user?.joinedAt
                    ? new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(user?.joinedAt))
                    : "N/A"}
                </strong>
              </p>
            </div>

            {/* Stats */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Prompts:{" "}
                <strong className="text-foreground">
                  {formatNumber(user?.promptStats?.totalPrompts ?? 0)}
                </strong>
              </p>
              <p>
                Likes:{" "}
                <strong className="text-foreground">
                  {formatNumber(user?.promptStats?.totalLikes ?? 0)}
                </strong>
              </p>
              <p>
                Views:{" "}
                <strong className="text-foreground">
                  {formatNumber(user?.promptStats?.totalViews ?? 0)}
                </strong>
              </p>
              <p>
                Comments:{" "}
                <strong className="text-foreground">
                  {formatNumber(user?.promptStats?.totalComments ?? 0)}
                </strong>
              </p>
              <p>
                Shares:{" "}
                <strong className="text-foreground">
                  {formatNumber(user?.promptStats?.totalShares ?? 0)}
                </strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Connect with me on social media</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.socialLinks &&
          Object.entries(user.socialLinks).some(
            ([, url]) => url && url.trim() !== ""
          ) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            <p className="text-gray-500 text-sm">
              No social links added yet. Update your profile to add social media
              links.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <Card>
        <CardContent className="flex justify-between items-center">
          <h1>Prompts</h1>
          <div className="flex space-x-2">
            {/* Filter Popover */}
            <Popover>
              <PopoverTrigger asChild className="cursor-pointer">
                <Button variant="outline" size="sm">
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-4 ">
                <div className="grid grid-cols-2 gap-4">
                  {/* categories */}
                  <div>
                    <Label className="mb-2">Category</Label>
                    {["ai", "code", "design"].map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          className="cursor-pointer"
                          checked={filters.categories.includes(cat)}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => ({
                              ...prev,
                              categories: checked
                                ? [...prev.categories, cat]
                                : prev.categories.filter((c) => c !== cat),
                            }));
                          }}
                        />
                        <span className="capitalize">{cat}</span>
                      </div>
                    ))}
                  </div>
                  {/* result type */}
                  <div>
                    <Label className="mb-2">Result Type</Label>
                    {["text", "image", "video"].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          className="cursor-pointer"
                          checked={filters.resultType.includes(type)}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => ({
                              ...prev,
                              resultType: checked
                                ? [...prev.resultType, type]
                                : prev.resultType.filter((t) => t !== type),
                            }));
                          }}
                        />
                        <span className="capitalize">{type}</span>
                      </div>
                    ))}
                  </div>
                  {/* payment status */}
                  <div className="col-span-2">
                    <Label className="mb-2">Payment Status</Label>
                    {["paid", "free"].map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          className="cursor-pointer"
                          checked={filters.paymentStatus.includes(status)}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => ({
                              ...prev,
                              paymentStatus: checked
                                ? [...prev.paymentStatus, status]
                                : prev.paymentStatus.filter(
                                    (s) => s !== status
                                  ),
                            }));
                          }}
                        />
                        <span className="capitalize">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="text-red-500 hover:text-red-600 w-full cursor-pointer"
                    onClick={() =>
                      setFilters({
                        categories: [],
                        paymentStatus: [],
                        resultType: [],
                      })
                    }
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  Sort
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2 space-y-2">
                {(["createdAt", "likes", "views"] as const).map((val) => (
                  <Button
                    key={val}
                    variant={sortBy === val ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start cursor-pointer"
                    onClick={() => setSortBy(val)}
                  >
                    {val === "createdAt" && "Newest"}
                    {val === "likes" && "Most Liked"}
                    {val === "views" && "Most Viewed"}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
      {/* Social Links */}

      {/* Prompt List */}
      {Array.isArray(prompts) && prompts.length > 0 ? (
        <div className="space-y-4">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt._id}
              prompt={prompt}
              mutatePrompts={mutatePrompts}
              handleCopyPrompt={() => {}}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-6">
          No prompts found for this user.
        </div>
      )}
    </div>
  );
};

export default PublicProfilePage;
