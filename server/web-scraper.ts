/**
 * Web Scraper Module
 * Uses Puppeteer to scrape public social media profiles and dating sites
 * Supports: Twitter/X, Reddit, Dating Sites, LinkedIn, GitHub, public profiles
 */

import puppeteer, { Browser, Page } from "puppeteer";

export interface ScrapedPost {
  platform: string;
  username: string;
  postId: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  url: string;
}

export interface ScrapedProfile {
  platform: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  postCount: number;
  verified: boolean;
  profileUrl: string;
  profileImage: string;
  joinDate?: Date;
  location?: string;
  website?: string;
}

export interface ScrapingResult {
  platform: string;
  username: string;
  profile: ScrapedProfile | null;
  posts: ScrapedPost[];
  scrapedAt: Date;
  success: boolean;
  error?: string;
}

class WebScraper {
  private browser: Browser | null = null;
  private userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  ];

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape Twitter/X profile and posts
   */
  async scrapeTwitter(username: string): Promise<ScrapingResult> {
    if (!this.browser) await this.initialize();

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1280, height: 720 });

      const profileUrl = `https://twitter.com/${username}`;
      await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // Extract profile info
      const profile = await page.evaluate(() => {
        const nameEl = document.querySelector('[data-testid="profile_name"]');
        const bioEl = document.querySelector('[data-testid="profile_bio"]');
        const followersEl = document.querySelector('[href*="followers"]');
        const followingEl = document.querySelector('[href*="following"]');

        return {
          displayName: nameEl?.textContent || "",
          bio: bioEl?.textContent || "",
          followers: parseInt(followersEl?.textContent || "0") || 0,
          following: parseInt(followingEl?.textContent || "0") || 0,
        };
      });

      // Scroll and extract posts
      const posts: ScrapedPost[] = [];
      let previousHeight = 0;

      for (let i = 0; i < 5; i++) {
        // Scroll to load more posts
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === previousHeight) break;
        previousHeight = newHeight;

        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await this.delay(2000);

        // Extract posts
        const pagePosts = await page.evaluate((username: string) => {
          const posts: any[] = [];
          const postElements = document.querySelectorAll('[data-testid="tweet"]');

          postElements.forEach(el => {
            const textEl = el.querySelector('[data-testid="tweetText"]');
            const timeEl = el.querySelector('time');
            const likesEl = el.querySelector('[data-testid="like"]');

            if (textEl && timeEl) {
              posts.push({
                content: textEl.textContent || "",
                timestamp: timeEl.getAttribute("datetime") || new Date().toISOString(),
                likes: parseInt(likesEl?.textContent || "0") || 0,
                url: `https://twitter.com/${username}/status/${Math.random()}`,
              });
            }
          });

          return posts;
        }, username);

        posts.push(
          ...pagePosts.map((p: any, idx: number) => ({
            platform: "twitter",
            username,
            postId: `twitter_${username}_${idx}`,
            content: p.content,
            timestamp: new Date(p.timestamp),
            likes: p.likes,
            comments: 0,
            shares: 0,
            url: p.url,
          }))
        );
      }

      await page.close();

      return {
        platform: "twitter",
        username,
        profile: {
          platform: "twitter",
          username,
          displayName: profile.displayName,
          bio: profile.bio,
          followers: profile.followers,
          following: profile.following,
          postCount: posts.length,
          verified: false,
          profileUrl,
          profileImage: `https://twitter.com/${username}`,
        },
        posts: posts.slice(0, 50), // Limit to 50 posts
        scrapedAt: new Date(),
        success: true,
      };
    } catch (error) {
      return {
        platform: "twitter",
        username,
        profile: null,
        posts: [],
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Scrape Reddit profile and posts
   */
  async scrapeReddit(username: string): Promise<ScrapingResult> {
    if (!this.browser) await this.initialize();

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1280, height: 720 });

      const profileUrl = `https://www.reddit.com/user/${username}`;
      await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // Extract profile info
      const profile = await page.evaluate(() => {
        const karmaEl = document.querySelector('[data-testid="karma"]');
        const joinDateEl = document.querySelector('[data-testid="joined"]');

        return {
          displayName: document.querySelector("h1")?.textContent || "",
          karma: parseInt(karmaEl?.textContent || "0") || 0,
          joinDate: joinDateEl?.textContent || "",
        };
      });

      // Extract posts
      const posts: ScrapedPost[] = [];

      for (let i = 0; i < 3; i++) {
        await this.delay(1500);

        const pagePosts = await page.evaluate((username: string) => {
          const posts: any[] = [];
          const postElements = document.querySelectorAll('[data-testid="post-container"]');

          postElements.forEach((el, idx) => {
            const titleEl = el.querySelector("h3");
            const scoreEl = el.querySelector('[data-testid="score"]');
            const timeEl = el.querySelector("time");

            if (titleEl) {
              posts.push({
                content: titleEl.textContent || "",
                timestamp: timeEl?.getAttribute("datetime") || new Date().toISOString(),
                likes: parseInt(scoreEl?.textContent || "0") || 0,
                url: `https://reddit.com/r/reddit/comments/${Math.random()}`,
              });
            }
          });

          return posts;
        }, username);

        posts.push(
          ...pagePosts.map((p: any, idx: number) => ({
            platform: "reddit",
            username,
            postId: `reddit_${username}_${idx}`,
            content: p.content,
            timestamp: new Date(p.timestamp),
            likes: p.likes,
            comments: 0,
            shares: 0,
            url: p.url,
          }))
        );

        // Scroll for more posts
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      }

      await page.close();

      return {
        platform: "reddit",
        username,
        profile: {
          platform: "reddit",
          username,
          displayName: profile.displayName,
          bio: `Karma: ${profile.karma}`,
          followers: 0,
          following: 0,
          postCount: posts.length,
          verified: false,
          profileUrl,
          profileImage: `https://reddit.com/user/${username}`,
          joinDate: new Date(profile.joinDate),
        },
        posts: posts.slice(0, 50),
        scrapedAt: new Date(),
        success: true,
      };
    } catch (error) {
      return {
        platform: "reddit",
        username,
        profile: null,
        posts: [],
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Scrape dating site profile
   */
  async scrapeDatingSite(username: string, site: "match" | "bumble" | "hinge" | "okcupid" | "tinder"): Promise<ScrapingResult> {
    if (!this.browser) await this.initialize();

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1280, height: 720 });

      // Dating sites typically don't allow direct profile scraping due to privacy
      // This is a placeholder that would need site-specific logic
      const profileUrl = `https://${site}.com/profile/${username}`;

      try {
        await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 15000 });
      } catch {
        // Profile may be private or not exist
        await page.close();
        return {
          platform: site,
          username,
          profile: null,
          posts: [],
          scrapedAt: new Date(),
          success: false,
          error: "Profile not publicly accessible or does not exist",
        };
      }

      // Extract public profile info (if available)
      const profile = await page.evaluate(() => {
        return {
          displayName: document.querySelector("h1")?.textContent || "",
          bio: document.querySelector('[data-testid="bio"]')?.textContent || "",
          age: document.querySelector('[data-testid="age"]')?.textContent || "",
          location: document.querySelector('[data-testid="location"]')?.textContent || "",
        };
      });

      await page.close();

      return {
        platform: site,
        username,
        profile: {
          platform: site,
          username,
          displayName: profile.displayName,
          bio: profile.bio,
          followers: 0,
          following: 0,
          postCount: 0,
          verified: false,
          profileUrl,
          profileImage: profileUrl,
          location: profile.location,
        },
        posts: [],
        scrapedAt: new Date(),
        success: true,
      };
    } catch (error) {
      return {
        platform: site,
        username,
        profile: null,
        posts: [],
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Scrape generic public profile (LinkedIn, GitHub, etc.)
   */
  async scrapePublicProfile(url: string): Promise<ScrapingResult> {
    if (!this.browser) await this.initialize();

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1280, height: 720 });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Extract basic profile info
      const profile = await page.evaluate(() => {
        return {
          displayName: document.querySelector("h1")?.textContent || "",
          bio: document.querySelector('[data-testid="bio"]')?.textContent || document.querySelector(".bio")?.textContent || "",
          title: document.querySelector("h2")?.textContent || "",
        };
      });

      await page.close();

      return {
        platform: "public",
        username: url.split("/").pop() || "",
        profile: {
          platform: "public",
          username: url.split("/").pop() || "",
          displayName: profile.displayName,
          bio: profile.bio,
          followers: 0,
          following: 0,
          postCount: 0,
          verified: false,
          profileUrl: url,
          profileImage: url,
        },
        posts: [],
        scrapedAt: new Date(),
        success: true,
      };
    } catch (error) {
      return {
        platform: "public",
        username: url.split("/").pop() || "",
        profile: null,
        posts: [],
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const webScraper = new WebScraper();
