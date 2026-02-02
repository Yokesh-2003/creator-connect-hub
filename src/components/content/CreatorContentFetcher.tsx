import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';

const CreatorContentFetcher = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-creator-content');

        if (error) {
          throw error;
        }

        setContent(data.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return <div>Loading content...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Your Content</h2>
      <ul>
        {content.map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.platform}: {item.title || item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreatorContentFetcher;
