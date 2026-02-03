
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views;
};

export default function Leaderboard({ submissions, onSelectSubmission }: any) {
  // Calculate and rank creators by total views
  const creatorMetrics = submissions.reduce((acc: any, sub: any) => {
    const creator = sub.profiles;
    if (!creator) return acc;

    const currentViews = acc[creator.id]?.totalViews || 0;
    const submissionViews = sub.metrics[0]?.views || 0;

    acc[creator.id] = {
      ...creator,
      totalViews: currentViews + submissionViews,
      submissionCount: (acc[creator.id]?.submissionCount || 0) + 1,
    };
    return acc;
  }, {});

  const rankedCreators = Object.values(creatorMetrics).sort((a: any, b: any) => b.totalViews - a.totalViews);

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankedCreators.map((creator: any, index: number) => (
            <div key={creator.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-6">{index + 1}</span>
                <Avatar>
                  <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                  <AvatarFallback>{creator.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{creator.full_name}</p>
                  <p className="text-sm text-slate-400">
                    {formatViews(creator.totalViews)} views from {creator.submissionCount} submission(s)
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                const creatorSubmission = submissions.find((s:any) => s.user_id === creator.id);
                if (creatorSubmission) {
                  onSelectSubmission(creatorSubmission)
                }
              }}>View</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
