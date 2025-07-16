export function getEmbeddableVideoUrl(originalUrl: string): {
  type: "iframe" | "video";
  url: string;
} | null {
  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname.replace("www.", "");

    // 1. YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      const videoId =
        url.searchParams.get("v") ||
        url.pathname.split("/").pop() ||
        url.searchParams.get("vi");

      if (videoId) {
        return {
          type: "iframe",
          url: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    // 2. Vimeo
    if (hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).pop();
      if (videoId) {
        return {
          type: "iframe",
          url: `https://player.vimeo.com/video/${videoId}`,
        };
      }
    }

    // 3. Google Drive
    if (hostname.includes("drive.google.com")) {
      const fileIdMatch = originalUrl.match(/\/file\/d\/(.*?)\//);
      const fileId = fileIdMatch?.[1];
      if (fileId) {
        return {
          type: "iframe",
          url: `https://drive.google.com/file/d/${fileId}/preview`,
        };
      }
    }

    // 4. Facebook
    if (hostname.includes("facebook.com")) {
      return {
        type: "iframe",
        url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          originalUrl
        )}`,
      };
    }

    // 5. Twitch
    if (hostname.includes("twitch.tv")) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const videoIndex = pathParts.indexOf("videos");
      if (videoIndex !== -1) {
        const videoId = pathParts[videoIndex + 1];
        return {
          type: "iframe",
          url: `https://player.twitch.tv/?video=${videoId}&parent=yourdomain.com`,
        };
      }
    }

    // 6. Dailymotion
    if (hostname.includes("dailymotion.com")) {
      const videoId = url.pathname.split("/video/")[1]?.split("_")[0];
      if (videoId) {
        return {
          type: "iframe",
          url: `https://www.dailymotion.com/embed/video/${videoId}`,
        };
      }
    }

    // 7. Direct video file (e.g.,mov, .mp4, .webm, .ogg)
   if (originalUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return {
        type: "video",
        url: originalUrl,
      };
    }

    return null;
  } catch {
    return null;
  }
}
