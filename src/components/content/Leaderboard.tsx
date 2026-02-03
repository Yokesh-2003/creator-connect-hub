import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views;
};

export default function Leaderboard({ submissions }: { submissions: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {submissions.map((sub, index) => {
            const creatorName = sub.creator_name || sub.profiles?.username || 'Anonymous';
            const avatarUrl = sub.avatar_url || sub.profiles?.avatar_url;

            return (
              <div key={sub.id || index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                  <Avatar>
                    <AvatarImage src={avatarUrl} alt={creatorName} />
                    <AvatarFallback>{creatorName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{creatorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatViews(sub.view_count || 0)} views
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
