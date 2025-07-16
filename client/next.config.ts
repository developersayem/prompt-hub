import type { NextConfig } from "next";

export const WHITELISTED_IMAGE_DOMAINS = [
  "images.unsplash.com",
  "i.imgur.com",
  "imgur.com",
  "cdn.pixabay.com",
  "cdn.shopify.com",
  "pbs.twimg.com",
  "media.giphy.com",
  "media.tenor.com",
  "cdn.discordapp.com",
  "cdn.cloudflare.steamstatic.com",
  "cdn.fbsbx.com",
  "lh3.googleusercontent.com",
  "drive.google.com",
  "media.discordapp.net",
  "cdn.sstatic.net",         // StackOverflow
  "cdn.jsdelivr.net",
  "res.cloudinary.com",
  "cdn-images-1.medium.com",
  "cdn.vox-cdn.com",
  "cdn.twitch.tv",
  "cdn.shopifycdn.net",
  "cdn.tumblr.com",
  "cdn.britannica.com",
  "cdn.dribbble.com",
  "cdn.behance.net",
  "cdn.webflow.com",
  "cdn.flickr.com",
  "live.staticflickr.com",
  "cdn.linkedin.com",
  "scontent.xx.fbcdn.net",   // Facebook
  "upload.wikimedia.org",
  "static01.nyt.com",
  "i.redd.it",
  "i.redditmedia.com",
  "preview.redd.it",
  "external-preview.redd.it",
  "static.wixstatic.com",
  "cdn.sanity.io",
  "media.istockphoto.com",
  "media.gettyimages.com",
  "cdn.freepik.com",
  "avatars.githubusercontent.com",
  "user-images.githubusercontent.com",
  "cdn.datatables.net",
  "img.youtube.com",
  "cdn.cloudflare.com",
  "cdn.tailwindui.com",
  "cdn.filepicker.io",
];


// Generate remotePatterns from whitelist
const remotePatterns = WHITELISTED_IMAGE_DOMAINS.map((domain) => new URL(`https://${domain}/**`));

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
