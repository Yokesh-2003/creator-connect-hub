
import { useState, useEffect } from 'react';
import { Platform, SocialPost } from '@/types';
import CreatorContentFetcher from '../content/CreatorContentFetcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Play, Heart, MessageCircle, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PostFetcherProps {
  campaignId: string;
  onSelectionChange: (selectedPosts: SocialPost[]) => void;
  onManualSubmit: (url: string) => void;
  maxSelection?: number;
}

export function PostFetcher({ campaignId, onSelectionChange, onManualSubmit, maxSelection = 1 }: PostFetcherProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<SocialPost[]>([]);
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);

  useEffect(() => {
    onSelectionChange(selectedPosts);
  }, [selectedPosts, onSelectionChange]);

  const handleSelectPost = (post: SocialPost) => {
    setSelectedPosts(prev => {
      const isSelected = prev.some(p => p.id === post.id);
      if (isSelected) return prev.filter(p => p.id !== post.id);
      if (prev.length >= maxSelection) return [post]; // Replace selection if max is 1
      return [...prev, post];
    });
  };

  return (
    <div className="space-y-4">
        <CreatorContentFetcher 
            campaignId={campaignId} 
            onContentFetched={setPosts}
            onManualSubmit={onManualSubmit}
        />

      {posts.length > 0 && (
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
                        <Play className="h-8 w-8 text-white drop-shadow-lg" />
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
