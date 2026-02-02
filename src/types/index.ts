export type Platform = 'linkedin' | 'tiktok';

export interface SocialPost {
  id: string;
  platform: Platform;
  type: 'post' | 'video';
  content: string;
  thumbnail?: string;
  mediaUrl?: string;
  embedHtml?: string;
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  createdAt: Date;
  author: {
    name: string;
    avatar: string;
  };
}