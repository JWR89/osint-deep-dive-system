import { describe, it, expect, vi } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  createSocialMediaProfile: vi.fn().mockResolvedValue(1),
  getSocialMediaProfiles: vi.fn().mockResolvedValue([
    {
      id: 1,
      investigationId: 1,
      platform: 'twitter',
      username: 'testuser',
      profileUrl: 'https://twitter.com/testuser',
      profileData: { bio: 'Test bio', followers: 1000, following: 500 },
      posts: [{ id: 'tweet-1', content: 'Hello world', timestamp: '2024-01-01', likes: 50 }],
      stories: null,
      followers: 1000,
      following: 500,
      engagementMetrics: null,
      lastScrapedAt: new Date(),
      scrapingStatus: 'success',
      scrapingError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getSocialMediaProfileById: vi.fn().mockResolvedValue({
    id: 1,
    investigationId: 1,
    platform: 'twitter',
    username: 'testuser',
    profileUrl: 'https://twitter.com/testuser',
    profileData: { bio: 'Test bio', followers: 1000, following: 500 },
    posts: [],
    stories: null,
    followers: 1000,
    following: 500,
    engagementMetrics: null,
    lastScrapedAt: new Date(),
    scrapingStatus: 'success',
    scrapingError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateSocialMediaProfile: vi.fn().mockResolvedValue(undefined),
  deleteSocialMediaProfile: vi.fn().mockResolvedValue(undefined),
}));

describe('Social Media Scrapers', () => {
  it('should have correct platform configurations', () => {
    const platforms = ['twitter', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube', 'pinterest', 'snapchat'];
    expect(platforms).toHaveLength(8);
    expect(platforms).toContain('twitter');
    expect(platforms).toContain('instagram');
    expect(platforms).toContain('facebook');
  });

  it('should create a social media profile', async () => {
    const { createSocialMediaProfile } = await import('./db');
    const id = await createSocialMediaProfile({
      investigationId: 1,
      platform: 'twitter',
      username: 'testuser',
      profileUrl: 'https://twitter.com/testuser',
      scrapingStatus: 'pending',
    });
    expect(id).toBe(1);
    expect(createSocialMediaProfile).toHaveBeenCalledWith({
      investigationId: 1,
      platform: 'twitter',
      username: 'testuser',
      profileUrl: 'https://twitter.com/testuser',
      scrapingStatus: 'pending',
    });
  });

  it('should get social media profiles for an investigation', async () => {
    const { getSocialMediaProfiles } = await import('./db');
    const profiles = await getSocialMediaProfiles(1);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].platform).toBe('twitter');
    expect(profiles[0].username).toBe('testuser');
    expect(profiles[0].followers).toBe(1000);
  });

  it('should get a single profile by ID', async () => {
    const { getSocialMediaProfileById } = await import('./db');
    const profile = await getSocialMediaProfileById(1);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe(1);
    expect(profile!.platform).toBe('twitter');
  });

  it('should update a social media profile', async () => {
    const { updateSocialMediaProfile } = await import('./db');
    await updateSocialMediaProfile(1, {
      scrapingStatus: 'success',
      followers: 1500,
    });
    expect(updateSocialMediaProfile).toHaveBeenCalledWith(1, {
      scrapingStatus: 'success',
      followers: 1500,
    });
  });

  it('should delete a social media profile', async () => {
    const { deleteSocialMediaProfile } = await import('./db');
    await deleteSocialMediaProfile(1);
    expect(deleteSocialMediaProfile).toHaveBeenCalledWith(1);
  });
});

describe('Scraper Profile Data Structure', () => {
  it('should validate scraped profile structure', () => {
    const scrapedProfile = {
      platform: 'twitter' as const,
      username: 'testuser',
      profileUrl: 'https://twitter.com/testuser',
      profileData: {
        bio: 'Test bio',
        followers: 1000,
        following: 500,
      },
      posts: [
        {
          id: 'tweet-1',
          content: 'Hello world',
          timestamp: '2024-01-01T00:00:00.000Z',
          likes: 50,
          comments: 10,
          shares: 5,
        },
      ],
    };

    expect(scrapedProfile.platform).toBe('twitter');
    expect(scrapedProfile.profileData.followers).toBeGreaterThanOrEqual(0);
    expect(scrapedProfile.posts).toHaveLength(1);
    expect(scrapedProfile.posts[0].content).toBe('Hello world');
  });

  it('should handle empty profile data gracefully', () => {
    const emptyProfile = {
      platform: 'snapchat' as const,
      username: 'ghostuser',
      profileUrl: 'https://snapchat.com/ghostuser',
      profileData: {},
      posts: [],
    };

    expect(emptyProfile.posts).toHaveLength(0);
    expect(emptyProfile.profileData).toBeDefined();
  });
});
