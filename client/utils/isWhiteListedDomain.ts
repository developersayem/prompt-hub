const WHITELISTED_IMAGE_DOMAINS = Array.from(
  new Set([
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
    "files.catbox.moe",
    "cdn.sstatic.net",  // StackOverflow images
    "cdn.jsdelivr.net",
    "res.cloudinary.com",
    "cdn-images-1.medium.com",
    "cdn.vox-cdn.com",
    "cdn.thedogapi.com",
    "cdn.dog.ceo",
    "cdn.thecatapi.com",
    "cdn.twitch.tv",
    "cdn.shopifycdn.net",
    "cdn.tumblr.com",
    "cdn.britannica.com",
    "cdn.iconscout.com",
    "cdn.dribbble.com",
    "cdn.behance.net",
    "cdn.webflow.com",
    "cdn.flickr.com",
    "live.staticflickr.com",
    "cdn.whatsapp.net",
    "cdn.linkedin.com",
    "scontent.xx.fbcdn.net", // Facebook content domains
    "cdn.tiny.cloud",
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
    "cdn.vk.com",
    "avatars.githubusercontent.com",
    "user-images.githubusercontent.com",
    "cdn.api.video",
    "cdn.datatables.net",
    "img.youtube.com",
    "i.ytimg.com",
    "i.vimeocdn.com",
    "player.vimeo.com",
    "media.vimeo.com",
    "cdn.cloudflare.com",
    "cdn.tailwindui.com",
    "cdn.filepicker.io",
    "avatars.dicebear.com",
  ])
);



function isWhitelistedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return WHITELISTED_IMAGE_DOMAINS.some((domain) =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch { 
    return false;
  }
}

export default isWhitelistedDomain;