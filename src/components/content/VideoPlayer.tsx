import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Submission } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowUp, Maximize, MessageCircle, Minimize, Repeat, ThumbsUp } from 'lucide-react';

interface VideoPlayerProps {
  submissions: Submission[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

// TikTok Helpers
const extractTikTokVideoId = (url: string): string | null => {
  const match = url.match(/video\/(\d+)/);
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

// LinkedIn Helpers
const extractLinkedInActivityId = (url: string): string | null => {
  const match = url.match(/activity[-/:](\d+)/);
  return match ? match[1] : null;
};

const LinkedInCard = ({ submission }: { submission: Submission }) => {
  if (!submission.content_text && !submission.thumbnail_url) {
    return (
        <div className="w-full h-full bg-black text-white flex flex-col justify-center items-center p-6 text-center">
            <Skeleton className="w-full max-w-sm h-64 mb-4 bg-zinc-800" />
            <p className="text-blue-400 font-semibold mb-2">Fetching LinkedIn Post...</p>
            <Skeleton className="w-full max-w-sm h-16 bg-zinc-800" />
        </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-center items-center p-6 text-center">
      {submission.thumbnail_url && 
        <img src={submission.thumbnail_url} alt="LinkedIn post thumbnail" className="w-full max-w-sm mb-4" />
      }
      <p className="text-blue-400 font-semibold mb-2">LinkedIn Post</p>

      {submission.content_text && 
        <p className="text-gray-300 mb-6 whitespace-pre-wrap">
          {submission.content_text}
        </p>
      }
      
      <a
        href={submission.content_url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
      >
        Open on LinkedIn
      </a>
    </div>
  );
};

const LinkedInEmbed = ({ submission, isActive }: { submission: Submission; isActive: boolean }) => {
    const activityId = useMemo(() => extractLinkedInActivityId(submission.content_url), [submission.content_url]);

    if (!activityId) {
        return <LinkedInCard submission={submission} />;
    }

    return (
        <iframe
            src={`https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
            scrolling="yes"
            loading={isActive ? 'eager' : 'lazy'}
            title={`LinkedIn post by ${submission.user?.username ?? 'Anonymous'}`}
        />
    );
};


const VideoPlayer = ({ submissions, currentIndex, setCurrentIndex }: VideoPlayerProps): JSX.Element => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = useCallback(() => {
    if (!scrollContainerRef.current) return;

    if (!document.fullscreenElement) {
        scrollContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = videoRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setCurrentIndex(index);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    const currentVideoRefs = videoRefs.current;

    for (const ref of currentVideoRefs) {
      if (ref) {
        observer.observe(ref);
      }
    }

    return () => {
        for (const ref of currentVideoRefs) {
            if (ref) {
                observer.unobserve(ref);
            }
        }
    };
  }, [setCurrentIndex]);

  useEffect(() => {
    if (scrollContainerRef.current && !isFullScreen) {
      const element = videoRefs.current[currentIndex];
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }, [currentIndex, isFullScreen]);

  const renderPlatformEmbed = (submission: Submission, isActive: boolean) => {
    switch (submission.platform) {
      case 'tiktok':
        return <TikTokEmbed url={submission.content_url} isActive={isActive} />;
      case 'linkedin':
        return <LinkedInEmbed submission={submission} isActive={isActive} />;
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-white bg-black">
            Unsupported platform
          </div>
        );
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-black"
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
              <>
                <div className="absolute top-4 right-4 z-10">
                  <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="text-white hover:text-white hover:bg-black/50">
                    {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
                  </Button>
                </div>
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
                      <span>{submission.like_count ?? 0}</span>
                    </Button>
                    <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
                      <MessageCircle size={20} />
                      <span>{submission.comment_count ?? 0}</span>
                    </Button>
                    <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
                      <Repeat size={20} />
                      <span>{0}</span>
                    </Button>
                    <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto">
                      <ArrowUp size={20} />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))
      }
    </div>
  );
};

export default VideoPlayer;
