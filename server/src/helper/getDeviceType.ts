
// Helper function to determine device type
const getDeviceType = (os: string, browser: string): string => {
  const osLower = os.toLowerCase();
  const browserLower = browser.toLowerCase();

  if (osLower.includes('android') || osLower.includes('ios')) {
    return 'mobile';
  } else if (osLower.includes('windows') || osLower.includes('mac') || osLower.includes('linux')) {
    return 'desktop';
  } else if (browserLower.includes('tablet')) {
    return 'tablet';
  }
  return 'unknown';
};

export {
    getDeviceType
}