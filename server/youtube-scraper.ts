import { ScrapedProfile } from './social-media-scrapers';

/**
 * YouTube Scraper using YouTube Data API v3
 * 
 * Requires the following environment variable:
 * - YOUTUBE_API_KEY: Google API key with YouTube Data API v3 enabled
 * 
 * To get this credential:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project (or select existing)
 * 3. Enable "YouTube Data API v3" in APIs & Services
 * 4. Create an API key in Credentials
 * 5. Copy the API key
 */

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
}

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
    };
  };
}

interface YouTubeVideoStats {
  id: string;
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function scrapeYouTube(username: string): Promise<ScrapedProfile> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'YouTube API key not configured. Please add YOUTUBE_API_KEY in Settings > Secrets.'
    );
  }

  try {
    // Search for the channel by username/handle
    let channelId: string | null = null;
    let channelData: YouTubeChannel | null = null;

    // Try searching by custom URL / handle first
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${apiKey}`
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json() as { items: Array<{ id: { channelId: string } }> };
      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].id.channelId;
      }
    }

    // Try by forUsername if search didn't work
    if (!channelId) {
      const channelByNameResponse = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&forUsername=${encodeURIComponent(username)}&key=${apiKey}`
      );
      if (channelByNameResponse.ok) {
        const data = await channelByNameResponse.json() as { items: YouTubeChannel[] };
        if (data.items && data.items.length > 0) {
          channelData = data.items[0];
          channelId = channelData.id;
        }
      }
    }

    if (!channelId) {
      throw new Error(`YouTube channel not found for: ${username}`);
    }

    // Fetch full channel details if not already fetched
    if (!channelData) {
      const channelResponse = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
      );
      if (!channelResponse.ok) {
        throw new Error(`YouTube channel fetch failed: ${channelResponse.status}`);
      }
      const data = await channelResponse.json() as { items: YouTubeChannel[] };
      if (!data.items || data.items.length === 0) {
        throw new Error(`YouTube channel not found for ID: ${channelId}`);
      }
      channelData = data.items[0];
    }

    // Fetch recent videos
    const videosResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`
    );

    let posts: Array<{
      id: string;
      content: string;
      timestamp: string;
      likes?: number;
      comments?: number;
      url?: string;
    }> = [];

    if (videosResponse.ok) {
      const videosData = await videosResponse.json() as { items: YouTubeVideo[] };
      const videoIds = videosData.items.map(v => v.id.videoId).join(',');

      // Fetch video statistics
      let videoStats: Record<string, YouTubeVideoStats> = {};
      if (videoIds) {
        const statsResponse = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoIds}&key=${apiKey}`
        );
        if (statsResponse.ok) {
          const statsData = await statsResponse.json() as { items: YouTubeVideoStats[] };
          videoStats = Object.fromEntries(statsData.items.map(v => [v.id, v]));
        }
      }

      posts = videosData.items.map(video => {
        const stats = videoStats[video.id.videoId];
        return {
          id: video.id.videoId,
          content: video.snippet.title + (video.snippet.description ? `\n${video.snippet.description.slice(0, 150)}` : ''),
          timestamp: video.snippet.publishedAt,
          likes: stats ? parseInt(stats.statistics.likeCount || '0') : undefined,
          comments: stats ? parseInt(stats.statistics.commentCount || '0') : undefined,
          url: `https://youtube.com/watch?v=${video.id.videoId}`,
        };
      });
    }

    const subscriberCount = parseInt(channelData.statistics.subscriberCount || '0');
    const videoCount = parseInt(channelData.statistics.videoCount || '0');
    const viewCount = parseInt(channelData.statistics.viewCount || '0');

    return {
      platform: 'youtube',
      username,
      profileUrl: channelData.snippet.customUrl
        ? `https://youtube.com/${channelData.snippet.customUrl}`
        : `https://youtube.com/channel/${channelId}`,
      profileData: {
        bio: channelData.snippet.description || '',
        followers: subscriberCount,
        profilePic: channelData.snippet.thumbnails.high?.url || channelData.snippet.thumbnails.default?.url,
        joinDate: channelData.snippet.publishedAt,
      },
      posts,
      engagementMetrics: {
        totalEngagement: viewCount,
        avgLikes: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length) : 0,
        avgComments: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length) : 0,
      },
    };
  } catch (error: any) {
    console.error(`YouTube scraper error for ${username}:`, error);
    throw error;
  }
}
