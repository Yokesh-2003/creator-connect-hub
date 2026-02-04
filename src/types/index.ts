
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

export interface Campaign {
  id: string;
  title: string;
  description: string;
  platform: "tiktok" | "linkedin";
  reward_type: "fixed";
  reward_value: number;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
  quote?: string | null;
  created_at: string;
}
