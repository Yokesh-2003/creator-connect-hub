import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubmissionDialog } from '@/components/landing/SubmissionDialog';
import { supabase } from '@/integrations/supabase/client';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [searchParams] = useSearchParams();

  const type = searchParams.get('type'); 

  useEffect(() => {
    fetchCampaigns();
    fetchSocialAccounts();
  }, [type]);

  const fetchCampaigns = async () => {
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');

    if (type) {
      query = query.eq('type', type); 
    }

    const { data } = await query;
    setCampaigns(data || []);
  };

  const fetchSocialAccounts = async () => {
    const { data } = await supabase
      .from('creator_accounts')
      .select('*');

    setSocialAccounts(data || []);
  };

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-3xl font-bold">
        {type === 'cpm' ? 'CPM Campaigns' : 'Leaderboard Campaigns'}
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-lg">{campaign.title}</h2>
            <p className="text-sm text-muted-foreground">
              {campaign.description}
            </p>

            <SubmissionDialog
              campaignId={campaign.id}
              platform={campaign.platform}
              socialAccounts={socialAccounts}
              onSuccess={fetchCampaigns}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
