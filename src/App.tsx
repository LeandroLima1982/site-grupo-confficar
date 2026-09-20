import React, { useState, useEffect, useRef } from 'react';
import { AdminCMSHub } from './components/AdminCMSHub';
import { LoginScreen } from './components/LoginScreen';
import { CMSLoginScreen } from './components/CMSLoginScreen';
import { PublicLanding } from './components/PublicLanding';
import { getLoggedCMSUser } from './lib/cmsAuth';
import { saveCMSDataToCloud, subscribeCMSDataFromCloud, loadCMSDataFromCloud, FirestoreCMSBundle } from './lib/firebase';
import { CloudinaryConfig, DEFAULT_CLOUDINARY_CONFIG } from './lib/cloudinary';
import {
  INITIAL_BANNERS,
  INITIAL_FLEET,
  INITIAL_INSTITUTIONAL,
  INITIAL_LOGOS,
  INITIAL_SEO,
  INITIAL_SERVICES,
  INITIAL_TESTIMONIALS,
} from './data/initialData';
import {
  AdminSection,
  BannerItem,
  FleetItem,
  InstitutionalContent,
  SEOSettings,
  ServiceItem,
  SiteLogos,
  TestimonialItem,
  UserRole,
  ViewMode,
} from './types';

const CACHE_KEYS = {
  logos: 'confficar_site_logos_v2',
  institutional: 'confficar_institutional_content_v2',
  banners: 'confficar_banners_data_v2',
  services: 'confficar_services_data_v2',
  fleet: 'confficar_fleet_data_v2',
  testimonials: 'confficar_testimonials_data_v2',
  seo: 'confficar_seo_settings_v2',
};

function readStorageCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage`, e);
  }
}

export function App() {
  // Navigation & Role states
  const [currentView, setCurrentView] = useState<ViewMode>('public');
  const [isCloudReady, setIsCloudReady] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('empresa');
  const [currentAdminSection, setCurrentAdminSection] = useState<AdminSection>('dashboard');

  // Cache dos últimos dados recebidos do Firestore (atualizado a cada visita).
  // Evita o flash do conteúdo padrão antigo na primeira renderização.
  const [logos, setLogos] = useState<SiteLogos>(() => readStorageCache(CACHE_KEYS.logos, INITIAL_LOGOS));
  const [institutional, setInstitutional] = useState<InstitutionalContent>(() =>
    readStorageCache(CACHE_KEYS.institutional, INITIAL_INSTITUTIONAL)
  );
  const [banners, setBanners] = useState<BannerItem[]>(() => readStorageCache(CACHE_KEYS.banners, INITIAL_BANNERS));
  const [services, setServices] = useState<ServiceItem[]>(() => readStorageCache(CACHE_KEYS.services, INITIAL_SERVICES));
  const [fleet, setFleet] = useState<FleetItem[]>(() => readStorageCache(CACHE_KEYS.fleet, INITIAL_FLEET));
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(() =>
    readStorageCache(CACHE_KEYS.testimonials, INITIAL_TESTIMONIALS)
  );
  const [seo, setSeo] = useState<SEOSettings>(() => readStorageCache(CACHE_KEYS.seo, INITIAL_SEO));
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(() =>
    readStorageCache('confficar_cloudinary_config', DEFAULT_CLOUDINARY_CONFIG)
  );

  // Firebase Firestore Realtime Subscription (Sincronização em Nuvem para todos os visitantes)
  useEffect(() => {
    const cloudReadyFallback = setTimeout(() => setIsCloudReady(true), 5000);

    // Seed initial bundle if database is fresh
    loadCMSDataFromCloud().then((cloudData) => {
      if (!cloudData) {
        saveCMSDataToCloud({
          logos,
          institutional,
          banners,
          services,
          fleet,
          testimonials,
          seo,
        });
      }
    });

    const unsubscribe = subscribeCMSDataFromCloud((cloudData) => {
      clearTimeout(cloudReadyFallback);
      setIsCloudReady(true);
      if (cloudData.logos) {
        setLogos(cloudData.logos);
        saveToStorage(CACHE_KEYS.logos, cloudData.logos);
      }
      if (cloudData.institutional) {
        setInstitutional(cloudData.institutional);
        saveToStorage(CACHE_KEYS.institutional, cloudData.institutional);
      }
      if (cloudData.banners) {
        setBanners(cloudData.banners);
        saveToStorage(CACHE_KEYS.banners, cloudData.banners);
      }
      if (cloudData.services) {
        setServices(cloudData.services);
        saveToStorage(CACHE_KEYS.services, cloudData.services);
      }
      if (cloudData.fleet) {
        setFleet(cloudData.fleet);
        saveToStorage(CACHE_KEYS.fleet, cloudData.fleet);
      }
      if (cloudData.testimonials) {
        setTestimonials(cloudData.testimonials);
        saveToStorage(CACHE_KEYS.testimonials, cloudData.testimonials);
      }
      if (cloudData.seo) {
        setSeo(cloudData.seo);
        saveToStorage(CACHE_KEYS.seo, cloudData.seo);
      }
      if (cloudData.cloudinaryConfig) {
        setCloudinaryConfig(cloudData.cloudinaryConfig);
        saveToStorage('confficar_cloudinary_config', cloudData.cloudinaryConfig);
      }
    });

    return () => {
      clearTimeout(cloudReadyFallback);
      unsubscribe();
    };
  }, []);

  // Handler functions that write to state, localStorage AND Firebase Cloud Firestore
  // Debounce (800ms) evita gastar a cota gratuita de escritas do Firestore salvando a cada tecla
  const cloudSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const persistToCloud = (bundle: Parameters<typeof saveCMSDataToCloud>[0]) => {
    const keys = Object.keys(bundle) as (keyof FirestoreCMSBundle)[];
    for (const key of keys) {
      if (key === 'updatedAt' || bundle[key] === undefined) continue;
      const timerKey = String(key);
      if (cloudSaveTimers.current[timerKey]) {
        clearTimeout(cloudSaveTimers.current[timerKey]);
      }
      cloudSaveTimers.current[timerKey] = setTimeout(() => {
        saveCMSDataToCloud({ [key]: bundle[key] } as Parameters<typeof saveCMSDataToCloud>[0]).then((result) => {
          if (!result.success) {
            alert(
              `ERRO ao publicar "${key}" no Firestore. As alterações NÃO foram salvas para os visitantes.\n\n${result.error || 'Erro desconhecido (veja o console F12)'}`
            );
          }
        });
      }, 800);
    }
  };

  const handleUpdateLogos = (newLogos: SiteLogos) => {
    setLogos(newLogos);
    saveToStorage(CACHE_KEYS.logos, newLogos);
    persistToCloud({ logos: newLogos });
  };

  const handleUpdateInstitutional = (newInst: InstitutionalContent) => {
    setInstitutional(newInst);
    saveToStorage(CACHE_KEYS.institutional, newInst);
    persistToCloud({ institutional: newInst });
  };

  const handleUpdateBanners = (newBanners: BannerItem[]) => {
    setBanners(newBanners);
    saveToStorage(CACHE_KEYS.banners, newBanners);
    persistToCloud({ banners: newBanners });
  };

  const handleUpdateServices = (newServices: ServiceItem[]) => {
    setServices(newServices);
    saveToStorage(CACHE_KEYS.services, newServices);
    persistToCloud({ services: newServices });
  };

  const handleUpdateFleet = (newFleet: FleetItem[]) => {
    setFleet(newFleet);
    saveToStorage(CACHE_KEYS.fleet, newFleet);
    persistToCloud({ fleet: newFleet });
  };

  const handleUpdateTestimonials = (newTestimonials: TestimonialItem[]) => {
    setTestimonials(newTestimonials);
    saveToStorage(CACHE_KEYS.testimonials, newTestimonials);
    persistToCloud({ testimonials: newTestimonials });
  };

  const handleUpdateSeo = (newSeo: SEOSettings) => {
    setSeo(newSeo);
    saveToStorage(CACHE_KEYS.seo, newSeo);
    persistToCloud({ seo: newSeo });
  };

  const handleUpdateCloudinaryConfig = (newConfig: CloudinaryConfig) => {
    setCloudinaryConfig(newConfig);
    saveToStorage('confficar_cloudinary_config', newConfig);
    persistToCloud({ cloudinaryConfig: newConfig });
  };

  const handleLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleCmsLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleLogout = () => {
    setCurrentView('public');
  };

  const loggedCmsUser = getLoggedCMSUser();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      {/* Screen 1: Public Landing Page */}
      {currentView === 'public' && (
        !isCloudReady ? (
          <div className="min-h-screen bg-[#050b14] flex items-center justify-center text-slate-300">
            <div className="flex flex-col items-center gap-5">
              <img
                src={logos.logoLoading || logos.logoHeader || '/favicon.png'}
                alt="Confficar"
                className="w-28 h-28 object-contain"
              />
              <div className="w-32 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-gold-400 animate-[loading-bar_1.2s_ease-in-out_infinite]" />
              </div>
              <span className="text-xs font-semibold tracking-wide">Carregando conteúdo atualizado...</span>
            </div>
          </div>
        ) : (
          <PublicLanding
            logos={logos}
            institutional={institutional}
            services={services}
            fleet={fleet}
            testimonials={testimonials}
            seo={seo}
            onViewChange={setCurrentView}
          />
        )
      )}

      {/* Screen 2: Login Screen (Sistemas / Operacional) */}
      {currentView === 'login' && (
        <LoginScreen
          logos={logos}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          onLoginSuccess={handleLoginSuccess}
          onViewChange={setCurrentView}
        />
      )}

      {/* Screen 3 & 4: CMS Login Screen + Admin CMS Panel Hub (Requires CMS User Authentication) */}
      {(currentView === 'cms-login' || currentView === 'admin') && (
        !loggedCmsUser ? (
          <CMSLoginScreen
            logos={logos}
            onLoginSuccess={handleCmsLoginSuccess}
            onViewChange={setCurrentView}
          />
        ) : (
          <AdminCMSHub
            logos={logos}
            onUpdateLogos={handleUpdateLogos}
            currentSection={currentAdminSection}
            onSectionChange={setCurrentAdminSection}
            activeRole={activeRole}
            institutional={institutional}
            onUpdateInstitutional={handleUpdateInstitutional}
            banners={banners}
            onUpdateBanners={handleUpdateBanners}
            services={services}
            onUpdateServices={handleUpdateServices}
            fleet={fleet}
            onUpdateFleet={handleUpdateFleet}
            testimonials={testimonials}
            onUpdateTestimonials={handleUpdateTestimonials}
            seo={seo}
            onUpdateSEO={handleUpdateSeo}
            cloudinaryConfig={cloudinaryConfig}
            onUpdateCloudinaryConfig={handleUpdateCloudinaryConfig}
            onLogout={handleLogout}
            onViewChange={setCurrentView}
          />
        )
      )}
    </div>
  );
}

export default App;
