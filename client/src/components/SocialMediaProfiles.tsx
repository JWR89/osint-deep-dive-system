import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SocialMediaProfilesProps {
  investigationId: number;
}

const PLATFORM_CONFIG = {
  twitter: { name: 'X (Twitter)', icon: '𝕏', color: 'bg-black text-white', urlPrefix: 'https://twitter.com/' },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', urlPrefix: 'https://instagram.com/' },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600 text-white', urlPrefix: 'https://facebook.com/' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black text-white', urlPrefix: 'https://tiktok.com/@' },
  reddit: { name: 'Reddit', icon: '🤖', color: 'bg-orange-500 text-white', urlPrefix: 'https://reddit.com/u/' },
  youtube: { name: 'YouTube', icon: '▶️', color: 'bg-red-600 text-white', urlPrefix: 'https://youtube.com/@' },
  pinterest: { name: 'Pinterest', icon: '📌', color: 'bg-red-700 text-white', urlPrefix: 'https://pinterest.com/' },
  snapchat: { name: 'Snapchat', icon: '👻', color: 'bg-yellow-400 text-black', urlPrefix: 'https://snapchat.com/' },
} as const;

type Platform = keyof typeof PLATFORM_CONFIG;

export function SocialMediaProfiles({ investigationId }: SocialMediaProfilesProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>('twitter');
  const [newUsername, setNewUsername] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: profiles, isLoading } = trpc.socialMedia.getProfiles.useQuery({ investigationId });

  const addProfileMutation = trpc.socialMedia.addProfile.useMutation({
    onSuccess: () => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      setAddDialogOpen(false);
      setNewUsername('');
      toast.success('Profile added successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const scrapeProfileMutation = trpc.socialMedia.scrapeProfile.useMutation({
    onSuccess: () => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      toast.success('Profile scraped successfully');
    },
    onError: (err) => toast.error(`Scraping failed: ${err.message}`),
  });

  const scrapeAllMutation = trpc.socialMedia.scrapeAll.useMutation({
    onSuccess: (data) => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      const successCount = data.results.filter(r => r.success).length;
      const failCount = data.results.filter(r => !r.success).length;
      toast.success(`Scraped ${successCount} profiles${failCount > 0 ? `, ${failCount} failed` : ''}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProfileMutation = trpc.socialMedia.deleteProfile.useMutation({
    onSuccess: () => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      toast.success('Profile removed');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddProfile = () => {
    if (!newUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    const config = PLATFORM_CONFIG[newPlatform];
    addProfileMutation.mutate({
      investigationId,
      platform: newPlatform,
      username: newUsername.trim().replace('@', ''),
      profileUrl: config.urlPrefix + newUsername.trim().replace('@', ''),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Social Media Profiles</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const selectedProfileData = profiles?.find(p => p.id === selectedProfile);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">🌐</span>
          Social Media Profiles
          {profiles && profiles.length > 0 && (
            <Badge variant="secondary">{profiles.length}</Badge>
          )}
        </h3>
        <div className="flex gap-2">
          {profiles && profiles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrapeAllMutation.mutate({ investigationId })}
              disabled={scrapeAllMutation.isPending}
            >
              {scrapeAllMutation.isPending ? 'Scraping...' : 'Scrape All'}
            </Button>
          )}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Add Profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Social Media Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Platform</label>
                  <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v as Platform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Username</label>
                  <Input
                    placeholder={`Enter ${PLATFORM_CONFIG[newPlatform].name} username`}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Profile URL: {PLATFORM_CONFIG[newPlatform].urlPrefix}{newUsername || 'username'}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddProfile}
                  disabled={addProfileMutation.isPending}
                >
                  {addProfileMutation.isPending ? 'Adding...' : 'Add Profile'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty State */}
      {(!profiles || profiles.length === 0) && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <h4 className="font-medium mb-1">No Social Media Profiles</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add social media profiles to track and scrape public data for this investigation.
          </p>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            + Add First Profile
          </Button>
        </Card>
      )}

      {/* Profile Grid */}
      {profiles && profiles.length > 0 && (
        <Tabs defaultValue="grid" className="w-full">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="detail">Detail View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => {
                const config = PLATFORM_CONFIG[profile.platform as Platform];
                const profileData = profile.profileData as any;
                return (
                  <Card
                    key={profile.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedProfile(profile.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${config.color}`}>
                          {config.icon}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{config.name}</p>
                          <p className="text-xs text-muted-foreground">@{profile.username}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          profile.scrapingStatus === 'success' ? 'default' :
                          profile.scrapingStatus === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {profile.scrapingStatus}
                      </Badge>
                    </div>

                    {profileData && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {profileData.bio && (
                          <p className="line-clamp-2">{profileData.bio}</p>
                        )}
                        <div className="flex gap-3 pt-1">
                          {profile.followers != null && (
                            <span><strong>{profile.followers.toLocaleString()}</strong> followers</span>
                          )}
                          {profile.following != null && (
                            <span><strong>{profile.following.toLocaleString()}</strong> following</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {profile.lastScrapedAt
                          ? `Scraped ${new Date(profile.lastScrapedAt).toLocaleDateString()}`
                          : 'Not yet scraped'}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrapeProfileMutation.mutate({ id: profile.id });
                          }}
                          disabled={scrapeProfileMutation.isPending}
                        >
                          Scrape
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProfileMutation.mutate({ id: profile.id });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detail">
            {selectedProfile && selectedProfileData ? (
              <ProfileDetailView profile={selectedProfileData} />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Select a profile from the grid to view details</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Selected Profile Detail Modal */}
      {selectedProfile && selectedProfileData && (
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{PLATFORM_CONFIG[selectedProfileData.platform as Platform]?.icon}</span>
                @{selectedProfileData.username} - {PLATFORM_CONFIG[selectedProfileData.platform as Platform]?.name}
              </DialogTitle>
            </DialogHeader>
            <ProfileDetailView profile={selectedProfileData} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ProfileDetailView({ profile }: { profile: any }) {
  const profileData = profile.profileData as any;
  const posts = profile.posts as any[] || [];
  const config = PLATFORM_CONFIG[profile.platform as Platform];

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg ${config.color}`}>
          {config.icon}
        </span>
        <div className="flex-1">
          <h4 className="font-semibold">@{profile.username}</h4>
          {profileData?.bio && (
            <p className="text-sm text-muted-foreground mt-1">{profileData.bio}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm">
            {profile.followers != null && (
              <span><strong>{profile.followers.toLocaleString()}</strong> followers</span>
            )}
            {profile.following != null && (
              <span><strong>{profile.following.toLocaleString()}</strong> following</span>
            )}
          </div>
        </div>
        {profile.profileUrl && (
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View Profile →
          </a>
        )}
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div>
          <h5 className="font-medium mb-2">Recent Posts ({posts.length})</h5>
          <div className="space-y-2">
            {posts.map((post: any, i: number) => (
              <Card key={i} className="p-3">
                <p className="text-sm">{post.content}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {post.likes != null && <span>❤️ {post.likes}</span>}
                  {post.comments != null && <span>💬 {post.comments}</span>}
                  {post.shares != null && <span>🔄 {post.shares}</span>}
                  {post.timestamp && (
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scraping Info */}
      <div className="text-xs text-muted-foreground border-t pt-3">
        <div className="flex justify-between">
          <span>Status: <Badge variant={profile.scrapingStatus === 'success' ? 'default' : 'secondary'} className="text-xs">{profile.scrapingStatus}</Badge></span>
          <span>Last scraped: {profile.lastScrapedAt ? new Date(profile.lastScrapedAt).toLocaleString() : 'Never'}</span>
        </div>
        {profile.scrapingError && (
          <p className="text-destructive mt-1">Error: {profile.scrapingError}</p>
        )}
      </div>
    </div>
  );
}
