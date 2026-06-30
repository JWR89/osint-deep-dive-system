import { ScrapedProfile } from './social-media-scrapers';

/**
 * Reddit Scraper using snoowrap (Node.js Reddit API wrapper)
 * 
 * Requires the following environment variables:
 * - REDDIT_CLIENT_ID: Reddit app client ID
 * - REDDIT_CLIENT_SECRET: Reddit app client secret
 * - REDDIT_USER_AGENT: User agent string for API requests
 * 
 * To get these credentials:
 * 1. Go to https://www.reddit.com/prefs/apps
 * 2. Click "create another app..."
 * 3. Select "script" type
 * 4. Fill in name and redirect URI (http://localhost)
 * 5. Copy the client ID (under the app name) and secret
 */

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  numComments: number;
  createdUtc: number;
  url: string;
  permalink: string;
}

interface RedditUserData {
  name: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number;
  isGold: boolean;
  isMod: boolean;
  hasVerifiedEmail: boolean;
  iconImg: string;
  subreddit?: {
    title: string;
    publicDescription: string;
    subscribers: number;
  };
}

export async function scrapeReddit(username: string): Promise<ScrapedProfile> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || `OSINT-Deep-Dive/1.0 (by /u/osint_research)`;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Reddit API credentials not configured. Please add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in Settings > Secrets.'
    );
  }

  try {
    // Get OAuth token using client credentials (app-only auth)
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error(`Reddit auth failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userResponse = await fetch(`https://oauth.reddit.com/user/${username}/about`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Reddit user fetch failed: ${userResponse.status}`);
    }

    const userData = (await userResponse.json() as { data: RedditUserData }).data;

    // Fetch recent posts
    const postsResponse = await fetch(`https://oauth.reddit.com/user/${username}/submitted?limit=10&sort=new`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
      },
    });

    let posts: Array<{
      id: string;
      content: string;
      timestamp: string;
      likes?: number;
      comments?: number;
      url?: string;
    }> = [];

    if (postsResponse.ok) {
      const postsData = await postsResponse.json() as { data: { children: Array<{ data: RedditPost }> } };
      posts = postsData.data.children.map((child) => ({
        id: child.data.id,
        content: `[${child.data.subreddit}] ${child.data.title}${child.data.selftext ? '\n' + child.data.selftext.slice(0, 200) : ''}`,
        timestamp: new Date(child.data.createdUtc * 1000).toISOString(),
        likes: child.data.score,
        comments: child.data.numComments,
        url: `https://reddit.com${child.data.permalink}`,
      }));
    }

    // Fetch recent comments
    const commentsResponse = await fetch(`https://oauth.reddit.com/user/${username}/comments?limit=10&sort=new`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
      },
    });

    if (commentsResponse.ok) {
      const commentsData = await commentsResponse.json() as { data: { children: Array<{ data: any }> } };
      const commentPosts = commentsData.data.children.map((child: any) => ({
        id: `comment-${child.data.id}`,
        content: `[Comment in r/${child.data.subreddit}] ${child.data.body?.slice(0, 200) || ''}`,
        timestamp: new Date(child.data.created_utc * 1000).toISOString(),
        likes: child.data.score,
        comments: 0,
        url: `https://reddit.com${child.data.permalink}`,
      }));
      posts = [...posts, ...commentPosts].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);
    }

    return {
      platform: 'reddit',
      username,
      profileUrl: `https://reddit.com/u/${username}`,
      profileData: {
        bio: userData.subreddit?.publicDescription || '',
        followers: userData.subreddit?.subscribers || 0,
        profilePic: userData.iconImg || undefined,
        joinDate: new Date(userData.createdUtc * 1000).toISOString(),
      },
      posts,
      engagementMetrics: {
        totalEngagement: userData.totalKarma,
        avgLikes: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length) : 0,
        avgComments: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length) : 0,
      },
    };
  } catch (error: any) {
    console.error(`Reddit scraper error for ${username}:`, error);
    throw error;
  }
}
