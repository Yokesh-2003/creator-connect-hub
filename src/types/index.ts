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
    platform: string;
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    score?: number;
    created_at: string;
}

export interface SocialAccount {
    id: string;
    user_id: string;
    platform: string;
    username: string;
    is_connected: boolean;
}
