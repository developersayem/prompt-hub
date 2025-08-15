// Helper function to determine trust level
const getTrustLevel = (loginCount: number, createdAt: Date): string => {
  const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (loginCount >= 10 && daysSinceCreated >= 7) {
    return 'high';
  } else if (loginCount >= 3 && daysSinceCreated >= 1) {
    return 'medium';
  }
  return 'low';
};

export {
    getTrustLevel
}