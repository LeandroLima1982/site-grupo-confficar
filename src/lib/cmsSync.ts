import { BannerItem, FleetItem, InstitutionalContent, ServiceItem, SiteLogos, TestimonialItem, SEOSettings } from '../types';

export interface CMSBackupData {
  version: string;
  timestamp: string;
  logos: SiteLogos;
  institutional: InstitutionalContent;
  banners: BannerItem[];
  services: ServiceItem[];
  fleet: FleetItem[];
  testimonials: TestimonialItem[];
  seo: SEOSettings;
}

export function downloadCMSBackup(data: Omit<CMSBackupData, 'version' | 'timestamp'>) {
  const fullBackup: CMSBackupData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ...data,
  };

  const jsonString = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `confficar_cms_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateInitialDataTSContent(data: Omit<CMSBackupData, 'version' | 'timestamp'>): string {
  return `import { BannerItem, FleetItem, InstitutionalContent, ServiceItem, SiteLogos, TestimonialItem, SEOSettings } from '../types';

export const ASSET_IMAGES = {
  logoHeader: ${JSON.stringify(data.logos.logoHeader)},
  logoSidebar: ${JSON.stringify(data.logos.logoSidebar)},
  logoLogin: ${JSON.stringify(data.logos.logoLogin)},
  logoFooter: ${JSON.stringify(data.logos.logoFooter)},
  heroBg: ${JSON.stringify(data.institutional.heroBgImage)},
  loginBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGUKJXQMqXfMCnyFj2t5hGy4Irg3HiFmvqTHjEpVLiLaex7P0k_PI8RCthREeL-TTt9-g_rwPi-bY31e6L5H_Un3SlMFa5JjVS3Jjo8PIslchXU1kkGovw7g6SbN1qnhgBdS-1A2LgXqE58_l2eRrSyaR7Ryvy6dV9MKt9W33HwmYQVnp45OyuKXX-l1Fq_aMwbFCbg8kbYDEb0lXTozrfviHvsuSI0Uk9A7VIfyYa11Fbd2r0Y-p4',
};

export const INITIAL_LOGOS: SiteLogos = ${JSON.stringify(data.logos, null, 2)};

export const INITIAL_BANNERS: BannerItem[] = ${JSON.stringify(data.banners, null, 2)};

export const INITIAL_SERVICES: ServiceItem[] = ${JSON.stringify(data.services, null, 2)};

export const INITIAL_FLEET: FleetItem[] = ${JSON.stringify(data.fleet, null, 2)};

export const INITIAL_TESTIMONIALS: TestimonialItem[] = ${JSON.stringify(data.testimonials, null, 2)};

export const INITIAL_INSTITUTIONAL: InstitutionalContent = ${JSON.stringify(data.institutional, null, 2)};

export const INITIAL_SEO: SEOSettings = ${JSON.stringify(data.seo, null, 2)};
`;
}

export function downloadInitialDataTSFile(data: Omit<CMSBackupData, 'version' | 'timestamp'>) {
  const code = generateInitialDataTSContent(data);
  const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'initialData.ts';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
