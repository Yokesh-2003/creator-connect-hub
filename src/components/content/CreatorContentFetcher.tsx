
import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';

const CreatorContentFetcher = ({ campaignId, onContentFetched, onManualSubmit }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-creator-content', {
          body: { campaignId },
        });

        if (error) {
          throw error;
        }

        onContentFetched(data.content);
      } catch (err) {
        console.error("Content fetch error:", err);
        setError("Could not automatically fetch content. Please submit a URL manually.");
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchContent();
    }
  }, [campaignId]);

  const handleManualSubmit = () => {
      onManualSubmit(manualUrl);
  }

  if (loading) {
    return <div>Loading your content...</div>;
  }

  if (error) {
    return (
        <div className="text-center p-4 border-dashed border-2 border-gray-300 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <div className="flex justify-center">
                <input 
                    type="text" 
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="Enter post URL (TikTok or LinkedIn)"
                    className="p-2 border rounded-l-md w-full max-w-md"
                />
                <button 
                    onClick={handleManualSubmit}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md"
                >
                    Submit
                </button>
            </div>
        </div>
    );
  }

  return null; // Content is handled by the parent component
};

export default CreatorContentFetcher;
