import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window { instgrm?: any; twttr?: any; tiktok?: any; }
}

const SafeEmbedRenderer = ({ htmlContent }: { htmlContent: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !htmlContent) return;

    container.innerHTML = '';
    const fragment = document.createRange().createContextualFragment(htmlContent);
    container.appendChild(fragment);

    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      if (oldScript.src) {
        newScript.onload = () => {
          if (window.instgrm) window.instgrm.Embeds.process();
          if (window.twttr) window.twttr.widgets.load();
        };
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [htmlContent]);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center" />;
};


const SubmissionPlayer = ({ submission, isVisible }: { submission: any; isVisible: boolean }) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible || !submission?.content_url) return;

    const fetchEmbed = async () => {
      setLoading(true);
      setError(null);
      setEmbedHtml(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke('fetch-content-info', {
          body: { url: submission.content_url },
        });

        if (functionError) throw new Error(functionError.message);
        if (data?.html) {
          setEmbedHtml(data.html);
        } else {
          throw new Error("Could not generate video embed. The URL might be private, invalid, or from an unsupported platform.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load video.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmbed();
  }, [submission?.content_url, isVisible]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {loading && <Skeleton className="w-full h-full bg-muted-foreground/20" />}
      {!loading && error &&
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
          <p className="font-semibold">Unable to Load Content</p>
          <p className="text-xs text-muted-foreground mt-1 px-4">{error}</p>
        </div>
      }
      {!loading && embedHtml &&
        <SafeEmbedRenderer key={submission.id} htmlContent={embedHtml} />
      }
    </div>
  );
};

interface VideoPlayerProps {
  submissions: any[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const VideoPlayer = ({ submissions, currentIndex, setCurrentIndex }: VideoPlayerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, submissions.length);
  }, [submissions]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < submissions.length) {
        setCurrentIndex(newIndex);
    }
  }, [currentIndex, submissions.length, setCurrentIndex]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  return (
    <div 
      ref={scrollContainerRef} 
      className="w-full h-full overflow-y-auto snap-y snap-mandatory rounded-lg bg-background-alt"
    >
      {submissions.map((sub, index) => (
        <div 
          key={sub.id} 
          ref={el => itemRefs.current[index] = el} 
          className="h-full w-full snap-start flex items-center justify-center"
        >
          <div className="w-full h-full max-w-sm aspect-[9/16] m-auto">
            <SubmissionPlayer submission={sub} isVisible={index === currentIndex} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoPlayer;
