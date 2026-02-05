import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const LinkedInCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) return navigate("/dashboard");

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setTimeout(handleLinkedInCallback, 500);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-connect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ code }),
        }
      );

      if (response.ok) {
        navigate("/dashboard?linkedin_connected=true");
      } else {
        console.error(await response.text());
        navigate("/dashboard?linkedin_error=true");
      }
    };

    handleLinkedInCallback();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Connecting to LinkedIn...</p>
    </div>
  );
};

export default LinkedInCallback;
