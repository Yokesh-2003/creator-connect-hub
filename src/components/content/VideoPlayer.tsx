
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Define a global window interface to avoid TypeScript errors for external SDKs
declare global {
  interface Window {
    instgrm?: any;
    twttr?: any;
    tiktok?: any;
  }
}

interface VideoPlayerProps {
  url: string;
}

/**
 * This component safely renders HTML content that may include <script> tags for embedding.
 * It's crucial for platforms like TikTok, Instagram, or Twitter, which use JavaScript
 * to render their embeds.
 */
const SafeEmbedRenderer = ({ htmlContent }: { htmlContent: string }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container || !htmlContent) return;

    // Clear previous content to prevent script conflicts
    container.innerHTML = '';

    // Create a document fragment to parse and mount the incoming HTML
    const fragment = document.createRange().createContextualFragment(htmlContent);
    container.appendChild(fragment);

    // Find all scripts in the injected HTML
    const scripts = Array.from(container.querySelectorAll('script'));
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      // Copy all attributes from the original script to the new one
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;

      // If the script is external, handle its load event to trigger SDK processing
      if (oldScript.src) {
        newScript.onload = () => {
          if (window.instgrm) window.instgrm.Embeds.process();
          if (window.twttr) window.twttr.widgets.load();
          // TikTok's embed script might not have a global object, but rendering is often automatic
        };
      }
      
      // Replace the old script with the new one, which will cause it to execute
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

  }, [container, htmlContent]);

  return <div ref={setContainer} className="w-full h-full flex items-center justify-center" />;
};


/**
 * A "Shorts-style" video player that fetches oEmbed content for a given URL
 * and displays it in a vertical, 9:16 aspect ratio container.
 */
const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError("No URL provided.");
      return;
    }

    const fetchEmbed = async () => {
      setLoading(true);
      setError(null);
      setEmbedHtml(null);

      try {
        // Use our 'fetch-content-info' edge function to securely get oEmbed data.
        // This avoids CORS issues and keeps any potential API keys off the client.
        const { data, error: functionError } = await supabase.functions.invoke('fetch-content-info', {
          body: { url },
        });

        if (functionError) {
          throw new Error(functionError.message);
        }
        
        if (data?.html) {
          setEmbedHtml(data.html);
        } else {
          throw new Error("Could not generate video embed. The URL might be private, invalid, or from an unsupported platform.");
        }

      } catch (e: any) {
        setError(e.message || "Failed to load video.");
        console.error("Video player error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchEmbed();
  }, [url]);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-lg">
      {loading && <Skeleton className="w-full h-full bg-neutral-800" />}
      {error && !loading &&
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-white bg-neutral-900">
          <p className="font-semibold">Unable to Load Video</p>
          <p className="text-xs text-muted-foreground mt-1 px-4">{error}</p>
        </div>
      }
      {embedHtml && !loading &&
        // The key forces a re-mount when the URL changes, ensuring the embed script re-runs correctly
        <SafeEmbedRenderer key={url} htmlContent={embedHtml} />
      }
    </div>
  );
};

export default VideoPlayer;
