import { WHITELISTED_IMAGE_DOMAINS } from "@/next.config";

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