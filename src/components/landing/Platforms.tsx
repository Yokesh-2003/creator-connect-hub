import { motion } from 'framer-motion';
import { FaTiktok, FaLinkedin, FaYoutube, FaInstagram } from 'react-icons/fa';

const platforms = [
  {
    name: 'TikTok',
    icon: FaTiktok,
    color: 'from-[#ff0050] to-[#00f2ea]',
    description: 'Short-form video campaigns with viral potential',
    metrics: ['Views', 'Likes', 'Shares'],
  },
  {
    name: 'LinkedIn',
    icon: FaLinkedin,
    color: 'from-[#0077b5] to-[#00a0dc]',
    description: 'Professional content for B2B audiences',
    metrics: ['Impressions', 'Likes', 'Comments'],
  },
  {
    name: 'YouTube',
    icon: FaYoutube,
    color: 'from-[#ff0000] to-[#ff4444]',
    description: 'Long-form video content with deep engagement',
    metrics: ['Views', 'Watch Time', 'Subscribers'],
  },
  {
    name: 'Instagram',
    icon: FaInstagram,
    color: 'from-[#f09433] via-[#dc2743] to-[#bc1888]',
    description: 'Visual storytelling through Reels and Posts',
    metrics: ['Views', 'Likes', 'Saves'],
  },
];

export function Platforms() {
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
            Multi-Platform <span className="text-primary">Campaigns</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Run performance-driven campaigns across all major social platforms
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <platform.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{platform.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{platform.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {platform.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
