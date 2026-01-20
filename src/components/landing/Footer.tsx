import { Link } from 'react-router-dom';
import { FaTiktok, FaLinkedin, FaYoutube, FaInstagram, FaTwitter } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">G</span>
              </div>
              <span className="text-xl font-bold">Game of Creators</span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-6">
              The performance-driven creator marketing platform where real engagement drives real rewards.
            </p>
            <div className="flex gap-4">
              {[FaTiktok, FaLinkedin, FaYoutube, FaInstagram, FaTwitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Creators</h4>
            <ul className="space-y-3">
              {['Join Campaign', 'How It Works', 'Leaderboard', 'FAQs'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Brands</h4>
            <ul className="space-y-3">
              {['Create Campaign', 'Pricing', 'Case Studies', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Game of Creators. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
