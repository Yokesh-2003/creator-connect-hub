import { useRef, useEffect, useMemo } from 'react';
import { Submission } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowUp, MessageCircle, Repeat, ThumbsUp } from 'lucide-react';

interface VideoPlayerProps {
  submissions: Submission[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const extractTikTokVideoId = (url: string): string | null => {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
};

const extractYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

const extractLinkedInVideoId = (url: string): string | null => {
  const pattern = /urn:li:activity:(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
};

const TikTokEmbed = ({ url, isActive }: { url: string; isActive: boolean }) => {
  const videoId = useMemo(() => extractTikTokVideoId(url), [url]);

  return videoId && isActive ? (
    <iframe
      src={`https://www.tiktok.com/embed/v2/${videoId}`}
      className="w-full h-full"
      allow="encrypted-media;"
      allowFullScreen
    ></iframe>
  ) : (
    <Skeleton className="w-full h-full bg-zinc-900" />
  );
};

const YouTubeEmbed = ({ url, isActive }: { url: string; isActive: boolean }) => {
  const videoId = useMemo(() => extractYouTubeVideoId(url), [url]);

  return videoId && isActive ? (
    <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded youtube"
    ></iframe>
  ) : (
    <Skeleton className="w-full h-full bg-zinc-900" />
  )
}

const LinkedInEmbed = ({ url, isActive }: { url: string; isActive: boolean }) => {
  const videoId = useMemo(() => extractLinkedInVideoId(url), [url]);
  if (!videoId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white p-4 text-center">
        <p>Invalid or unsupported LinkedIn URL.</p>
      </div>
    );
  }

  return isActive ? (
    <iframe
      src={`https://www.linkedin.com/embed/feed/update/urn:li:activity:${videoId}`}
      className="w-full h-full border-0"
      allowFullScreen
      title="Embedded post"
    ></iframe>
    ) : (
      <Skeleton className="w-full h-full bg-zinc-900" />
  )
}

const VideoPlayer = ({ submissions, currentIndex, setCurrentIndex }: VideoPlayerProps): JSX.Element => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const element = videoRefs.current[currentIndex];
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }, [currentIndex]);

  const renderPlatformEmbed = (submission: Submission, isActive: boolean) => {
    switch (submission.platform) {
      case 'tiktok':
        return <TikTokEmbed url={submission.url} isActive={isActive} />;
      case 'youtube':
        return <YouTubeEmbed url={submission.url} isActive={isActive} />;
      case 'linkedin':
        return <LinkedInEmbed url={submission.url} isActive={isActive} />;
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-white bg-black p-4 text-center">
            <p>Submissions for '{submission.platform}' are not yet supported in this player.</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
    >
      {
        submissions.map((submission, index) => (
          <div
            key={submission.id}
            ref={el => videoRefs.current[index] = el}
            className="h-full w-full snap-start flex-shrink-0 relative bg-black"
          >
            {renderPlatformEmbed(submission, index === currentIndex)}
            {index === currentIndex && (
<div className="absolute bottom-0 left-0 right-0 text-white p-4 bg-gradient-to-t from-black/80 to-transparent">
<div className="flex items-center gap-4 mb-2">
<Avatar>
<AvatarImage src={submission.user?.avatar_url ?? 'https://github.com/shadcn.png'} />
<AvatarFallback>{submission.user?.username ? submission.user.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
</Avatar>
<div>
<h3 className="font-semibold">{submission.user?.username ?? 'Anonymous'}</h3>
<p className="text-sm text-gray-400">@{submission.user?.username ?? 'anonymous'}</p>
</div>
</div>
<div className="flex justify-around items-center mt-4 text-xs">
<Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
<ThumbsUp size={20} />
<span>{submission.metrics?.likes ?? 0}</span>
</Button>
<Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
<MessageCircle size={20} />
<span>{submission.metrics?.comments ?? 0}</span>
</Button>
<Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
<Repeat size={20} />
<span>{submission.metrics?.shares ?? 0}</span>
</Button>
<Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
<ArrowUp size={20} />
<span>Share</span>
</Button>
</div>
</div>
            )}
          </div>
        ))
      }
    </div>
  );
};

export default VideoPlayer;
