import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { handleTikTokCallback } from "@/lib/oauth/tiktok";
import { handleLinkedInCallback } from "@/lib/oauth/linkedin";
import { useToast } from "@/hooks/use-toast";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        toast({
          title: "Authorization failed",
          description: errorDescription || error,
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (!code || !state) {
        toast({
          title: "Invalid callback",
          description: "Missing authorization parameters",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      try {
        let result;
        let platformName;

        // Detect provider from the URL path
        if (location.pathname.includes("linkedin")) {
          platformName = "LinkedIn";
          result = await handleLinkedInCallback(code, state);
        } else if (location.pathname.includes("tiktok")) {
          platformName = "TikTok";
          result = await handleTikTokCallback(code, state);
        } else {
          throw new Error("Unknown OAuth provider");
        }

// ✅ TRUST ONLY success FLAG
if (result?.success === true) {
  toast({
    title: `${platformName} connected`,
    description: "Your account has been successfully linked.",
  });
} 

      } catch (err) {
        console.error("OAuth error:", err);
        toast({
          title: "OAuth error",
          description: err instanceof Error ? err.message : "Something went wrong",
          variant: "destructive",
        });
      }

      navigate("/dashboard", { replace: true });
    };

    run();
  }, [searchParams, location.pathname, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Connecting your account...</p>
      </div>
    </div>
  );
}
