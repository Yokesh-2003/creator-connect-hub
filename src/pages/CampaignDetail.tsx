import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Campaign, Submission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Leaderboard from '@/components/content/Leaderboard';
import SubmitBar from '@/components/content/SubmitBar';
import CreatorContentFetcher from '@/components/content/CreatorContentFetcher';
import VideoPlayer from '@/components/content/VideoPlayer';

export default function CampaignDetail() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);

    const loadCampaignData = useCallback(async () => {
        if (!id) {
          setLoading(false);
          return;
        }
        setLoading(true);
    
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();
    
        if (campaignError || !campaignData) {
          console.error(campaignError?.message || 'Campaign not found.');
          setCampaign(null);
          setLoading(false);
          return;
        }
        setCampaign(campaignData);
    
        const { data: submissionData, error: submissionError } = await supabase
          .rpc('get_campaign_submissions', { campaign_id_param: id });

    
        if (submissionError) {
          console.error('Could not load submissions:', submissionError);
          setSubmissions([]);
        } else if (submissionData) {
          setSubmissions(submissionData as Submission[]);
        }
    
        setLoading(false);
      }, [id]);

    useEffect(() => {
        loadCampaignData();
    }, [loadCampaignData]);

    const handleNewSubmission = (newSubmission: Submission) => {
      setSubmissions(prevSubmissions => [
        ...prevSubmissions,
        {
          ...newSubmission,
        }
      ]);
      loadCampaignData();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!campaign) {
        return <div>Campaign not found.</div>;
    }

    const { platform } = campaign;

    return (
        <div className="container mx-auto p-4">
            <Card className="mb-4">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{campaign.name}</CardTitle>
                        <Badge>{platform}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>

            <CreatorContentFetcher
              platform={platform}>
              {(contentFetcherState) => (
                <SubmitBar
                  campaignId={id!}
                  platform={platform}
                  onNewSubmission={handleNewSubmission}
                  contentFetcher={contentFetcherState}
                />
              )}
            </CreatorContentFetcher>
            
            <Separator className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Submissions</h2>
                {submissions.length > 0 ? (
                    <VideoPlayer 
                        submissions={submissions} 
                        currentIndex={currentSubmissionIndex} 
                        setCurrentIndex={setCurrentSubmissionIndex} 
                    />
                ) : (
                    <p>No submissions yet. Be the first!</p>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                <Leaderboard submissions={submissions} />
              </div>
            </div>
        </div>
    );
}
