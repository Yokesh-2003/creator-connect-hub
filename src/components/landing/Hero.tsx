import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />

      <div className="container relative z-10 flex flex-col items-center justify-center min-h-screen py-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary-foreground/90">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Performance-Driven Creator Marketing
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-center text-primary-foreground mb-6 tracking-tight"
        >
          Game of{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Creators
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-primary-foreground/70 text-center max-w-3xl mb-12"
        >
          Collaborate with hundreds of creators. Pay based on real engagement — views, impressions, and performance. Not follower count.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/auth">
              Start Creating
              <Play className="w-5 h-5 ml-1" />
            </Link>
          </Button>
          <Button variant="heroOutline" size="xl" asChild>
            <Link to="/campaigns">
              Browse Campaigns
            </Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16"
        >
          {[
            { icon: Users, value: '10K+', label: 'Creators' },
            { icon: Play, value: '50M+', label: 'Total Views' },
            { icon: TrendingUp, value: '89%', label: 'Avg. Growth' },
            { icon: DollarSign, value: '$2M+', label: 'Paid Out' },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl glass flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-primary-foreground/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-primary rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
