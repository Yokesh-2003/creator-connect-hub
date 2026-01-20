import { Hero } from '@/components/landing/Hero';
import { Platforms } from '@/components/landing/Platforms';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CampaignTypes } from '@/components/landing/CampaignTypes';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/layout/Navbar';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Platforms />
      <HowItWorks />
      <CampaignTypes />
      <Footer />
    </div>
  );
};

export default Index;
