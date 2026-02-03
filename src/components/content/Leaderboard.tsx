'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardProps {
  submissions: any[]; // Expects sorted submissions
}

// 5. Leaderboard: Pure UI, receives sorted submissions
export default function Leaderboard({ submissions }: LeaderboardProps) {

  const formatViews = (views: number | null | undefined) => {
    if (views === null || views === undefined) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        {submissions && submissions.length > 0 ? (
          <ul className="space-y-4">
            {submissions.map((sub, index) => (
              <li key={sub.id || index} className="flex items-center space-x-4">
                <span className="text-lg font-bold w-6 text-center">{index + 1}</span>
                <Avatar className="h-10 w-10">
                  {/* Use a placeholder if avatar_url isn't available */}
                  <AvatarImage src={sub.avatar_url} alt={sub.creator_name || 'User'} />
                  <AvatarFallback>{(sub.creator_name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sub.creator_name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">{formatViews(sub.view_count)} views</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No submissions yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
