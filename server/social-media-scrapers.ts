/**
 * Social Media Profile Analysis System
 * 
 * Approach: User pastes profile URLs and manually enters data from profiles.
 * Reddit and YouTube use real APIs (require API keys).
 * All other platforms use manual data entry from the user.
 */

export interface ScrapedProfile {
  platform: 'twitter' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'youtube' | 'pinterest' | 'snapchat';
  username: string;
  profileUrl: string;
  profileData: {
    bio?: string;
    followers?: number;
    following?: number;
    profilePic?: string;
    verified?: boolean;
    joinDate?: string;
  };
  posts: Array<{
    id: string;
    content: string;
    timestamp: string;
    likes?: number;
    comments?: number;
    shares?: number;
    url?: string;
  }>;
  stories?: Array<{
    id: string;
    timestamp: string;
    url?: string;
  }>;
  engagementMetrics?: {
    avgLikes?: number;
    avgComments?: number;
    totalEngagement?: number;
  };
}

/**
 * Platforms that require manual data entry (no API access)
 */
export const MANUAL_PLATFORMS = ['twitter', 'instagram', 'tiktok', 'facebook', 'pinterest', 'snapchat'] as const;

/**
 * Platforms that support automatic scraping via API
 */
export const API_PLATFORMS = ['reddit', 'youtube'] as const;

/**
 * Check if a platform supports automatic scraping
 */
export function supportsAutoScrape(platform: string): boolean {
  return (API_PLATFORMS as readonly string[]).includes(platform.toLowerCase());
}

/**
 * Scrape a social media profile using API (only Reddit and YouTube)
 * For all other platforms, use manual data entry via the UI.
 */
export async function scrapeSocialMediaProfile(
  platform: string,
  username: string
): Promise<ScrapedProfile> {
  switch (platform.toLowerCase()) {
    case 'reddit': {
      const { scrapeReddit } = await import('./reddit-scraper');
      return await scrapeReddit(username);
    }
    case 'youtube': {
      const { scrapeYouTube } = await import('./youtube-scraper');
      return await scrapeYouTube(username);
    }
    default:
      throw new Error(
        `Platform "${platform}" does not support automatic scraping. ` +
        `Please use manual data entry or paste profile data from Grok analysis.`
      );
  }
}

/**
 * No cleanup needed (removed Puppeteer)
 */
export async function cleanupScraper(): Promise<void> {
  // No-op: Puppeteer removed
}
