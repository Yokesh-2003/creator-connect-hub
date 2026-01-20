import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaTiktok, FaLinkedin } from 'react-icons/fa';
import { Trophy, DollarSign, Calendar, Users, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

const mockCampaigns = [
  {
    id: '1',
    title: 'TikTok Holiday Challenge',
    platform: 'tiktok',
    type: 'leaderboard',
    budget: 5000,
    participants: 234,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    description: 'Create engaging holiday content and compete for prizes!',
  },
  {
    id: '2',
    title: 'LinkedIn B2B Creator Program',
    platform: 'linkedin',
    type: 'cpm',
    cpmRate: 12,
    participants: 89,
    startDate: '2024-12-15',
    endDate: '2025-01-15',
    description: 'Share industry insights and earn $12 per 1000 impressions.',
  },
  {
    id: '3',
    title: 'TikTok Product Launch',
    platform: 'tiktok',
    type: 'cpm',
    cpmRate: 8,
    participants: 156,
    startDate: '2024-12-10',
    endDate: '2025-01-10',
    description: 'Showcase our new product launch with creative videos.',
  },
];

const platformIcons: Record<string, typeof FaTiktok> = {
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
};

const platformColors: Record<string, string> = {
  tiktok: 'from-[#ff0050] to-[#00f2ea]',
  linkedin: 'from-[#0077b5] to-[#00a0dc]',
};

export default function Campaigns() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Active Campaigns</h1>
          <p className="text-xl text-muted-foreground">Join campaigns and start earning based on your performance</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCampaigns.map((campaign, index) => {
            const Icon = platformIcons[campaign.platform];
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platformColors[campaign.platform]} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.type === 'leaderboard' 
                          ? 'bg-warning/20 text-warning' 
                          : 'bg-success/20 text-success'
                      }`}>
                        {campaign.type === 'leaderboard' ? (
                          <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> Contest</span>
                        ) : (
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> CPM</span>
                        )}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{campaign.description}</p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{campaign.participants} creators joined</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="text-success">
                          {campaign.type === 'leaderboard' 
                            ? `$${campaign.budget} Prize Pool` 
                            : `$${campaign.cpmRate} per 1K views`}
                        </span>
                      </div>
                    </div>

                    <Button className="w-full group/btn">
                      Join Campaign
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
