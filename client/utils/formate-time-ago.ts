import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

// Helper function to format time ago
function formatShortTimeAgo(date: Date) {
  const now = new Date();

  const diffMinutes = differenceInMinutes(now, date);
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = differenceInHours(now, date);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = differenceInDays(now, date);
  return `${diffDays}d`;
}

export default formatShortTimeAgo;