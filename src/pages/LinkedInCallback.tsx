
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const LinkedInCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("User not logged in");
            }
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-connect`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ code }),
            }
          );

          if (response.ok) {
            // Handle successful authentication, e.g., update user context, redirect
            navigate("/dashboard?linkedin_connected=true");
          } else {
            // Handle errors
            console.error("LinkedIn OAuth failed:", await response.text());
            navigate("/dashboard?linkedin_error=true");
          }
        } catch (error) {
          console.error("Error during LinkedIn OAuth:", error);
          navigate("/dashboard?linkedin_error=true");
        }
      } else {
        // Handle cases where code is not present
        console.error("No LinkedIn authorization code found.");
        navigate("/dashboard");
      }
    };

    handleLinkedInCallback();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Connecting to LinkedIn...</p>
    </div>
  );
};

export default LinkedInCallback;
