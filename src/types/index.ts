export interface Campaign {
    id: string;
    name: string;
    description: string;
    goal: string;
    platform: 'tiktok' | 'linkedin';
    status: 'active' | 'inactive' | 'completed';
}

export interface Submission {
    id: string;
    campaign_id: string;
    user_id: string;
    content_url: string;
    platform: 'tiktok' | 'linkedin';
    video_id?: string;
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    created_at: string;
    user?: {
        username: string | null;
        avatar_url: string | null;
    };
}

export interface SocialAccount {
    id: string;
    user_id: string;
    platform: string;
    username: string;
    is_connected: boolean;
}
