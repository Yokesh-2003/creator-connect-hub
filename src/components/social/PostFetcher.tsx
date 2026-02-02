import { useState, useEffect } from 'react';
import { Platform, SocialPost } from '@/types';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Loader2, Heart, MessageCircle, Eye, Play } from 'lucide-react';

interface PostFetcherProps {
  platforms: Platform[];
  onSelectionChange: (selectedPosts: SocialPost[]) => void;
  maxSelection?: number;
  /** When set, fetches real posts from this OAuth-connected account */
  socialAccountId?: string;
}

export function PostFetcher({ platforms, onSelectionChange, maxSelection = 5, socialAccountId }: PostFetcherProps) {
  const { posts, isLoading, fetchPosts } = useSocialPosts();
  const [selectedPosts, setSelectedPosts] = useState<SocialPost[]>([]);
  const [activeTab, setActiveTab] = useState<Platform | 'all'>('all');
  const platformToFetch = activeTab === 'all' ? platforms[0] : activeTab;

  useEffect(() => {
    fetchPosts({
      platform: platformToFetch,
      socialAccountId: socialAccountId ?? undefined,
    });
  }, [socialAccountId, platformToFetch]);

  useEffect(() => {
    onSelectionChange(selectedPosts);
  }, [selectedPosts, onSelectionChange]);

  const handleSelectPost = (post: SocialPost) => {
    setSelectedPosts(prev => {
      const isSelected = prev.some(p => p.id === post.id);
      if (isSelected) return prev.filter(p => p.id !== post.id);
      if (prev.length >= maxSelection) return prev;
      return [...prev, post];
    });
  };

  const handleTabChange = (tab: Platform | 'all') => {
    setActiveTab(tab);
    fetchPosts({ platform: tab === 'all' ? undefined : tab });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Content ({selectedPosts.length}/{maxSelection})</h3>
        <Button variant="outline" size="sm" onClick={() => fetchPosts({ platform: platformToFetch, socialAccountId })}
            disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2">
        {['all', ...platforms].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTabChange(tab as Platform | 'all')}
          >
            {tab === 'all' ? 'All' : tab === 'linkedin' ? 'LinkedIn' : 'TikTok'}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map(post => {
            const isSelected = selectedPosts.some(p => p.id === post.id);
            return (
              <Card
                key={post.id}
                className={`cursor-pointer overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSelectPost(post)}
              >
                <div className="relative aspect-video bg-muted">
                  {post.thumbnail && <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />}
                  {post.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-10 w-10 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2">{post.platform}</Badge>
                  <div className="absolute bottom-2 right-2">
                    <Checkbox checked={isSelected} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments}</span>
                    {post.views != null && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views}</span>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
