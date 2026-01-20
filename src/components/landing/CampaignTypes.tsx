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
          {/* Leaderboard Contest */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-card rounded-3xl p-8 border border-border overflow-hidden group hover:border-warning/50 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-warning/10 rounded-full blur-3xl group-hover:bg-warning/20 transition-all" />
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-warning" />
              </div>

              <h3 className="text-2xl font-bold mb-3">Leaderboard Contest</h3>
              <p className="text-muted-foreground mb-6">
                Compete against other creators for prize pools. Top performers based on views and engagement win cash prizes.
              </p>

              <ul className="space-y-3 mb-8">
                {['Fixed prize pools', 'View-based rankings', 'Weekly/monthly contests', 'Bonus achievements'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-success" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full group/btn" asChild>
                <Link to="/campaigns?type=leaderboard">
                  View Contests
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* CPM Campaign */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-card rounded-3xl p-8 border border-border overflow-hidden group hover:border-success/50 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-success/10 rounded-full blur-3xl group-hover:bg-success/20 transition-all" />
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-success" />
              </div>

              <h3 className="text-2xl font-bold mb-3">CPM Campaign</h3>
              <p className="text-muted-foreground mb-6">
                Get paid per 1,000 views your content generates. The more views you get, the more you earn. Simple.
              </p>

              <ul className="space-y-3 mb-8">
                {['Earn per 1K views', 'No competition needed', 'Predictable earnings', 'Unlimited potential'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-success" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="default" className="w-full group/btn" asChild>
                <Link to="/campaigns?type=cpm">
                  View CPM Campaigns
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
