import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Campaign, Submission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Leaderboard from '@/components/content/Leaderboard';
import SubmitBar from '@/components/content/SubmitBar';
import VideoPlayer from '@/components/content/VideoPlayer';

export default function CampaignDetail() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);

    const loadData = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const [campaignResult, submissionsResult] = await Promise.all([
            supabase.from('campaigns').select('*').eq('id', id).single(),
            supabase.rpc('get_campaign_submissions', { campaign_id_param: id })
        ]);

        const { data: campaignData, error: campaignError } = campaignResult;
        if (campaignError || !campaignData) {
          console.error(campaignError?.message || 'Campaign not found.');
          setCampaign(null);
        } else {
          setCampaign(campaignData);
        }

        const { data: submissionData, error: submissionError } = submissionsResult;
        if (submissionError) {
            console.error('Error fetching submissions:', submissionError);
            setSubmissions([]);
        } else {
            setSubmissions(submissionData || []);
            if (submissionData && submissionData.length > 0) {
                setCurrentSubmissionIndex(0);
            }
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleNewSubmission = () => {
      loadData();
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

            <SubmitBar
              campaignId={id!}
              platform={platform}
              onNewSubmission={handleNewSubmission}
            />
            
            <Separator className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Submissions</h2>
                <VideoPlayer 
                    submissions={submissions} 
                    currentIndex={currentSubmissionIndex} 
                    setCurrentIndex={setCurrentSubmissionIndex} 
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                <Leaderboard submissions={submissions} onSelectSubmission={setCurrentSubmissionIndex} />
              </div>
            </div>
        </div>
    );
}
