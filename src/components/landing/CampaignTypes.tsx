import { motion } from 'framer-motion';
import { Trophy, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CampaignTypes() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Two Ways to <span className="text-primary">Earn</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred earning model based on your content style
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* LEADERBOARD */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-card rounded-3xl p-8 border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-warning" />
            </div>

            <h3 className="text-2xl font-bold mb-3">Leaderboard Contest</h3>
            <p className="text-muted-foreground mb-6">
              Compete against creators. Top performers win prize pools.
            </p>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/campaigns?type=leaderboard">
                View Contests
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* CPM */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-card rounded-3xl p-8 border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mb-6">
              <DollarSign className="w-8 h-8 text-success" />
            </div>

            <h3 className="text-2xl font-bold mb-3">CPM Campaign</h3>
            <p className="text-muted-foreground mb-6">
              Earn per 1,000 views. No competition.
            </p>

            <Button className="w-full" asChild>
              <Link to="/campaigns?type=cpm">
                View CPM Campaigns
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
