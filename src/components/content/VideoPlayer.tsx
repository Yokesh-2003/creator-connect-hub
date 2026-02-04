import { useEffect, useRef, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface Submission {
  id: string;
  content_url: string;
  platform: 'tiktok' | 'linkedin';
}

interface VideoPlayerProps {
  submissions: Submission[];
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
}

const extractTikTokVideoId = (url: string): string | null => {
  const match = url.match(/(?:video\/|v\/)(\d+)/);
  return match ? match[1] : null;
};

const TikTokEmbed = ({ url, isActive }: { url: string; isActive: boolean }) => {
  const videoId = useMemo(() => extractTikTokVideoId(url), [url]);

  if (!videoId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white p-4 text-center">
        <p>Invalid or unsupported TikTok URL.</p>
      </div>
    );
  }

  return isActive ? (
    <iframe
      key={videoId}
      className="w-full h-full border-0"
      src={`https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&mute=1`}
      allow="autoplay; encrypted-media;"
      allowFullScreen
    ></iframe>
  ) : (
    <Skeleton className="w-full h-full bg-zinc-900" />
  );
};

const VideoPlayer = ({ submissions, currentIndex, setCurrentIndex }: VideoPlayerProps): JSX.Element => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, submissions.length);
  }, [submissions]);

  useEffect(() => {
    const videoElement = videoRefs.current[currentIndex];
    if (videoElement) {
      videoElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const indexStr = (entry.target as HTMLElement).dataset.index;
            if (indexStr) {
              const index = parseInt(indexStr, 10);
              if (index !== currentIndex) {
                setCurrentIndex(index);
              }
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.8,
      }
    );

    const currentRefs = videoRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [submissions, currentIndex, setCurrentIndex]);
  
  if (submissions.length === 0) {
    return (
      <div className="h-[80vh] w-full max-w-sm mx-auto bg-black rounded-lg flex items-center justify-center text-muted-foreground">
        <p>No submissions yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-[80vh] w-full max-w-sm mx-auto overflow-y-scroll snap-y snap-mandatory scroll-smooth rounded-lg bg-black"
    >
      {submissions.map((submission, index) => (
          <div
            key={submission.id}
            ref={(el) => (videoRefs.current[index] = el)}
            data-index={index}
            className="h-full w-full snap-start flex-shrink-0 relative"
          >
            {submission.platform === 'tiktok' ? (
              <TikTokEmbed url={submission.content_url} isActive={index === currentIndex} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white bg-black p-4 text-center">
                <p>Submissions for '{submission.platform}' are not yet supported in this player.</p>
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
};

export default VideoPlayer;
