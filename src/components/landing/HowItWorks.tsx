import { motion } from 'framer-motion';
import { Link2, Video, BarChart3, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: 'Connect Account',
    description: 'Link your TikTok, LinkedIn, YouTube, or Instagram account securely via OAuth.',
  },
  {
    icon: Video,
    title: 'Submit Content',
    description: 'Join campaigns and submit your content URLs. We validate everything automatically.',
  },
  {
    icon: BarChart3,
    title: 'Track Performance',
    description: 'Watch your views and engagement grow. Metrics are tracked and updated in real-time.',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    description: 'Compete on leaderboards or earn via CPM. Get paid based on real performance.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From signup to payout in four simple steps
          </p>
        </motion.div>

        <div className="relative">
         
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>

                  <h3 className="text-xl font-semibold text-center mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-center text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
