import { BrandTiktok, BrandLinkedin } from 'tabler-icons-react';

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  switch (platform.toLowerCase()) {
    case 'tiktok':
      return <BrandTiktok className={className} />;
    case 'linkedin':
      return <BrandLinkedin className={className} />;
    default:
      return null;
  }
}
