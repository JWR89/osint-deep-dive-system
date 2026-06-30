import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SocialMediaProfilesProps {
  investigationId: number;
}

const PLATFORM_CONFIG = {
  twitter: { name: 'X (Twitter)', icon: '𝕏', color: 'bg-black text-white', urlPrefix: 'https://x.com/', supportsApi: false },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', urlPrefix: 'https://instagram.com/', supportsApi: false },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600 text-white', urlPrefix: 'https://facebook.com/', supportsApi: false },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black text-white', urlPrefix: 'https://tiktok.com/@', supportsApi: false },
  reddit: { name: 'Reddit', icon: '🤖', color: 'bg-orange-500 text-white', urlPrefix: 'https://reddit.com/u/', supportsApi: true },
  youtube: { name: 'YouTube', icon: '▶️', color: 'bg-red-600 text-white', urlPrefix: 'https://youtube.com/@', supportsApi: true },
  pinterest: { name: 'Pinterest', icon: '📌', color: 'bg-red-700 text-white', urlPrefix: 'https://pinterest.com/', supportsApi: false },
  snapchat: { name: 'Snapchat', icon: '👻', color: 'bg-yellow-400 text-black', urlPrefix: 'https://snapchat.com/', supportsApi: false },
} as const;

type Platform = keyof typeof PLATFORM_CONFIG;

const GROK_PROMPT_TEMPLATE = `Analyze this social media profile and extract the following information in a structured format. Be thorough and precise.

PROFILE URL: [PASTE URL HERE]

Please extract and report:

1. **Username/Handle**: 
2. **Display Name**: 
3. **Bio/Description**: (exact text)
4. **Follower Count**: (exact number)
5. **Following Count**: (exact number)
6. **Verified**: (yes/no)
7. **Account Created**: (date if visible)
8. **Profile Picture Description**: (describe what you see)
9. **Location**: (if listed)
10. **Website/Links**: (any external links)

**RECENT POSTS** (list the 3-5 most recent):
For each post include:
- Content/Caption (first 200 characters)
- Date posted
- Likes/Hearts count
- Comments count
- Shares/Retweets count
- Any hashtags used

**BEHAVIORAL PATTERNS**:
- Posting frequency (daily/weekly/monthly)
- Common topics/themes
- Tone (professional/casual/aggressive/etc.)
- Engagement level (high/medium/low)
- Any notable connections or interactions

**RED FLAGS OR NOTABLE ITEMS**:
- Any inconsistencies
- Suspicious activity patterns
- Notable associations
- Content that stands out

Format your response as clean, structured data I can copy into my investigation system.`;

export function SocialMediaProfiles({ investigationId }: SocialMediaProfilesProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [grokDialogOpen, setGrokDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);

  // Add profile form state
  const [newPlatform, setNewPlatform] = useState<Platform>('twitter');
  const [newUsername, setNewUsername] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newFollowers, setNewFollowers] = useState('');
  const [newFollowing, setNewFollowing] = useState('');
  const [newPosts, setNewPosts] = useState('');

  // Edit profile form state
  const [editBio, setEditBio] = useState('');
  const [editFollowers, setEditFollowers] = useState('');
  const [editFollowing, setEditFollowing] = useState('');
  const [editPosts, setEditPosts] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const utils = trpc.useUtils();
  const { data: profiles, isLoading } = trpc.socialMedia.getProfiles.useQuery({ investigationId });

  const addProfileMutation = trpc.socialMedia.addProfile.useMutation({
    onSuccess: () => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      setAddDialogOpen(false);
      resetAddForm();
      toast.success('Profile added successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProfileMutation = trpc.socialMedia.updateProfileData.useMutation({
    onSuccess: () => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      setEditDialogOpen(false);
      toast.success('Profile data updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const scrapeProfileMutation = trpc.socialMedia.scrapeProfile.useMutation({
    onSuccess: () => {
      utils.socialMedia.getProfiles.invalidate({ investigationId });
      toast.success('Profile scraped via API');
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

  function resetAddForm() {
    setNewUsername('');
    setNewUrl('');
    setNewBio('');
    setNewFollowers('');
    setNewFollowing('');
    setNewPosts('');
  }

  function parsePosts(text: string) {
    if (!text.trim()) return undefined;
    // Parse posts: each line is a post, or separated by ---
    const entries = text.split(/\n---\n|\n\n/).filter(Boolean);
    return entries.map(entry => ({
      content: entry.trim(),
      timestamp: new Date().toISOString(),
    }));
  }

  function handleAddProfile() {
    if (!newUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    const config = PLATFORM_CONFIG[newPlatform];
    addProfileMutation.mutate({
      investigationId,
      platform: newPlatform,
      username: newUsername.trim().replace('@', ''),
      profileUrl: newUrl.trim() || config.urlPrefix + newUsername.trim().replace('@', ''),
      bio: newBio.trim() || undefined,
      followers: newFollowers ? parseInt(newFollowers) : undefined,
      following: newFollowing ? parseInt(newFollowing) : undefined,
      posts: parsePosts(newPosts),
    });
  }

  function handleEditProfile() {
    if (!selectedProfile) return;
    updateProfileMutation.mutate({
      id: selectedProfile,
      bio: editBio.trim() || undefined,
      followers: editFollowers ? parseInt(editFollowers) : undefined,
      following: editFollowing ? parseInt(editFollowing) : undefined,
      posts: parsePosts(editPosts),
      notes: editNotes.trim() || undefined,
    });
  }

  function openEditDialog(profile: any) {
    setSelectedProfile(profile.id);
    const data = profile.profileData as any || {};
    setEditBio(data.bio || '');
    setEditFollowers(profile.followers?.toString() || '');
    setEditFollowing(profile.following?.toString() || '');
    setEditPosts('');
    setEditNotes(data.notes || '');
    setEditDialogOpen(true);
  }

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">🌐</span>
          Social Media Profiles
          {profiles && profiles.length > 0 && (
            <Badge variant="secondary">{profiles.length}</Badge>
          )}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGrokDialogOpen(true)}
          >
            📋 Grok Prompt
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Add Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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
                            {config.supportsApi && <Badge variant="secondary" className="text-[10px] px-1">API</Badge>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Username</label>
                  <Input
                    placeholder="username (without @)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Profile URL</label>
                  <Input
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to auto-generate from username
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Profile Data (optional - enter what you can see)</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Bio / Description</label>
                      <Textarea
                        placeholder="Copy the bio text here..."
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Followers</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newFollowers}
                          onChange={(e) => setNewFollowers(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Following</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newFollowing}
                          onChange={(e) => setNewFollowing(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Recent Posts (one per paragraph, separate with blank line)</label>
                      <Textarea
                        placeholder={"First post content here...\n\nSecond post content here...\n\nThird post content here..."}
                        value={newPosts}
                        onChange={(e) => setNewPosts(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
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

      {/* Info Banner */}
      <Card className="p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>How it works:</strong> Find the social media profile, then either enter the data manually or use the <strong>Grok Prompt</strong> button to get a template you can paste into Grok/ChatGPT for analysis. Paste the results back here. Reddit and YouTube support automatic API scraping.
        </p>
      </Card>

      {/* Empty State */}
      {(!profiles || profiles.length === 0) && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <h4 className="font-medium mb-1">No Social Media Profiles</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add social media profiles to track for this investigation.
          </p>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            + Add First Profile
          </Button>
        </Card>
      )}

      {/* Profile Grid */}
      {profiles && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const config = PLATFORM_CONFIG[profile.platform as Platform];
            const profileData = profile.profileData as any;
            return (
              <Card key={profile.id} className="p-4 hover:shadow-md transition-shadow">
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
                    {profile.scrapingStatus === 'success' ? 'Has Data' :
                     profile.scrapingStatus === 'failed' ? 'Failed' : 'No Data'}
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
                      ? `Updated ${new Date(profile.lastScrapedAt).toLocaleDateString()}`
                      : 'No data yet'}
                  </span>
                  <div className="flex gap-1">
                    {profile.profileUrl && (
                      <a
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mr-1"
                      >
                        View ↗
                      </a>
                    )}
                    {config.supportsApi && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => scrapeProfileMutation.mutate({ id: profile.id })}
                        disabled={scrapeProfileMutation.isPending}
                      >
                        Auto-Scrape
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => openEditDialog(profile)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive"
                      onClick={() => deleteProfileMutation.mutate({ id: profile.id })}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Profile Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Paste data from the profile or from your Grok analysis below.
            </p>

            <div>
              <label className="text-sm font-medium mb-1 block">Bio / Description</label>
              <Textarea
                placeholder="Profile bio text..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Followers</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFollowers}
                  onChange={(e) => setEditFollowers(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Following</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFollowing}
                  onChange={(e) => setEditFollowing(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Recent Posts (one per paragraph)</label>
              <Textarea
                placeholder={"Post 1 content...\n\nPost 2 content...\n\nPost 3 content..."}
                value={editPosts}
                onChange={(e) => setEditPosts(e.target.value)}
                rows={5}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Analysis Notes</label>
              <Textarea
                placeholder="Paste Grok analysis, behavioral patterns, red flags, etc..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleEditProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Data'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grok Prompt Dialog */}
      <Dialog open={grokDialogOpen} onOpenChange={setGrokDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grok / AI Analysis Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Copy this prompt and paste it into <strong>Grok</strong>, <strong>ChatGPT</strong>, or <strong>Claude</strong> along with the profile URL. Then paste the results back into the profile's Edit form.
            </p>

            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap overflow-y-auto max-h-[400px] font-mono">
                {GROK_PROMPT_TEMPLATE}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(GROK_PROMPT_TEMPLATE);
                  toast.success('Prompt copied to clipboard!');
                }}
              >
                Copy
              </Button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Workflow:</strong>
              </p>
              <ol className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1 list-decimal list-inside">
                <li>Copy the prompt above</li>
                <li>Open Grok (or ChatGPT/Claude)</li>
                <li>Paste the prompt + the profile URL</li>
                <li>Copy the analysis results</li>
                <li>Click "Edit" on the profile card here</li>
                <li>Paste the data into the appropriate fields</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
