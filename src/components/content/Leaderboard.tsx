import { Submission } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardProps {
  submissions: Submission[];
  onSelectSubmission: (index: number) => void;
}

export default function Leaderboard({ submissions, onSelectSubmission }: LeaderboardProps) {
  // Sort submissions by views in descending order and take the top 10
  const sortedSubmissions = [...submissions]
    .sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {sortedSubmissions.map((submission, index) => (
        <div 
          key={submission.id} 
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          onClick={() => onSelectSubmission(submissions.findIndex(s => s.id === submission.id))}
        >
          <div className="flex items-center space-x-4">
            <span className="font-bold text-lg">{index + 1}</span>
            <Avatar>
              <AvatarImage src={submission.user?.avatar_url || 'https://github.com/shadcn.png'} />
              <AvatarFallback>{submission.user?.username ? submission.user.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{submission.user?.username || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">{submission.metrics?.views ?? 0} views</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
