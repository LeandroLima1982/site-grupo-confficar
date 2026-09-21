import React, { useState, useEffect, useRef } from 'react';
import { ASSET_IMAGES, INITIAL_SEO } from '../data/initialData';
import { SEOManager } from './SEOManager';
import { CloudinarySettings } from './CloudinarySettings';
import { UserManagement } from './UserManagement';
import { uploadImageToCloudinary, CloudinaryConfig } from '../lib/cloudinary';
import { getLoggedCMSUser, logoutCMSUser } from '../lib/cmsAuth';
import { downloadCMSBackup, downloadInitialDataTSFile, generateInitialDataTSContent } from '../lib/cmsSync';
import {
  AboutSlideItem,
  AdminSection,
  BannerItem,
  FleetItem,
  HeroSlideItem,
  InstitutionalContent,
  SEOSettings,
  ServiceItem,
  SiteLogos,
  TestimonialItem,
  UserRole,
  ViewMode,
} from '../types';

interface AdminCMSHubProps {
  logos?: SiteLogos;
  onUpdateLogos?: (logos: SiteLogos) => void;
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  activeRole: UserRole;
  institutional: InstitutionalContent;
  onUpdateInstitutional: (inst: InstitutionalContent) => void;
  banners: BannerItem[];
  onUpdateBanners: (banners: BannerItem[]) => void;
  services: ServiceItem[];
  onUpdateServices: (services: ServiceItem[]) => void;
  fleet: FleetItem[];
  onUpdateFleet: (fleet: FleetItem[]) => void;
  testimonials: TestimonialItem[];
  onUpdateTestimonials: (testimonials: TestimonialItem[]) => void;
  seo?: SEOSettings;
  onUpdateSEO?: (seo: SEOSettings) => void;
  cloudinaryConfig?: CloudinaryConfig;
  onUpdateCloudinaryConfig?: (config: CloudinaryConfig) => void;
  onLogout: () => void;
  onViewChange: (view: ViewMode) => void;
}

type CtaPreviewDevice = 'monitor' | 'notebook' | 'tablet' | 'mobile';
type CtaPositionField = 'Desktop' | 'Tablet' | 'Mobile';

const CTA_PREVIEW_DEVICES: {
  id: CtaPreviewDevice;
  label: string;
  field: CtaPositionField;
  aspect: string;
}[] = [
  { id: 'monitor', label: 'Monitor grande', field: 'Desktop', aspect: '16 / 7' },
  { id: 'notebook', label: 'Notebook', field: 'Desktop', aspect: '16 / 9' },
  { id: 'tablet', label: 'Tablet', field: 'Tablet', aspect: '4 / 3' },
  { id: 'mobile', label: 'Celular', field: 'Mobile', aspect: '9 / 16' },
];

const getCtaAnchor = (position: HeroSlideItem['ctaPosition'] = 'bottom-left') => {
  const [vertical, horizontal] = position.split('-');
  return {
    x: horizontal === 'center' ? 50 : horizontal === 'right' ? 93 : 7,
    y: vertical === 'top' ? 20 : vertical === 'center' ? 50 : 82,
    translateX: horizontal === 'center' ? '-50%' : horizontal === 'right' ? '-100%' : '0%',
    translateY: vertical === 'center' ? '-50%' : vertical === 'bottom' ? '-100%' : '0%',
  };
};

const getCtaPercentKey = (device: CtaPositionField, axis: 'X' | 'Y') =>
  `ctaOffset${axis}${device}Percent` as keyof HeroSlideItem;

const getCtaPercent = (slide: HeroSlideItem, device: CtaPositionField, axis: 'X' | 'Y') => {
  const key = getCtaPercentKey(device, axis);
  const value = slide[key];
  if (typeof value === 'number') return value;
  const legacyKey = `ctaOffset${axis}${device}` as keyof HeroSlideItem;
  const legacyValue = slide[legacyKey];
  if (typeof legacyValue !== 'number') return 0;
  const designSize = axis === 'X' ? 1280 : device === 'Desktop' ? 680 : device === 'Tablet' ? 580 : 520;
  return Math.round((legacyValue / designSize) * 100);
};

const getCtaPreviewImage = (slide: HeroSlideItem, device: CtaPositionField) => {
  if (device === 'Mobile') return slide.mobileDark || slide.desktopDark;
  if (device === 'Tablet') return slide.tabletDark || slide.desktopDark;
  return slide.desktopDark;
};

interface HeroCtaResponsivePreviewProps {
  slide: HeroSlideItem;
  onUpdate: (field: keyof HeroSlideItem, value: any) => void;
}

const HeroCtaResponsivePreview: React.FC<HeroCtaResponsivePreviewProps> = ({ slide, onUpdate }) => {
  const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{
    canvasId: CtaPreviewDevice;
    device: CtaPositionField;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const clamp = (value: number) => Math.max(-45, Math.min(45, Math.round(value)));

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, canvasId: CtaPreviewDevice, device: CtaPositionField) => {
    const canvas = canvasRefs.current[canvasId];
    if (!canvas) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      canvasId,
      device,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: getCtaPercent(slide, device, 'X'),
      startOffsetY: getCtaPercent(slide, device, 'Y'),
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>, canvasId: CtaPreviewDevice, device: CtaPositionField) => {
    if (!dragRef.current || dragRef.current.canvasId !== canvasId) return;
    const canvas = canvasRefs.current[canvasId];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const deltaX = ((event.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - dragRef.current.startY) / rect.height) * 100;
    onUpdate(getCtaPercentKey(device, 'X'), clamp(dragRef.current.startOffsetX + deltaX));
    onUpdate(getCtaPercentKey(device, 'Y'), clamp(dragRef.current.startOffsetY + deltaY));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-600">Prévia responsiva</span>
        <span className="text-[9px] text-slate-500">Arraste o botão para reposicionar</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CTA_PREVIEW_DEVICES.map((preview) => {
          const anchor = getCtaAnchor(slide.ctaPosition || 'bottom-left');
          const left = anchor.x + getCtaPercent(slide, preview.field, 'X');
          const top = anchor.y + getCtaPercent(slide, preview.field, 'Y');
          const image = getCtaPreviewImage(slide, preview.field);
          return (
            <div key={preview.id} className="space-y-1">
              <div
                ref={(element) => {
                  canvasRefs.current[preview.id] = element;
                }}
                className="relative overflow-hidden rounded-lg border border-slate-300 bg-slate-900"
                style={{ aspectRatio: preview.aspect }}
              >
                {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" draggable={false} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
                <div className="pointer-events-none absolute inset-[7%] rounded border border-dashed border-white/35" />
                {slide.ctaEnabled !== false ? (
                  <button
                    type="button"
                    onPointerDown={(event) => handlePointerDown(event, preview.id, preview.field)}
                    onPointerMove={(event) => handlePointerMove(event, preview.id, preview.field)}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="absolute z-10 max-w-[90%] cursor-grab touch-none rounded-md bg-gradient-to-r from-[#0A0A0A] to-gold-600 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-white shadow-lg active:cursor-grabbing"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      transform: `translate(${anchor.translateX}, ${anchor.translateY})`,
                    }}
                  >
                    {slide.ctaText || 'Solicitar Orçamento'}
                  </button>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/70">CTA desativado</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span>{preview.label}</span>
                <span>{Math.round(left)}% / {Math.round(top)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminCMSHub: React.FC<AdminCMSHubProps> = ({
  logos,
  onUpdateLogos,
  currentSection,
  onSectionChange,
  activeRole,
  institutional,
  onUpdateInstitutional,
  banners,
  onUpdateBanners,
  services,
  onUpdateServices,
  fleet,
  onUpdateFleet,
  testimonials,
  onUpdateTestimonials,
  seo,
  onUpdateSEO,
  cloudinaryConfig,
  onUpdateCloudinaryConfig,
  onLogout,
  onViewChange,
}) => {
  // Local states for editing forms
  const [heroForm, setHeroForm] = useState<InstitutionalContent>(institutional);

  // Helper functions for Hero and About slides defaults
  const isDefaultOrUnsplashUrl = (url?: string) => {
    if (!url) return true;
    return url.includes('images.unsplash.com') || url.includes('lh3.googleusercontent.com');
  };

  const getAboutSlides = (form: InstitutionalContent = heroForm): AboutSlideItem[] => {
    if (form.aboutSlides && form.aboutSlides.length > 0) {
      return form.aboutSlides;
    }
    return [
      {
        id: 'abs1',
        url: ASSET_IMAGES.bannerTransfer,
        title: '15+ Anos de Atuação',
        subtitle: 'Atendimento nacional para grandes corporações',
        active: true,
      },
      {
        id: 'abs2',
        url: ASSET_IMAGES.bannerBlindada,
        title: 'Frota Blindada & Executiva',
        subtitle: 'Veículos com alto nível de certificação e discrição',
        active: true,
      },
      {
        id: 'abs3',
        url: ASSET_IMAGES.heroBg,
        title: 'Logística de Elite VIP',
        subtitle: 'Motoristas bilíngues e pontualidade rigorosa',
        active: true,
      },
    ];
  };

  const getHeroSlides = (form: InstitutionalContent = heroForm): HeroSlideItem[] => {
    if (form.heroSlides && form.heroSlides.length > 0) {
      return form.heroSlides;
    }
    return [
      {
        id: 'hs1',
        tag: 'Líder em Transporte Executivo',
        titulo: 'Mobilidade Corporativa de Excelência.',
        subtitulo: 'Transporte executivo focado em pontualidade, discrição e segurança para sua empresa. Agende seu veículo com motorista bilíngue agora.',
        desktopDark: form.heroBgImage || ASSET_IMAGES.heroBg,
        desktopLight: form.heroBgImageLight || form.heroBgImage || ASSET_IMAGES.heroBg,
        tabletDark: form.heroBgImageTablet || form.heroBgImage || ASSET_IMAGES.heroBg,
        tabletLight: form.heroBgImageTabletLight || form.heroBgImageTablet || ASSET_IMAGES.heroBg,
        mobileDark: form.heroBgImageMobile || ASSET_IMAGES.heroBg,
        mobileLight: form.heroBgImageMobileLight || form.heroBgImageMobile || ASSET_IMAGES.heroBg,
        active: true,
      },
      {
        id: 'hs2',
        tag: 'Aeroportos & Transfers VIP',
        titulo: 'Traslados Ágeis e Monitoramento de Voos.',
        subtitulo: 'Receptivo corporativo exclusivo nos aeroportos GRU, CGH e VCP com motoristas trajados a rigor e acompanhamento em tempo real.',
        desktopDark: ASSET_IMAGES.bannerTransfer,
        desktopLight: ASSET_IMAGES.bannerTransfer,
        tabletDark: ASSET_IMAGES.bannerTransfer,
        tabletLight: ASSET_IMAGES.bannerTransfer,
        mobileDark: ASSET_IMAGES.bannerTransfer,
        mobileLight: ASSET_IMAGES.bannerTransfer,
        active: true,
      },
      {
        id: 'hs3',
        tag: 'Segurança & Blindagem Nível III-A',
        titulo: 'Frota Blindada para Máxima Proteção.',
        subtitulo: 'Protocolos rigorosos de segurança e condutores treinados em direção defensiva para transporte de autoridades e conselheiros.',
        desktopDark: ASSET_IMAGES.bannerBlindada,
        desktopLight: ASSET_IMAGES.bannerBlindada,
        tabletDark: ASSET_IMAGES.bannerBlindada,
        tabletLight: ASSET_IMAGES.bannerBlindada,
        mobileDark: ASSET_IMAGES.bannerBlindada,
        mobileLight: ASSET_IMAGES.bannerBlindada,
        active: true,
      },
    ];
  };

  const updateHeroForm = (updater: InstitutionalContent | ((prev: InstitutionalContent) => InstitutionalContent)) => {
    setHeroForm((prev) => {
      const newForm = typeof updater === 'function' ? updater(prev) : updater;
      const slides = newForm.heroSlides && newForm.heroSlides.length > 0
        ? newForm.heroSlides
        : (prev.heroSlides && prev.heroSlides.length > 0 ? prev.heroSlides : getHeroSlides(prev));
      const aboutSlidesList = newForm.aboutSlides && newForm.aboutSlides.length > 0
        ? newForm.aboutSlides
        : (prev.aboutSlides && prev.aboutSlides.length > 0 ? prev.aboutSlides : getAboutSlides(prev));

      const fullForm: InstitutionalContent = {
        ...newForm,
        heroSlides: slides,
        aboutSlides: aboutSlidesList,
      };

      if (onUpdateInstitutional) {
        onUpdateInstitutional(fullForm);
      }
      return fullForm;
    });
  };

  const updateCapaHeroField = (field: string, value: string) => {
    updateHeroForm((prev) => {
      // Preserve existing hero slides when updating the capa backgrounds.
      // Zapping slide images here made all slides fall back to the same capa
      // image, which visually stopped the slideshow rotation.
      const slides = prev.heroSlides && prev.heroSlides.length > 0
        ? prev.heroSlides
        : getHeroSlides(prev);
      return { ...prev, [field]: value, heroSlides: slides };
    });
  };
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [logoForm, setLogoForm] = useState<SiteLogos>(
    logos || {
      logoHeader: ASSET_IMAGES.logoHeader,
      logoSidebar: ASSET_IMAGES.logoSidebar,
      logoLogin: ASSET_IMAGES.logoLogin,
      logoFooter: ASSET_IMAGES.logoFooter,
      logoDark: '/logo-dark.png',
      logoLoading: '/favicon.png',
      logoTitle: 'Confficar',
      logoSubtitle: 'Mobilidade Corporativa',
    }
  );

  // Sync state when props update from Firestore
  useEffect(() => {
    if (institutional) {
      setHeroForm(institutional);
    }
  }, [institutional]);

  useEffect(() => {
    if (logos) {
      setLogoForm(logos);
    }
  }, [logos]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);
  const [syncNoticeMessage, setSyncNoticeMessage] = useState<string | null>(null);

  const getCurrentCMSBundle = () => ({
    logos: logoForm,
    institutional: heroForm,
    banners,
    services,
    fleet,
    testimonials: testimonialsList,
    seo: seo || INITIAL_SEO,
  });

  const handleExportBackup = () => {
    downloadCMSBackup(getCurrentCMSBundle());
    triggerSaveNotification();
  };

  const handleExportCodeTS = () => {
    downloadInitialDataTSFile(getCurrentCMSBundle());
    triggerSaveNotification();
  };

  const handleCopyCodeTS = () => {
    const code = generateInitialDataTSContent(getCurrentCMSBundle());
    navigator.clipboard.writeText(code);
    setCopySuccessMessage('Código do initialData.ts copiado com sucesso!');
    setTimeout(() => setCopySuccessMessage(null), 4000);
  };

  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.logos && onUpdateLogos) {
          setLogoForm(parsed.logos);
          onUpdateLogos(parsed.logos);
        }
        if (parsed.institutional) {
          setHeroForm(parsed.institutional);
          onUpdateInstitutional(parsed.institutional);
        }
        if (parsed.banners) onUpdateBanners(parsed.banners);
        if (parsed.services) onUpdateServices(parsed.services);
        if (parsed.fleet) onUpdateFleet(parsed.fleet);
        if (parsed.testimonials) onUpdateTestimonials(parsed.testimonials);
        if (parsed.seo && onUpdateSEO) onUpdateSEO(parsed.seo);

        setSyncNoticeMessage('Backup importado com sucesso! Os textos e conteúdos foram atualizados.');
        setTimeout(() => setSyncNoticeMessage(null), 5000);
      } catch (err) {
        alert('Erro ao ler o arquivo JSON de backup. Certifique-se de escolher um arquivo Vercel/CMS válido.');
      }
    };
    reader.readAsText(file);
  };

  // CMS Session & Auth RBAC
  const loggedCMSUser = getLoggedCMSUser();

  const isSectionAllowed = (sec: AdminSection): boolean => {
    if (!loggedCMSUser) return true;
    if (loggedCMSUser.isSuperAdmin) return true;
    return loggedCMSUser.allowedSections?.includes(sec) ?? false;
  };

  // Redirect if currentSection is not allowed for the logged in user
  useEffect(() => {
    if (loggedCMSUser && !loggedCMSUser.isSuperAdmin) {
      if (!isSectionAllowed(currentSection)) {
        const firstAllowed = loggedCMSUser.allowedSections?.[0] || 'dashboard';
        onSectionChange(firstAllowed);
      }
    }
  }, [currentSection, loggedCMSUser]);

  const handleCmsLogout = async () => {
    await logoutCMSUser();
    onLogout();
  };
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('confficar_admin_theme') || sessionStorage.getItem('confficar_admin_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const handleToggleTheme = (mode?: 'light' | 'dark') => {
    const newMode = mode || (themeMode === 'light' ? 'dark' : 'light');
    setThemeMode(newMode);
    try {
      localStorage.setItem('confficar_admin_theme', newMode);
      sessionStorage.setItem('confficar_admin_theme', newMode);
    } catch (err) {
      console.warn('Storage not available', err);
    }
  };

  const isDark = themeMode === 'dark';
  const cardBgClass = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const inputBgClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-gold-400'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#0A0A0A]';
  const modalBgClass = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl'
    : 'bg-white border-slate-200 text-slate-900 shadow-2xl';

  // Logo file upload & batch actions
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof SiteLogos
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadImageToCloudinary(file);
      const updated = { ...logoForm, [key]: res.url };
      setLogoForm(updated);
      if (onUpdateLogos) {
        onUpdateLogos(updated);
      }
      triggerSaveNotification();
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  const handleApplyAllLogos = (sourceKey: 'logoHeader' | 'logoSidebar' | 'logoLogin' | 'logoFooter') => {
    const sourceUrl = String(logoForm[sourceKey] || '');
    const updated: SiteLogos = {
      ...logoForm,
      logoHeader: sourceUrl,
      logoSidebar: sourceUrl,
      logoLogin: sourceUrl,
      logoFooter: sourceUrl,
    };
    setLogoForm(updated);
    if (onUpdateLogos) {
      onUpdateLogos(updated);
    }
    triggerSaveNotification();
  };

  const handleResetLogos = () => {
    const defaults: SiteLogos = {
      logoHeader: ASSET_IMAGES.logoHeader,
      logoSidebar: ASSET_IMAGES.logoSidebar,
      logoLogin: ASSET_IMAGES.logoLogin,
      logoFooter: ASSET_IMAGES.logoFooter,
      logoDark: '/logo-dark.png',
      logoLoading: '/favicon.png',
      logoTitle: 'Confficar',
      logoSubtitle: 'Mobilidade Corporativa',
    };
    setLogoForm(defaults);
    if (onUpdateLogos) {
      onUpdateLogos(defaults);
    }
    triggerSaveNotification();
  };

  // New Banner Modal / Edit
  const [editingBanner, setEditingBanner] = useState<Partial<BannerItem> | null>(null);

  // New Service Modal / Edit
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);

  // New Fleet Modal / Edit
  const [editingFleet, setEditingFleet] = useState<Partial<FleetItem> | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [fleetDiffInput, setFleetDiffInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('confficar_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved categories:', e);
    }
    return [
      'Sedan Executivo',
      'Sedan Blindado',
      'SUV Executivo',
      'Van Premium',
      'Transporte em Massa (Ônibus)',
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('confficar_custom_categories', JSON.stringify(customCategories));
    } catch (e) {
      console.error('Error saving custom categories:', e);
    }
  }, [customCategories]);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState<string>('');

  // Combined list of all vehicle categories
  const allCategories = Array.from(
    new Set([...customCategories, ...fleet.map((item) => item.categoria)])
  );

  // Rename a category and update all associated fleet vehicles
  const handleRenameCategory = (oldName: string, newNameInput: string) => {
    const newName = newNameInput.trim();
    if (!newName || oldName === newName) {
      setEditingCategoryOldName(null);
      return;
    }

    const updatedCategories = customCategories.map((c) => (c === oldName ? newName : c));
    if (!updatedCategories.includes(newName)) {
      updatedCategories.push(newName);
    }
    setCustomCategories(updatedCategories);

    const updatedFleet = fleet.map((f) =>
      f.categoria === oldName ? { ...f, categoria: newName } : f
    );
    onUpdateFleet(updatedFleet);

    if (selectedCategoryFilter === oldName) {
      setSelectedCategoryFilter(newName);
    }

    setEditingCategoryOldName(null);
    setEditingCategoryNewName('');
    triggerSaveNotification();
  };

  // Delete a category with vehicle reassignment if needed
  const handleDeleteCategory = (catName: string) => {
    const vehiclesInCat = fleet.filter((f) => f.categoria === catName);
    const remainingCategories = allCategories.filter((c) => c !== catName);
    const fallbackCat = remainingCategories[0] || 'Sedan Executivo';

    if (vehiclesInCat.length > 0) {
      const confirmMsg = `A categoria "${catName}" possui ${vehiclesInCat.length} veículo(s) cadastrado(s).\n\nAo excluir esta categoria, esses veículos serão reatribuídos automaticamente para "${fallbackCat}".\n\nDeseja confirmar a exclusão?`;
      if (!window.confirm(confirmMsg)) return;

      const updatedFleet = fleet.map((f) =>
        f.categoria === catName ? { ...f, categoria: fallbackCat } : f
      );
      onUpdateFleet(updatedFleet);
    } else {
      if (!window.confirm(`Tem certeza que deseja excluir a categoria "${catName}"?`)) return;
    }

    const updatedCategories = customCategories.filter((c) => c !== catName);
    setCustomCategories(updatedCategories);

    if (selectedCategoryFilter === catName) {
      setSelectedCategoryFilter('Todas');
    }

    triggerSaveNotification();
  };

  // Search in fleet or reservations
  const [searchTerm, setSearchTerm] = useState('');

  // Testimonials state, modal & drag-and-drop reordering
  const [testimonialsList, setTestimonialsList] = useState<TestimonialItem[]>(testimonials || []);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialItem> | null>(null);
  const [draggedTestimonialIndex, setDraggedTestimonialIndex] = useState<number | null>(null);
  const [dragOverTestimonialIndex, setDragOverTestimonialIndex] = useState<number | null>(null);

  useEffect(() => {
    if (testimonials) {
      setTestimonialsList(testimonials);
    }
  }, [testimonials]);

  const handleSaveHero = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateHeroForm((prev) => {
      const slides = getHeroSlides(prev);
      const aboutSlidesList = getAboutSlides(prev);
      return {
        ...prev,
        heroSlides: slides,
        aboutSlides: aboutSlidesList,
      };
    });
    triggerSaveNotification();
  };

  const handleUpdateAboutSlide = (id: string, field: keyof AboutSlideItem, value: any) => {
    updateHeroForm((prev) => {
      const currentList = getAboutSlides(prev);
      const updated = currentList.map((s) => (s.id === id ? { ...s, [field]: value } : s));
      return { ...prev, aboutSlides: updated };
    });
  };

  const handleAddAboutSlide = () => {
    updateHeroForm((prev) => {
      const currentList = getAboutSlides(prev);
      const newSlide: AboutSlideItem = {
        id: `abs_${Date.now()}`,
        url: ASSET_IMAGES.bannerTransfer,
        title: 'Novo Slide',
        subtitle: 'Descrição do slide',
        active: true,
      };
      const updated = [...currentList, newSlide];
      triggerSaveNotification();
      return { ...prev, aboutSlides: updated };
    });
  };

  const handleDeleteAboutSlide = (id: string) => {
    updateHeroForm((prev) => {
      const currentList = getAboutSlides(prev);
      if (currentList.length <= 1) {
        alert('É necessário ter pelo menos 1 slide na seção Sobre a Confficar.');
        return prev;
      }
      const updated = currentList.filter((s) => s.id !== id);
      triggerSaveNotification();
      return { ...prev, aboutSlides: updated };
    });
  };

  const handleMoveAboutSlide = (index: number, direction: 'up' | 'down') => {
    updateHeroForm((prev) => {
      const currentList = [...getAboutSlides(prev)];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      triggerSaveNotification();
      return { ...prev, aboutSlides: currentList };
    });
  };

  const handleUpdateHeroSlide = (id: string, field: keyof HeroSlideItem, value: any) => {
    updateHeroForm((prev) => {
      const currentList = getHeroSlides(prev);
      const updated = currentList.map((s) => {
        if (s.id !== id) return s;
        const newSlide = { ...s, [field]: value };

        // Se estiver atualizando a imagem Desktop Escuro (a principal do slide),
        // propaga automaticamente para telas que estavam vazias ou com imagens padrão/anteriores
        if (field === 'desktopDark') {
          const oldPrimary = s.desktopDark;
          const isFallback = (url?: string) => !url || url === oldPrimary || url === ASSET_IMAGES.heroBg;
          if (isFallback(s.desktopLight)) newSlide.desktopLight = value;
          if (isFallback(s.tabletDark)) newSlide.tabletDark = value;
          if (isFallback(s.tabletLight)) newSlide.tabletLight = value;
          if (isFallback(s.mobileDark)) newSlide.mobileDark = value;
          if (isFallback(s.mobileLight)) newSlide.mobileLight = value;
        }
        return newSlide;
      });
      return { ...prev, heroSlides: updated };
    });
  };

  const handleSyncSlideImageToAllVariants = (id: string) => {
    updateHeroForm((prev) => {
      const currentList = getHeroSlides(prev);
      const updated = currentList.map((s) => {
        if (s.id !== id) return s;
        const mainImage = s.desktopDark || s.desktopLight || s.mobileDark || ASSET_IMAGES.heroBg;
        return {
          ...s,
          desktopDark: mainImage,
          desktopLight: mainImage,
          tabletDark: mainImage,
          tabletLight: mainImage,
          mobileDark: mainImage,
          mobileLight: mainImage,
        };
      });
      triggerSaveNotification();
      return { ...prev, heroSlides: updated };
    });
  };

  const handleAddHeroSlide = () => {
    updateHeroForm((prev) => {
      const currentList = getHeroSlides(prev);
      if (currentList.length >= 10) {
        alert('O limite máximo recomendado é de 10 slides no carrossel Hero.');
        return prev;
      }
      const newSlide: HeroSlideItem = {
        id: `hs_${Date.now()}`,
        tag: 'Novo Destaque VIP',
        titulo: 'Título do Novo Slide Hero',
        subtitulo: 'Descrição curta dos diferenciais e vantagens deste serviço executivo.',
        desktopDark: prev.heroBgImage || ASSET_IMAGES.heroBg,
        desktopLight: prev.heroBgImageLight || prev.heroBgImage || ASSET_IMAGES.heroBg,
        tabletDark: prev.heroBgImageTablet || prev.heroBgImage || ASSET_IMAGES.heroBg,
        tabletLight: prev.heroBgImageTabletLight || prev.heroBgImageTablet || ASSET_IMAGES.heroBg,
        mobileDark: prev.heroBgImageMobile || ASSET_IMAGES.heroBg,
        mobileLight: prev.heroBgImageMobileLight || prev.heroBgImageMobile || ASSET_IMAGES.heroBg,
        active: true,
      };
      const updated = [...currentList, newSlide];
      triggerSaveNotification();
      return { ...prev, heroSlides: updated };
    });
  };

  const handleDeleteHeroSlide = (id: string) => {
    updateHeroForm((prev) => {
      const currentList = getHeroSlides(prev);
      if (currentList.length <= 1) {
        alert('É necessário manter pelo menos 1 slide no carrossel Hero.');
        return prev;
      }
      const updated = currentList.filter((s) => s.id !== id);
      triggerSaveNotification();
      return { ...prev, heroSlides: updated };
    });
  };

  const handleMoveHeroSlide = (index: number, direction: 'up' | 'down') => {
    updateHeroForm((prev) => {
      const currentList = [...getHeroSlides(prev)];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      triggerSaveNotification();
      return { ...prev, heroSlides: currentList };
    });
  };

  const triggerSaveNotification = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Toggle banner status
  const handleToggleBannerStatus = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, status: b.status === 'Ativo' ? ('Inativo' as const) : ('Ativo' as const) } : b
    );
    onUpdateBanners(updated);
  };

  // Delete banner
  const handleDeleteBanner = (id: string) => {
    onUpdateBanners(banners.filter((b) => b.id !== id));
  };

  // Save Banner (Add or Edit)
  const handleSaveBannerModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.titulo) return;

    if (editingBanner.id) {
      onUpdateBanners(
        banners.map((b) => (b.id === editingBanner.id ? ({ ...b, ...editingBanner } as BannerItem) : b))
      );
    } else {
      const newBanner: BannerItem = {
        id: `b_${Date.now()}`,
        titulo: editingBanner.titulo,
        status: editingBanner.status || 'Ativo',
        image: editingBanner.image || ASSET_IMAGES.bannerTransfer,
        desc: editingBanner.desc || 'Novo banner cadastrado no CMS.',
      };
      onUpdateBanners([newBanner, ...banners]);
    }
    setEditingBanner(null);
    triggerSaveNotification();
  };

  // Delete service
  const handleDeleteService = (id: string) => {
    onUpdateServices(services.filter((s) => s.id !== id));
  };

  // Save Service
  const handleSaveServiceModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.titulo) return;

    if (editingService.id) {
      onUpdateServices(
        services.map((s) =>
          s.id === editingService.id
            ? ({ ...s, ...editingService, ultimaEdicao: 'Hoje' } as ServiceItem)
            : s
        )
      );
    } else {
      const newServ: ServiceItem = {
        id: `s_${Date.now()}`,
        titulo: editingService.titulo,
        descricao: editingService.descricao || '',
        icon: editingService.icon || 'business_center',
        ultimaEdicao: 'Hoje',
        image: editingService.image || '',
      };
      onUpdateServices([...services, newServ]);
    }
    setEditingService(null);
    triggerSaveNotification();
  };

  // Delete Fleet
  const handleDeleteFleet = (id: string) => {
    onUpdateFleet(fleet.filter((f) => f.id !== id));
  };

  // Move fleet card up/down (reorder)
  const handleMoveFleet = (id: string, direction: 'up' | 'down') => {
    const index = fleet.findIndex((f) => f.id === id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fleet.length) return;

    const newList = [...fleet];
    const [movedItem] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, movedItem);
    onUpdateFleet(newList);
    triggerSaveNotification();
  };

  // Add fleet differential (attribute) chip
  const addFleetDiff = () => {
    const value = fleetDiffInput.trim();
    if (!value) return;
    setEditingFleet((prev) => {
      if (!prev) return prev;
      const current = prev.diferenciais || [];
      if (current.some((d) => d.toLowerCase() === value.toLowerCase())) {
        setFleetDiffInput('');
        return prev;
      }
      return { ...prev, diferenciais: [...current, value] };
    });
    setFleetDiffInput('');
  };

  // Save Fleet
  const handleSaveFleetModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFleet?.nome) return;

    const finalCategory = isCustomCategory
      ? customCategoryInput.trim() || 'Sedan Executivo'
      : editingFleet.categoria || allCategories[0] || 'Sedan Executivo';

    if (isCustomCategory && customCategoryInput.trim()) {
      if (!customCategories.includes(customCategoryInput.trim())) {
        setCustomCategories((prev) => [...prev, customCategoryInput.trim()]);
      }
    }

    if (editingFleet.id) {
      onUpdateFleet(
        fleet.map((f) =>
          f.id === editingFleet.id
            ? ({ ...f, ...editingFleet, categoria: finalCategory } as FleetItem)
            : f
        )
      );
    } else {
      const newFleetItem: FleetItem = {
        id: `f_${Date.now()}`,
        nome: editingFleet.nome,
        categoria: finalCategory,
        modeloSpecs: editingFleet.modeloSpecs || editingFleet.nome,
        descricao: editingFleet.descricao || '',
        passageiros: editingFleet.passageiros || '3 Passageiros',
        malas: editingFleet.malas || '3 Malas',
        diferenciais: editingFleet.diferenciais || ['Climatizado', 'Wi-Fi'],
        image: editingFleet.image || ASSET_IMAGES.corolla,
        disponivel: true,
        precoEstimadoBase: 400,
      };
      onUpdateFleet([...fleet, newFleetItem]);
    }
    setEditingFleet(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFleetDiffInput('');
    triggerSaveNotification();
  };

  // Reorder testimonial up/down
  const handleMoveTestimonial = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonialsList.length) return;

    const newList = [...testimonialsList];
    const [movedItem] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, movedItem);

    setTestimonialsList(newList);
    onUpdateTestimonials(newList);
    triggerSaveNotification();
  };

  // Testimonials drag & drop handlers
  const handleTestimonialDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTestimonialIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTestimonialDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTestimonialIndex === null || draggedTestimonialIndex === index) return;
    setDragOverTestimonialIndex(index);
  };

  const handleTestimonialDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTestimonialIndex === null || draggedTestimonialIndex === targetIndex) {
      setDraggedTestimonialIndex(null);
      setDragOverTestimonialIndex(null);
      return;
    }

    const newList = [...testimonialsList];
    const [movedItem] = newList.splice(draggedTestimonialIndex, 1);
    newList.splice(targetIndex, 0, movedItem);

    setTestimonialsList(newList);
    onUpdateTestimonials(newList);
    setDraggedTestimonialIndex(null);
    setDragOverTestimonialIndex(null);
    triggerSaveNotification();
  };

  // Inline edit field for testimonial
  const handleInlineTestimonialChange = (id: string, field: keyof TestimonialItem, value: any) => {
    const newList = testimonialsList.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    setTestimonialsList(newList);
  };

  // Save all testimonials
  const handleSaveAllTestimonials = () => {
    onUpdateTestimonials(testimonialsList);
    triggerSaveNotification();
  };

  // Save modal testimonial
  const handleSaveTestimonialModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial?.autor || !editingTestimonial?.texto) return;

    let newList: TestimonialItem[];
    if (editingTestimonial.id) {
      newList = testimonialsList.map((t) =>
        t.id === editingTestimonial.id ? ({ ...t, ...editingTestimonial } as TestimonialItem) : t
      );
    } else {
      const newItem: TestimonialItem = {
        id: `t_${Date.now()}`,
        autor: editingTestimonial.autor,
        cargo: editingTestimonial.cargo || 'Executivo',
        empresa: editingTestimonial.empresa || 'Empresa Parceira',
        texto: editingTestimonial.texto,
        foto: editingTestimonial.foto || '',
        rating: editingTestimonial.rating || 5,
      };
      newList = [...testimonialsList, newItem];
    }

    setTestimonialsList(newList);
    onUpdateTestimonials(newList);
    setEditingTestimonial(null);
    triggerSaveNotification();
  };

  // Delete testimonial
  const handleDeleteTestimonialItem = (id: string) => {
    const newList = testimonialsList.filter((t) => t.id !== id);
    setTestimonialsList(newList);
    onUpdateTestimonials(newList);
    triggerSaveNotification();
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans selection:bg-gold-500 selection:text-white transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SideNavBar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 lg:w-64 border-r flex flex-col py-4 px-4 shrink-0 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200'}`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Menu CMS</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mb-6 mt-1 lg:mt-2 px-2 flex items-center justify-center">
          <img
            src={
              isDark
                ? (logos?.logoDark || logoForm.logoDark || logos?.logoSidebar || logoForm.logoSidebar || ASSET_IMAGES.logoSidebar)
                : (logos?.logoSidebar || logoForm.logoSidebar || ASSET_IMAGES.logoSidebar)
            }
            alt="Confficar Logo"
            style={{
              height: (logos?.logoSidebarHeightPx || logoForm.logoSidebarHeightPx) ? `${logos?.logoSidebarHeightPx || logoForm.logoSidebarHeightPx}px` : undefined
            }}
            className="w-auto max-w-[150px] object-contain cursor-pointer transition-all duration-300"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onViewChange('public');
            }}
          />
        </div>

        <div className="mb-4 px-2">
          <a
            href="https://app.grupoconficar.com.br/login"
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
            <span>Acessar Sistema</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>

        <ul className="flex flex-col gap-1 flex-grow overflow-y-auto text-xs font-semibold pr-1">
          {isSectionAllowed('dashboard') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'dashboard'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                <span>Gerenciador do site</span>
              </button>
            </li>
          )}
          {isSectionAllowed('logos') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('logos');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'logos'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">image</span>
                <div className="flex items-center justify-between w-full">
                  <span>Logomarcas do Site</span>
                  <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">Logo</span>
                </div>
              </button>
            </li>
          )}
          {isSectionAllowed('banners') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('banners');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'banners'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">view_carousel</span>
                <span>Banners / Hero</span>
              </button>
            </li>
          )}
          {isSectionAllowed('servicos') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('servicos');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'servicos'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">business_center</span>
                <span>Serviços</span>
              </button>
            </li>
          )}
          {isSectionAllowed('frota') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('frota');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'frota'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
                <span>Tipos de Veículos</span>
              </button>
            </li>
          )}
          {isSectionAllowed('depoimentos') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('depoimentos');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'depoimentos'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">reviews</span>
                <span>Depoimentos</span>
              </button>
            </li>
          )}
          {isSectionAllowed('conteudo') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('conteudo');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'conteudo'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">text_snippet</span>
                <span>Conteúdo Geral</span>
              </button>
            </li>
          )}
          {isSectionAllowed('seo') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('seo');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'seo'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                <div className="flex items-center justify-between w-full">
                  <span>SEO Google</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">Busca</span>
                </div>
              </button>
            </li>
          )}
          {isSectionAllowed('cloudinary') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('cloudinary');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'cloudinary'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                <div className="flex items-center justify-between w-full">
                  <span>Cloudinary CDN</span>
                  <span className="bg-gold-100 text-gold-700 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">Nuvem</span>
                </div>
              </button>
            </li>
          )}
          {isSectionAllowed('configuracoes') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('configuracoes');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'configuracoes'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>Configurações</span>
              </button>
            </li>
          )}
          {isSectionAllowed('usuarios') && (
            <li>
              <button
                onClick={() => {
                  onSectionChange('usuarios');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                  currentSection === 'usuarios'
                    ? isDark
                      ? 'bg-[#0A0A0A] text-white font-bold shadow-xs'
                      : 'bg-gold-50 text-[#0A0A0A] font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <div className="flex items-center justify-between w-full">
                  <span>Usuários & Permissões</span>
                  <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">SuperAdmin</span>
                </div>
              </button>
            </li>
          )}
        </ul>

        <div className={`mt-auto pt-3 border-t text-xs font-semibold ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onViewChange('public');
            }}
            className={`w-full px-3.5 py-2 flex items-center gap-2 rounded-xl transition-all cursor-pointer mb-1 ${
              isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Ver Site Público</span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleCmsLogout();
            }}
            className={`w-full text-rose-500 px-3.5 py-2 flex items-center gap-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sair do Painel CMS</span>
          </button>

          <div className={`mt-3 pt-2.5 border-t text-[11px] font-normal text-center ${
            isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'
          }`}>
            Desenvolvido por:{' '}
            <a
              href="https://transporteapp.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#0A0A0A] hover:underline"
            >
              Transporteapp
            </a>
          </div>
        </div>
      </aside>

      {/* Main CMS Area */}
      <main className={`flex-1 flex flex-col h-full overflow-y-auto transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC]'}`}>
        {/* Header Bar */}
        <header className={`h-16 px-4 sm:px-6 lg:px-8 border-b flex items-center justify-between sticky top-0 z-10 shrink-0 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all lg:hidden ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
              }`}
              title="Abrir Menu do CMS"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <div>
              <h2 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                <span className={`truncate max-w-[180px] sm:max-w-none ${isDark ? 'text-white' : 'text-slate-900'}`}>Gerenciador de conteúdo</span>
                <span className={`hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600'}`}>
                  Confficar Admin
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Switcher Toggle Control */}
            <div className={`flex items-center p-1 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => handleToggleTheme('light')}
                title="Ativar Modo Claro"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-[#0A0A0A] shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
                <span className="hidden md:inline">Claro</span>
              </button>
              <button
                onClick={() => handleToggleTheme('dark')}
                title="Ativar Modo Escuro"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0A0A] text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                <span className="hidden md:inline">Escuro</span>
              </button>
            </div>

            {showSaveSuccess && (
              <div className="hidden sm:flex bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-lg items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Salvo!</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white font-black text-xs flex items-center justify-center shrink-0">
                {loggedCMSUser?.name ? loggedCMSUser.name.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="text-left hidden md:block">
                <p className={`text-xs font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {loggedCMSUser?.name || 'Administrador Confficar'}
                </p>
                <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {loggedCMSUser?.isSuperAdmin ? '★ SuperAdmin' : 'Editor CMS'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleCmsLogout();
              }}
              title="Sair do Painel CMS"
              className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-rose-400 hover:bg-rose-950/40'
                  : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-3 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6 sm:space-y-8">
          
          {/* Section: Dashboard Overview - Central de Gestão e Acesso Rápido do Site */}
          {currentSection === 'dashboard' && (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[24px]">dashboard</span>
                    <h1 className="text-2xl font-bold text-slate-900">Gerenciador do site</h1>
                  </div>
                  <p className="text-xs text-slate-500">
                    Acesso rápido aos cards de edição de conteúdos, banners, frota e serviços exibidos no site da Confficar.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onViewChange('public')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span>Ver Site ao Vivo</span>
                  </button>
                </div>
              </div>

              {/* Operational System Notice Card */}
              <div className="bg-gradient-to-r from-slate-900 via-[#1A1A1A] to-[#0A0A0A] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20 text-emerald-300">
                    <span className="material-symbols-outlined text-[28px]">directions_car</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold text-white">Sistema Operacional para Transporte Executivo (TransporteApp)</h2>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        ON-LINE
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      As operações diárias de agendamento de viagens, cadastros de motoristas, rastreamento de veículos e faturamento corporativo são realizadas no sistema TransporteApp. Esta página é exclusivamente para gerenciar o conteúdo e a apresentação do site Confficar.
                    </p>
                  </div>
                </div>
                <a
                  href="https://app.grupoconficar.com.br/login"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
                >
                  <span>Acessar Sistema</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>

              {/* Real-time Cloud Database Status Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-900/90 border-emerald-900/40 text-slate-100' : 'bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-gold-50/80 border-emerald-200/80 text-slate-900'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[24px]">cloud_done</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Banco de Dados em Nuvem Ativo (Realtime Firestore)
                        </h3>
                        <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Todas as edições de texto, imagens, frota e SEO feitas neste painel são <strong>salvas automaticamente na nuvem</strong> e refletidas em tempo real para todos os clientes e visitantes do site.
                      </p>
                    </div>
                  </div>

                  {triggerSaveNotification && (
                    <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
                      <span>Sincronização Automática</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick-Access Cards Grid for Site Content */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">grid_view</span>
                    <span>Acesso Rápido para Edição do Site</span>
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    Clique em qualquer card para gerenciar a seção
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card 0: Logomarcas & Identidade Visual */}
                  {isSectionAllowed('logos') && (
                    <div 
                      onClick={() => onSectionChange('logos')}
                      className="bg-white rounded-2xl border border-gold-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">image</span>
                          </div>
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                            <span>Troca Fácil</span>
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5 flex items-center gap-2">
                          <span>Logomarcas do Site</span>
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Altere facilmente as imagens da logo exibidas no topo do site, rodapé, painel de controle e tela de login. Faça upload do seu computador.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Trocar Logos do Site</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}

                  {/* Card 1: Banners & Capa Hero */}
                  {isSectionAllowed('banners') && (
                    <div 
                      onClick={() => onSectionChange('banners')}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">view_carousel</span>
                          </div>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            {banners.length} Banners
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5">
                          Banners & Capa Principal
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Edite as imagens do slider da home, títulos de impacto e os textos da área principal de cotação.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Editar Banners & Hero</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}

                  {/* Card 2: Catálogo de Frota */}
                  {isSectionAllowed('frota') && (
                    <div 
                      onClick={() => onSectionChange('frota')}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">directions_car</span>
                          </div>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            {fleet.length} Veículos
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5">
                          Catálogo de Frota
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Cadastre e atualize os tipos de veículos (Sedan, Blindado, Van, Ônibus), fotos e especificações técnicas.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Gerenciar Frota</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}

                  {/* Card 3: Serviços Corporativos */}
                  {isSectionAllowed('servicos') && (
                    <div 
                      onClick={() => onSectionChange('servicos')}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">business_center</span>
                          </div>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            {services.length} Serviços
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5">
                          Serviços Prestados
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Gerencie os cards de serviços oferecidos (Transfer, Viagens, Eventos) com ícones e descrições personalizadas.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Editar Serviços</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}

                  {/* Card 4: Depoimentos */}
                  {isSectionAllowed('depoimentos') && (
                    <div 
                      onClick={() => onSectionChange('depoimentos')}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">reviews</span>
                          </div>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            {testimonials.length} Avaliações
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5">
                          Depoimentos de Clientes
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Adicione e edite relatos de executivos e empresas parceiras exibidos no rodapé do portal.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Gerenciar Depoimentos</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}

                  {/* Card 5: Conteúdo Institucional */}
                  {isSectionAllowed('conteudo') && (
                    <div 
                      onClick={() => onSectionChange('conteudo')}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">text_snippet</span>
                          </div>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            Textos do Site
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5">
                          Conteúdo Institucional
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Edite a apresentação da Confficar, história, resumo "Quem Somos" e missão institucional.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Editar Textos</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}

                  {/* Card 6: Configurações & Contato */}
                  {isSectionAllowed('configuracoes') && (
                    <div 
                      onClick={() => onSectionChange('configuracoes')}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-50 text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">settings</span>
                          </div>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            Canais de Atendimento
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0A0A0A] transition-colors mb-1.5">
                          Contato & Configurações
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Configure telefones de contato, WhatsApp de suporte, e-mail institucional e endereço.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span>Editar Configurações</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section: Gerenciador de Logomarcas */}
          {currentSection === 'logos' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[26px]">image</span>
                    <h2 className="text-xl font-bold text-slate-900">Gerenciador de Logomarcas do Site</h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Troque e envie imagens do seu computador ou cole links para atualizar a identidade visual do portal.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetLogos}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Restaurar logos originais"
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>Restaurar Padrão</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onUpdateLogos) onUpdateLogos(logoForm);
                      triggerSaveNotification();
                    }}
                    className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Salvar Logomarcas</span>
                  </button>
                </div>
              </div>

              {/* Batch Action Banner */}
              <div className="bg-gradient-to-r from-gold-50 via-gold-50 to-gold-50 border border-gold-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Troca Rápida em Todo o Site</h3>
                    <p className="text-[11px] text-slate-600">
                      Defina uma imagem no cabeçalho e replique instantaneamente em todas as 4 posições com 1 único clique.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleApplyAllLogos('logoHeader')}
                  className="shrink-0 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Usar Logo do Cabeçalho em Tudo</span>
                </button>
              </div>

              {/* Text Editor Auxiliar da Logo */}
              <div className="bg-white rounded-2xl border border-gold-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[22px]">title</span>
                    <h3 className="text-sm font-bold text-slate-900">Editor de Texto Auxiliar da Logo</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    Opcional (Pode deixar em branco)
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Edite o nome da marca e o subtítulo exibidos ao lado da imagem da logo no site. Se desejar exibir apenas a imagem sem nenhum texto, apague o conteúdo dos campos abaixo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Texto Principal (Nome da Marca)
                      </label>
                      {logoForm.logoTitle && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...logoForm, logoTitle: '' };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                        >
                          Deixar em branco
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={logoForm.logoTitle ?? ''}
                      onChange={(e) => {
                        const updated = { ...logoForm, logoTitle: e.target.value };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      placeholder="Ex: Confficar (ou deixe em branco)"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Subtítulo Auxiliar
                      </label>
                      {logoForm.logoSubtitle && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...logoForm, logoSubtitle: '' };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                        >
                          Deixar em branco
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={logoForm.logoSubtitle ?? ''}
                      onChange={(e) => {
                        const updated = { ...logoForm, logoSubtitle: e.target.value };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      placeholder="Ex: Mobilidade Corporativa (ou deixe em branco)"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                    />
                  </div>
                </div>

                {/* Live Text Preview Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gold-50 text-[#0A0A0A] flex items-center justify-center font-bold text-xs">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Prévia do Texto Exibido:</span>
                    {(logoForm.logoTitle?.trim() || logoForm.logoSubtitle?.trim()) ? (
                      <div className="flex flex-col">
                        {logoForm.logoTitle?.trim() && (
                          <span className="text-sm font-extrabold text-[#0A0A0A] leading-none">
                            {logoForm.logoTitle}
                          </span>
                        )}
                        {logoForm.logoSubtitle?.trim() && (
                          <span className="text-[11px] font-medium text-slate-500 leading-tight">
                            {logoForm.logoSubtitle}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">
                        Nenhum texto ativo (o site exibirá exclusivamente a imagem da logo)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Painel de Dimensionamento e Tamanho da Logo */}
              <div className="bg-white rounded-2xl border border-gold-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[22px]">aspect_ratio</span>
                    <h3 className="text-sm font-bold text-slate-900">Ajuste do Tamanho de Exibição das Logos (Altura em Pixels)</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-gold-100 text-[#0A0A0A] px-2.5 py-1 rounded-full border border-gold-200">
                    Controle de Dimensões
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Ajuste a altura exata em pixels (px) para cada local de exibição da logomarca no site. Mova a barra ou digite o valor diretamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {/* Quick Control 1 */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">1. Topo (Header)</span>
                      <span className="text-xs font-extrabold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                        {logoForm.logoHeaderHeightPx || 48}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="140"
                      step="2"
                      value={logoForm.logoHeaderHeightPx || 48}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 48;
                        const updated = { ...logoForm, logoHeaderHeightPx: val };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                    />
                  </div>

                  {/* Quick Control 2 */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">2. Rodapé</span>
                      <span className="text-xs font-extrabold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                        {logoForm.logoFooterHeightPx || 48}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="140"
                      step="2"
                      value={logoForm.logoFooterHeightPx || 48}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 48;
                        const updated = { ...logoForm, logoFooterHeightPx: val };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                    />
                  </div>

                  {/* Quick Control 3 */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">3. Menu Admin</span>
                      <span className="text-xs font-extrabold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                        {logoForm.logoSidebarHeightPx || 40}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="2"
                      value={logoForm.logoSidebarHeightPx || 40}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 40;
                        const updated = { ...logoForm, logoSidebarHeightPx: val };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                    />
                  </div>

                  {/* Quick Control 4 */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">4. Card de Login</span>
                      <span className="text-xs font-extrabold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                        {logoForm.logoLoginHeightPx || 56}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="140"
                      step="2"
                      value={logoForm.logoLoginHeightPx || 56}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 56;
                        const updated = { ...logoForm, logoLoginHeightPx: val };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                    />
                  </div>
                </div>
              </div>

              {/* Grid of Logo Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Topo do Site */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">view_day</span>
                      <h3 className="text-sm font-bold text-slate-900">1. Topo do Site (Cabeçalho)</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Fundo Claro
                    </span>
                  </div>

                  <div className="bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center min-h-[130px] border border-dashed border-slate-300 relative overflow-hidden">
                    <img
                      src={logoForm.logoHeader}
                      alt="Preview Topo"
                      style={{ height: `${logoForm.logoHeaderHeightPx || 48}px` }}
                      className="w-auto max-w-full object-contain transition-all duration-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Prévia no cabeçalho ({logoForm.logoHeaderHeightPx || 48}px)</p>
                  </div>

                  <div className="space-y-3">
                    {/* Control Size */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-700">Tamanho / Altura (px):</label>
                        <span className="text-xs font-bold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded">
                          {logoForm.logoHeaderHeightPx || 48}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="20"
                          max="140"
                          step="2"
                          value={logoForm.logoHeaderHeightPx || 48}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 48;
                            const updated = { ...logoForm, logoHeaderHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                        />
                        <input
                          type="number"
                          min="20"
                          max="200"
                          value={logoForm.logoHeaderHeightPx || 48}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 48;
                            const updated = { ...logoForm, logoHeaderHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-16 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:border-[#0A0A0A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enviar Arquivo do Computador
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logoHeader')}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ou Cole a URL da Imagem
                      </label>
                      <input
                        type="text"
                        value={logoForm.logoHeader}
                        onChange={(e) => {
                          const updated = { ...logoForm, logoHeader: e.target.value };
                          setLogoForm(updated);
                          if (onUpdateLogos) onUpdateLogos(updated);
                        }}
                        placeholder="https://exemplo.com/sua-logo.png"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleApplyAllLogos('logoHeader')}
                      className="w-full py-2 bg-slate-50 hover:bg-gold-50 text-[#0A0A0A] font-bold text-xs rounded-xl border border-slate-200 hover:border-gold-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Aplicar esta logo em todas as áreas</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">dark_mode</span>
                      <h3 className="text-sm font-bold text-slate-900">Logo Tema Escuro (Site no Modo Escuro)</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded">
                      Fundo Escuro
                    </span>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center min-h-[130px] border border-dashed border-slate-700 relative overflow-hidden">
                    <img
                      src={logoForm.logoDark || logoForm.logoHeader}
                      alt="Preview Tema Escuro"
                      style={{ height: `${logoForm.logoHeaderHeightPx || 48}px` }}
                      className="w-auto max-w-full object-contain transition-all duration-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Usada no cabeçalho, rodapé e menu em modo escuro</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enviar Arquivo do Computador
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logoDark')}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ou Cole a URL da Imagem
                      </label>
                      <input
                        type="text"
                        value={logoForm.logoDark || ''}
                        onChange={(e) => {
                          const updated = { ...logoForm, logoDark: e.target.value };
                          setLogoForm(updated);
                          if (onUpdateLogos) onUpdateLogos(updated);
                        }}
                        placeholder="https://exemplo.com/logo-escura.png"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo usada durante o carregamento inicial */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">progress_activity</span>
                      <h3 className="text-sm font-bold text-slate-900">Logo de Carregamento</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      Tela inicial
                    </span>
                  </div>

                  <div className="bg-[#050b14] rounded-xl p-4 flex flex-col items-center justify-center min-h-[130px] border border-dashed border-slate-700 relative overflow-hidden">
                    <img
                      src={logoForm.logoLoading || '/favicon.png'}
                      alt="Preview Logo de Carregamento"
                      className="w-24 h-24 object-contain"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Exibida enquanto o conteúdo atualizado carrega</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enviar Arquivo do Computador
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logoLoading')}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ou Cole a URL da Imagem
                    </label>
                    <input
                      type="text"
                      value={logoForm.logoLoading || ''}
                      onChange={(e) => {
                        const updated = { ...logoForm, logoLoading: e.target.value };
                        setLogoForm(updated);
                        if (onUpdateLogos) onUpdateLogos(updated);
                      }}
                      placeholder="https://exemplo.com/logo-loading.png"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                    />
                  </div>
                </div>

                {/* 2. Rodapé do Site */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">dock</span>
                      <h3 className="text-sm font-bold text-slate-900">2. Rodapé do Site</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Fundo Cinza
                    </span>
                  </div>

                  <div className="bg-[#e5e2e1] rounded-xl p-4 flex flex-col items-center justify-center min-h-[130px] border border-dashed border-slate-300 relative overflow-hidden">
                    <img
                      src={logoForm.logoFooter}
                      alt="Preview Rodapé"
                      style={{ height: `${logoForm.logoFooterHeightPx || 48}px` }}
                      className="w-auto max-w-full object-contain transition-all duration-300"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">Prévia no rodapé ({logoForm.logoFooterHeightPx || 48}px)</p>
                  </div>

                  <div className="space-y-3">
                    {/* Control Size */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-700">Tamanho / Altura (px):</label>
                        <span className="text-xs font-bold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded">
                          {logoForm.logoFooterHeightPx || 48}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="20"
                          max="140"
                          step="2"
                          value={logoForm.logoFooterHeightPx || 48}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 48;
                            const updated = { ...logoForm, logoFooterHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                        />
                        <input
                          type="number"
                          min="20"
                          max="200"
                          value={logoForm.logoFooterHeightPx || 48}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 48;
                            const updated = { ...logoForm, logoFooterHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-16 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:border-[#0A0A0A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enviar Arquivo do Computador
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logoFooter')}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ou Cole a URL da Imagem
                      </label>
                      <input
                        type="text"
                        value={logoForm.logoFooter}
                        onChange={(e) => {
                          const updated = { ...logoForm, logoFooter: e.target.value };
                          setLogoForm(updated);
                          if (onUpdateLogos) onUpdateLogos(updated);
                        }}
                        placeholder="https://exemplo.com/sua-logo.png"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleApplyAllLogos('logoFooter')}
                      className="w-full py-2 bg-slate-50 hover:bg-gold-50 text-[#0A0A0A] font-bold text-xs rounded-xl border border-slate-200 hover:border-gold-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Aplicar esta logo em todas as áreas</span>
                    </button>
                  </div>
                </div>

                {/* 3. Painel Administrativo */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">side_navigation</span>
                      <h3 className="text-sm font-bold text-slate-900">3. Menu do Painel (Sidebar Admin)</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Menu Lateral
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center min-h-[130px] border border-dashed border-slate-300 relative overflow-hidden">
                    <img
                      src={logoForm.logoSidebar}
                      alt="Preview Sidebar Admin"
                      style={{ height: `${logoForm.logoSidebarHeightPx || 40}px` }}
                      className="w-auto max-w-full object-contain transition-all duration-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Prévia no menu admin ({logoForm.logoSidebarHeightPx || 40}px)</p>
                  </div>

                  <div className="space-y-3">
                    {/* Control Size */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-700">Tamanho / Altura (px):</label>
                        <span className="text-xs font-bold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded">
                          {logoForm.logoSidebarHeightPx || 40}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="20"
                          max="120"
                          step="2"
                          value={logoForm.logoSidebarHeightPx || 40}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 40;
                            const updated = { ...logoForm, logoSidebarHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                        />
                        <input
                          type="number"
                          min="20"
                          max="200"
                          value={logoForm.logoSidebarHeightPx || 40}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 40;
                            const updated = { ...logoForm, logoSidebarHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-16 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:border-[#0A0A0A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enviar Arquivo do Computador
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logoSidebar')}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ou Cole a URL da Imagem
                      </label>
                      <input
                        type="text"
                        value={logoForm.logoSidebar}
                        onChange={(e) => {
                          const updated = { ...logoForm, logoSidebar: e.target.value };
                          setLogoForm(updated);
                          if (onUpdateLogos) onUpdateLogos(updated);
                        }}
                        placeholder="https://exemplo.com/sua-logo.png"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleApplyAllLogos('logoSidebar')}
                      className="w-full py-2 bg-slate-50 hover:bg-gold-50 text-[#0A0A0A] font-bold text-xs rounded-xl border border-slate-200 hover:border-gold-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Aplicar esta logo em todas as áreas</span>
                    </button>
                  </div>
                </div>

                {/* 4. Tela de Login */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[20px]">lock</span>
                      <h3 className="text-sm font-bold text-slate-900">4. Tela de Login</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Card de Login
                    </span>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center min-h-[130px] border border-dashed border-slate-700 relative overflow-hidden">
                    <div className="bg-white rounded-full p-2 flex items-center justify-center shadow transition-all" style={{ height: `${Math.max(48, (logoForm.logoLoginHeightPx || 56) + 20)}px`, minWidth: `${Math.max(48, (logoForm.logoLoginHeightPx || 56) + 20)}px` }}>
                      <img
                        src={logoForm.logoLogin}
                        alt="Preview Login"
                        style={{ height: `${logoForm.logoLoginHeightPx || 56}px` }}
                        className="w-auto max-w-full object-contain transition-all duration-300"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Prévia na tela de login ({logoForm.logoLoginHeightPx || 56}px)</p>
                  </div>

                  <div className="space-y-3">
                    {/* Control Size */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-700">Tamanho / Altura (px):</label>
                        <span className="text-xs font-bold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded">
                          {logoForm.logoLoginHeightPx || 56}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="20"
                          max="140"
                          step="2"
                          value={logoForm.logoLoginHeightPx || 56}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 56;
                            const updated = { ...logoForm, logoLoginHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                        />
                        <input
                          type="number"
                          min="20"
                          max="200"
                          value={logoForm.logoLoginHeightPx || 56}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 56;
                            const updated = { ...logoForm, logoLoginHeightPx: val };
                            setLogoForm(updated);
                            if (onUpdateLogos) onUpdateLogos(updated);
                          }}
                          className="w-16 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:border-[#0A0A0A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enviar Arquivo do Computador
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logoLogin')}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ou Cole a URL da Imagem
                      </label>
                      <input
                        type="text"
                        value={logoForm.logoLogin}
                        onChange={(e) => {
                          const updated = { ...logoForm, logoLogin: e.target.value };
                          setLogoForm(updated);
                          if (onUpdateLogos) onUpdateLogos(updated);
                        }}
                        placeholder="https://exemplo.com/sua-logo.png"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleApplyAllLogos('logoLogin')}
                      className="w-full py-2 bg-slate-50 hover:bg-gold-50 text-[#0A0A0A] font-bold text-xs rounded-xl border border-slate-200 hover:border-gold-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Aplicar esta logo em todas as áreas</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Section: Banners da Home / Hero Editor */}
          {currentSection === 'banners' && (
            <div className="space-y-8">
              {/* Hero Section Editor */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A0A0A]">tune</span>
                    <span>Editor da Seção Hero (Capa Principal)</span>
                  </h3>
                  <button
                    onClick={handleSaveHero}
                    className="bg-[#0A0A0A] text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A] flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Salvar Alterações</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <form onSubmit={handleSaveHero} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Título Principal</label>
                      <input
                        type="text"
                        value={heroForm.heroTitle}
                        onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroTitle: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo</label>
                      <textarea
                        rows={3}
                        value={heroForm.heroSubtitle}
                        onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none"
                      />
                    </div>

                    {/* 3 Uploads de Imagens do Hero por Dispositivo (Tema Claro e Tema Escuro) */}
                    <div className="space-y-6 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="material-symbols-outlined text-[#0A0A0A] text-sm">collections</span>
                          <span>Imagens da Capa Hero (Tema Escuro & Tema Claro)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">3 Dispositivos x 2 Temas</span>
                      </div>
                      <p className="text-[11px] text-slate-500 -mt-2">
                        Ao alterar uma imagem aqui, ela passa a ser usada em <strong>todos os slides</strong> do carrossel. Para dar uma imagem exclusiva a um slide, use os cards de cada slide abaixo.
                      </p>

                      {/* 1. Imagem Desktop (Tela Grande) */}
                      <div className="p-4 border border-gold-100 rounded-xl bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-gold-600 text-base">desktop_windows</span>
                            <span>1. Computador / Desktop</span>
                          </label>
                          <span className="text-[10px] bg-gold-50 text-gold-700 px-2 py-0.5 rounded font-semibold border border-gold-100">
                            Horizontal (16:9)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Desktop Dark */}
                          <div className="p-3 border border-slate-200 rounded-lg bg-slate-900 text-white space-y-2">
                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-400 text-xs">dark_mode</span>
                              <span>Versão Tema Escuro</span>
                            </span>
                            {heroForm.heroBgImage && (
                              <div className="p-1 border border-slate-700 rounded bg-slate-800 flex justify-center">
                                <img src={heroForm.heroBgImage} alt="Desktop Dark" className="max-h-16 object-cover rounded" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) updateCapaHeroField('heroBgImage', res.url);
                                } catch (err) {
                                  console.error('Error uploading desktop dark hero image:', err);
                                }
                              }}
                              className="block w-full text-[11px] text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-700 file:text-white cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.heroBgImage}
                              onChange={(e) => updateCapaHeroField('heroBgImage', e.target.value)}
                              placeholder="URL Imagem Escura..."
                              className="w-full border border-slate-700 rounded bg-slate-800 px-2 py-1 text-[10px] text-white focus:border-gold-400 outline-none font-mono"
                            />
                          </div>

                          {/* Desktop Light */}
                          <div className="p-3 border border-slate-200 rounded-lg bg-amber-50/40 text-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-600 text-xs">light_mode</span>
                              <span>Versão Tema Claro</span>
                            </span>
                            {(heroForm.heroBgImageLight || heroForm.heroBgImage) && (
                              <div className="p-1 border border-amber-200 rounded bg-white flex justify-center">
                                <img src={heroForm.heroBgImageLight || heroForm.heroBgImage} alt="Desktop Light" className="max-h-16 object-cover rounded" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) updateCapaHeroField('heroBgImageLight', res.url);
                                } catch (err) {
                                  console.error('Error uploading desktop light hero image:', err);
                                }
                              }}
                              className="block w-full text-[11px] text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-amber-100 file:text-amber-900 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.heroBgImageLight || ''}
                              onChange={(e) => updateCapaHeroField('heroBgImageLight', e.target.value)}
                              placeholder="URL Imagem Clara..."
                              className="w-full border border-amber-200 rounded bg-white px-2 py-1 text-[10px] text-slate-900 focus:border-gold-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Imagem Tablet */}
                      <div className="p-4 border border-amber-100 rounded-xl bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-amber-600 text-base">tablet_mac</span>
                            <span>2. Tablet</span>
                          </label>
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-100">
                            Médio (4:3)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Tablet Dark */}
                          <div className="p-3 border border-slate-200 rounded-lg bg-slate-900 text-white space-y-2">
                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-400 text-xs">dark_mode</span>
                              <span>Tablet Escuro</span>
                            </span>
                            {(heroForm.heroBgImageTablet || heroForm.heroBgImage) && (
                              <div className="p-1 border border-slate-700 rounded bg-slate-800 flex justify-center">
                                <img src={heroForm.heroBgImageTablet || heroForm.heroBgImage} alt="Tablet Dark" className="max-h-16 object-cover rounded" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) updateCapaHeroField('heroBgImageTablet', res.url);
                                } catch (err) {
                                  console.error('Error uploading tablet dark hero image:', err);
                                }
                              }}
                              className="block w-full text-[11px] text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-700 file:text-white cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.heroBgImageTablet || ''}
                              onChange={(e) => updateCapaHeroField('heroBgImageTablet', e.target.value)}
                              placeholder="URL Tablet Escuro..."
                              className="w-full border border-slate-700 rounded bg-slate-800 px-2 py-1 text-[10px] text-white focus:border-amber-400 outline-none font-mono"
                            />
                          </div>

                          {/* Tablet Light */}
                          <div className="p-3 border border-slate-200 rounded-lg bg-amber-50/40 text-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-600 text-xs">light_mode</span>
                              <span>Tablet Claro</span>
                            </span>
                            {(heroForm.heroBgImageTabletLight || heroForm.heroBgImageLight || heroForm.heroBgImage) && (
                              <div className="p-1 border border-amber-200 rounded bg-white flex justify-center">
                                <img src={heroForm.heroBgImageTabletLight || heroForm.heroBgImageLight || heroForm.heroBgImage} alt="Tablet Light" className="max-h-16 object-cover rounded" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) updateCapaHeroField('heroBgImageTabletLight', res.url);
                                } catch (err) {
                                  console.error('Error uploading tablet light hero image:', err);
                                }
                              }}
                              className="block w-full text-[11px] text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-amber-100 file:text-amber-900 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.heroBgImageTabletLight || ''}
                              onChange={(e) => updateCapaHeroField('heroBgImageTabletLight', e.target.value)}
                              placeholder="URL Tablet Claro..."
                              className="w-full border border-amber-200 rounded bg-white px-2 py-1 text-[10px] text-slate-900 focus:border-amber-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Imagem Mobile (Vertical / Celular) */}
                      <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-600 text-base">smartphone</span>
                            <span>3. Celular / Mobile (Vertical)</span>
                          </label>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                            Vertical (9:16)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Mobile Dark */}
                          <div className="p-3 border border-slate-200 rounded-lg bg-slate-900 text-white space-y-2">
                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-400 text-xs">dark_mode</span>
                              <span>Celular Escuro</span>
                            </span>
                            {(heroForm.heroBgImageMobile || heroForm.heroBgImage) && (
                              <div className="p-1 border border-slate-700 rounded bg-slate-800 flex justify-center">
                                <img src={heroForm.heroBgImageMobile || heroForm.heroBgImage} alt="Mobile Dark" className="max-h-20 object-cover rounded" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) updateCapaHeroField('heroBgImageMobile', res.url);
                                } catch (err) {
                                  console.error('Error uploading mobile dark hero image:', err);
                                }
                              }}
                              className="block w-full text-[11px] text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-700 file:text-white cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.heroBgImageMobile || ''}
                              onChange={(e) => updateCapaHeroField('heroBgImageMobile', e.target.value)}
                              placeholder="URL Celular Escuro..."
                              className="w-full border border-slate-700 rounded bg-slate-800 px-2 py-1 text-[10px] text-white focus:border-emerald-400 outline-none font-mono"
                            />
                          </div>

                          {/* Mobile Light */}
                          <div className="p-3 border border-emerald-200 rounded-lg bg-white space-y-2">
                            <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-600 text-xs">light_mode</span>
                              <span>Celular Claro</span>
                            </span>
                            {(heroForm.heroBgImageMobileLight || heroForm.heroBgImageMobile || heroForm.heroBgImage) && (
                              <div className="p-1 border border-emerald-200 rounded bg-slate-50 flex justify-center">
                                <img src={heroForm.heroBgImageMobileLight || heroForm.heroBgImageMobile || heroForm.heroBgImage} alt="Mobile Light" className="max-h-20 object-cover rounded" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) updateCapaHeroField('heroBgImageMobileLight', res.url);
                                } catch (err) {
                                  console.error('Error uploading mobile light hero image:', err);
                                }
                              }}
                              className="block w-full text-[11px] text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-100 file:text-amber-900 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.heroBgImageMobileLight || ''}
                              onChange={(e) => updateCapaHeroField('heroBgImageMobileLight', e.target.value)}
                              placeholder="URL Celular Claro..."
                              className="w-full border border-slate-200 rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-900 focus:border-emerald-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3.5. Ajuste Personalizado de Tamanho, Altura e Encaixe da Imagem por Dispositivo */}
                      <div className="p-5 border border-[#0A0A0A]/20 rounded-2xl bg-gradient-to-br from-slate-50 via-gold-50/30 to-gold-50/20 space-y-5 shadow-sm">
                        <div className="flex items-start justify-between border-b border-slate-200/80 pb-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0A0A0A]">
                              <span className="material-symbols-outlined text-lg">aspect_ratio</span>
                              <span>Controle de Altura, Tamanho e Encaixe da Imagem Hero (3 Telas)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Ajuste manualmente a altura da capa, a forma de corte (`cover`, `contain`, `fill`) e a posição focal da imagem para Computador, Tablet e Celular.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-[#0A0A0A] text-white px-2.5 py-1 rounded-full shadow-sm shrink-0">
                            Ajuste Fino 3x
                          </span>
                        </div>

                        {/* Cards dos 3 Dispositivos */}
                        <div className="space-y-5">

                          {/* 🖥️ A. COMPUTADOR / DESKTOP */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-gold-600 text-base">desktop_windows</span>
                                <span>Desktop / Computador (Telas Grandes ≥ 1024px)</span>
                              </span>
                              <span className="text-[10px] bg-gold-50 text-gold-700 font-bold px-2 py-0.5 rounded border border-gold-100">
                                Recomendado: 1920x1080 (16:9)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Unidade & Altura */}
                              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="block text-[11px] font-bold text-slate-700">Unidade de Altura:</label>
                                <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitDesktop: 'vh' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      (heroForm.heroHeightUnitDesktop ?? 'vh') === 'vh' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    vh (% tela)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitDesktop: 'px' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      heroForm.heroHeightUnitDesktop === 'px' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    px (fixo)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitDesktop: 'auto' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      heroForm.heroHeightUnitDesktop === 'auto' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    Auto
                                  </button>
                                </div>

                                {heroForm.heroHeightUnitDesktop !== 'auto' && (
                                  <div className="pt-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-bold text-slate-500">Valor da Altura:</span>
                                      <span className="text-xs font-mono font-extrabold text-[#0A0A0A]">
                                        {heroForm.heroHeightUnitDesktop === 'px'
                                          ? `${heroForm.heroHeightDesktopPx ?? 680}px`
                                          : `${heroForm.heroHeightDesktopVh ?? 75}vh`}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={heroForm.heroHeightUnitDesktop === 'px' ? 300 : 35}
                                      max={heroForm.heroHeightUnitDesktop === 'px' ? 1200 : 100}
                                      step={heroForm.heroHeightUnitDesktop === 'px' ? 10 : 5}
                                      value={
                                        heroForm.heroHeightUnitDesktop === 'px'
                                          ? (heroForm.heroHeightDesktopPx ?? 680)
                                          : (heroForm.heroHeightDesktopVh ?? 75)
                                      }
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (heroForm.heroHeightUnitDesktop === 'px') {
                                          updateHeroForm((prev) => ({ ...prev, heroHeightDesktopPx: val }));
                                        } else {
                                          updateHeroForm((prev) => ({ ...prev, heroHeightDesktopVh: val }));
                                        }
                                      }}
                                      className="w-full accent-[#0A0A0A] cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Modo de Encaixe & Posição */}
                              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Corte / Encaixe (`object-fit`):</label>
                                  <select
                                    value={heroForm.heroObjectFitDesktop || 'cover'}
                                    onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroObjectFitDesktop: e.target.value as any }))}
                                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 bg-white font-semibold outline-none focus:border-[#0A0A0A]"
                                  >
                                    <option value="cover">Preencher Corte Inteligente (Cover)</option>
                                    <option value="contain">Mostrar Foto Completa sem Cortar (Contain)</option>
                                    <option value="fill">Esticar na Tela Inteira (Fill)</option>
                                    <option value="scale-down">Manter Tamanho Original (Scale Down)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Posição Focal (`object-position`):</label>
                                  <select
                                    value={heroForm.heroObjectPositionDesktop || 'center'}
                                    onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroObjectPositionDesktop: e.target.value as any }))}
                                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 bg-white font-semibold outline-none focus:border-[#0A0A0A]"
                                  >
                                    <option value="center">Centralizado no Meio</option>
                                    <option value="top">Alinhado no Topo</option>
                                    <option value="bottom">Alinhado na Base</option>
                                    <option value="left">Alinhado à Esquerda</option>
                                    <option value="right">Alinhado à Direita</option>
                                    <option value="top center">Topo Centro</option>
                                    <option value="bottom center">Base Centro</option>
                                  </select>
                                </div>
                              </div>

                              {/* Escala / Zoom */}
                              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[11px] font-bold text-slate-700">Zoom / Escala da Foto:</label>
                                  <span className="text-xs font-mono font-bold text-[#0A0A0A]">
                                    {heroForm.heroImageZoomDesktop ?? 100}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Aproxime ou afaste a imagem de fundo para ajustar a margem livre desejada.
                                </p>
                                <input
                                  type="range"
                                  min="80"
                                  max="180"
                                  step="2"
                                  value={heroForm.heroImageZoomDesktop ?? 100}
                                  onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroImageZoomDesktop: Number(e.target.value) }))}
                                  className="w-full accent-[#0A0A0A] cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 📱 B. TABLET */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-amber-600 text-base">tablet_mac</span>
                                <span>Tablet (Telas Médias 640px a 1023px)</span>
                              </span>
                              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-100">
                                Recomendado: 1024x768 (4:3)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Unidade & Altura */}
                              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="block text-[11px] font-bold text-slate-700">Unidade de Altura:</label>
                                <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitTablet: 'vh' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      (heroForm.heroHeightUnitTablet ?? 'vh') === 'vh' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    vh (% tela)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitTablet: 'px' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      heroForm.heroHeightUnitTablet === 'px' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    px (fixo)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitTablet: 'auto' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      heroForm.heroHeightUnitTablet === 'auto' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    Auto
                                  </button>
                                </div>

                                {heroForm.heroHeightUnitTablet !== 'auto' && (
                                  <div className="pt-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-bold text-slate-500">Valor da Altura:</span>
                                      <span className="text-xs font-mono font-extrabold text-[#0A0A0A]">
                                        {heroForm.heroHeightUnitTablet === 'px'
                                          ? `${heroForm.heroHeightTabletPx ?? 580}px`
                                          : `${heroForm.heroHeightTabletVh ?? 65}vh`}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={heroForm.heroHeightUnitTablet === 'px' ? 250 : 30}
                                      max={heroForm.heroHeightUnitTablet === 'px' ? 1000 : 100}
                                      step={heroForm.heroHeightUnitTablet === 'px' ? 10 : 5}
                                      value={
                                        heroForm.heroHeightUnitTablet === 'px'
                                          ? (heroForm.heroHeightTabletPx ?? 580)
                                          : (heroForm.heroHeightTabletVh ?? 65)
                                      }
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (heroForm.heroHeightUnitTablet === 'px') {
                                          updateHeroForm((prev) => ({ ...prev, heroHeightTabletPx: val }));
                                        } else {
                                          updateHeroForm((prev) => ({ ...prev, heroHeightTabletVh: val }));
                                        }
                                      }}
                                      className="w-full accent-[#0A0A0A] cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Modo de Encaixe & Posição */}
                              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Corte / Encaixe (`object-fit`):</label>
                                  <select
                                    value={heroForm.heroObjectFitTablet || 'cover'}
                                    onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroObjectFitTablet: e.target.value as any }))}
                                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 bg-white font-semibold outline-none focus:border-[#0A0A0A]"
                                  >
                                    <option value="cover">Preencher Corte Inteligente (Cover)</option>
                                    <option value="contain">Mostrar Foto Completa sem Cortar (Contain)</option>
                                    <option value="fill">Esticar na Tela Inteira (Fill)</option>
                                    <option value="scale-down">Manter Tamanho Original (Scale Down)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Posição Focal (`object-position`):</label>
                                  <select
                                    value={heroForm.heroObjectPositionTablet || 'center'}
                                    onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroObjectPositionTablet: e.target.value as any }))}
                                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 bg-white font-semibold outline-none focus:border-[#0A0A0A]"
                                  >
                                    <option value="center">Centralizado no Meio</option>
                                    <option value="top">Alinhado no Topo</option>
                                    <option value="bottom">Alinhado na Base</option>
                                    <option value="left">Alinhado à Esquerda</option>
                                    <option value="right">Alinhado à Direita</option>
                                    <option value="top center">Topo Centro</option>
                                    <option value="bottom center">Base Centro</option>
                                  </select>
                                </div>
                              </div>

                              {/* Escala / Zoom */}
                              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[11px] font-bold text-slate-700">Zoom / Escala da Foto:</label>
                                  <span className="text-xs font-mono font-bold text-[#0A0A0A]">
                                    {heroForm.heroImageZoomTablet ?? 100}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Ajuste o enquadramento no Tablet.
                                </p>
                                <input
                                  type="range"
                                  min="80"
                                  max="180"
                                  step="2"
                                  value={heroForm.heroImageZoomTablet ?? 100}
                                  onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroImageZoomTablet: Number(e.target.value) }))}
                                  className="w-full accent-[#0A0A0A] cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 📲 C. CELULAR / MOBILE */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-emerald-600 text-base">smartphone</span>
                                <span>Celular / Mobile (Telas Pequenas &lt; 640px Vertical)</span>
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                Recomendado: 1080x1920 (Vertical 9:16)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Unidade & Altura */}
                              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="block text-[11px] font-bold text-slate-700">Unidade de Altura:</label>
                                <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitMobile: 'vh' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      (heroForm.heroHeightUnitMobile ?? 'vh') === 'vh' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    vh (% tela)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitMobile: 'px' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      heroForm.heroHeightUnitMobile === 'px' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    px (fixo)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateHeroForm((prev) => ({ ...prev, heroHeightUnitMobile: 'auto' }))}
                                    className={`flex-1 py-1 rounded text-center cursor-pointer transition-all ${
                                      heroForm.heroHeightUnitMobile === 'auto' ? 'bg-[#0A0A0A] text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    Auto
                                  </button>
                                </div>

                                {heroForm.heroHeightUnitMobile !== 'auto' && (
                                  <div className="pt-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-bold text-slate-500">Valor da Altura:</span>
                                      <span className="text-xs font-mono font-extrabold text-[#0A0A0A]">
                                        {heroForm.heroHeightUnitMobile === 'px'
                                          ? `${heroForm.heroHeightMobilePx ?? 520}px`
                                          : `${heroForm.heroHeightMobileVh ?? 60}vh`}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={heroForm.heroHeightUnitMobile === 'px' ? 200 : 25}
                                      max={heroForm.heroHeightUnitMobile === 'px' ? 900 : 100}
                                      step={heroForm.heroHeightUnitMobile === 'px' ? 10 : 5}
                                      value={
                                        heroForm.heroHeightUnitMobile === 'px'
                                          ? (heroForm.heroHeightMobilePx ?? 520)
                                          : (heroForm.heroHeightMobileVh ?? 60)
                                      }
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (heroForm.heroHeightUnitMobile === 'px') {
                                          updateHeroForm((prev) => ({ ...prev, heroHeightMobilePx: val }));
                                        } else {
                                          updateHeroForm((prev) => ({ ...prev, heroHeightMobileVh: val }));
                                        }
                                      }}
                                      className="w-full accent-[#0A0A0A] cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Modo de Encaixe & Posição */}
                              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Corte / Encaixe (`object-fit`):</label>
                                  <select
                                    value={heroForm.heroObjectFitMobile || 'cover'}
                                    onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroObjectFitMobile: e.target.value as any }))}
                                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 bg-white font-semibold outline-none focus:border-[#0A0A0A]"
                                  >
                                    <option value="cover">Preencher Corte Inteligente (Cover)</option>
                                    <option value="contain">Mostrar Foto Completa sem Cortar (Contain)</option>
                                    <option value="fill">Esticar na Tela Inteira (Fill)</option>
                                    <option value="scale-down">Manter Tamanho Original (Scale Down)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Posição Focal (`object-position`):</label>
                                  <select
                                    value={heroForm.heroObjectPositionMobile || 'center'}
                                    onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroObjectPositionMobile: e.target.value as any }))}
                                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 bg-white font-semibold outline-none focus:border-[#0A0A0A]"
                                  >
                                    <option value="center">Centralizado no Meio</option>
                                    <option value="top">Alinhado no Topo</option>
                                    <option value="bottom">Alinhado na Base</option>
                                    <option value="left">Alinhado à Esquerda</option>
                                    <option value="right">Alinhado à Direita</option>
                                    <option value="top center">Topo Centro</option>
                                    <option value="bottom center">Base Centro</option>
                                  </select>
                                </div>
                              </div>

                              {/* Escala / Zoom */}
                              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[11px] font-bold text-slate-700">Zoom / Escala da Foto:</label>
                                  <span className="text-xs font-mono font-bold text-[#0A0A0A]">
                                    {heroForm.heroImageZoomMobile ?? 100}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Ajuste para deixar margem livre no topo/base no celular.
                                </p>
                                <input
                                  type="range"
                                  min="80"
                                  max="180"
                                  step="2"
                                  value={heroForm.heroImageZoomMobile ?? 100}
                                  onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroImageZoomMobile: Number(e.target.value) }))}
                                  className="w-full accent-[#0A0A0A] cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* 4. Intensidade do Escurecimento (Overlay) */}
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[#0A0A0A] text-base">contrast</span>
                            <span>Intensidade de Escurecimento (Overlay Hero)</span>
                          </label>
                          <span className="text-xs font-mono font-bold text-[#0A0A0A] bg-gold-100 px-2.5 py-0.5 rounded-md border border-gold-200">
                            {heroForm.heroOverlayOpacity ?? 70}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Ajuste a opacidade do filtro escuro sobre a imagem de fundo para calibrar a legibilidade do texto e a visibilidade da foto.
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[10px] font-bold text-slate-400">0% (Claro)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={heroForm.heroOverlayOpacity ?? 70}
                            onChange={(e) => updateHeroForm({ ...heroForm, heroOverlayOpacity: Number(e.target.value) })}
                            className="w-full accent-[#0A0A0A] cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-slate-400">100% (Escuro)</span>
                        </div>
                      </div>

                      {/* 5. Visibilidade dos Elementos e Alinhamento do Conteúdo */}
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/80 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="material-symbols-outlined text-[#0A0A0A] text-base">tune</span>
                          <span>Ativar/Desativar Elementos e Alinhamento</span>
                        </div>

                        {/* Toggles de Visibilidade */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-all text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={heroForm.showHeroTag ?? true}
                              onChange={(e) => updateHeroForm((prev) => ({ ...prev, showHeroTag: e.target.checked }))}
                              className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                            />
                            <span>Selo / Tag Superior</span>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-all text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={heroForm.showHeroTitle ?? true}
                              onChange={(e) => updateHeroForm((prev) => ({ ...prev, showHeroTitle: e.target.checked }))}
                              className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                            />
                            <span>Título Principal</span>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-all text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={heroForm.showHeroSubtitle ?? true}
                              onChange={(e) => updateHeroForm((prev) => ({ ...prev, showHeroSubtitle: e.target.checked }))}
                              className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                            />
                            <span>Subtítulo</span>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-all text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={heroForm.showHeroIcons ?? true}
                              onChange={(e) => updateHeroForm((prev) => ({ ...prev, showHeroIcons: e.target.checked }))}
                              className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                            />
                            <span>Ícones de Destaque</span>
                          </label>
                        </div>

                        {/* Texto da Tag */}
                        {(heroForm.showHeroTag ?? true) && (
                          <div className="pt-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto da Tag / Selo:</label>
                            <input
                              type="text"
                              value={heroForm.heroTagText || 'Líder em Transporte Executivo'}
                              onChange={(e) => updateHeroForm((prev) => ({ ...prev, heroTagText: e.target.value }))}
                              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                              placeholder="Líder em Transporte Executivo..."
                            />
                          </div>
                        )}

                        {/* Alinhamento Horizontal */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <label className="block text-[11px] font-bold text-slate-700">Alinhamento Horizontal do Texto:</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => updateHeroForm((prev) => ({ ...prev, heroTextAlign: 'left' }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border cursor-pointer transition-all ${
                                (heroForm.heroTextAlign ?? 'left') === 'left'
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">format_align_left</span>
                              <span>Esquerda</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateHeroForm((prev) => ({ ...prev, heroTextAlign: 'center' }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border cursor-pointer transition-all ${
                                (heroForm.heroTextAlign ?? 'left') === 'center'
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">format_align_center</span>
                              <span>Centro</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateHeroForm((prev) => ({ ...prev, heroTextAlign: 'right' }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border cursor-pointer transition-all ${
                                (heroForm.heroTextAlign ?? 'left') === 'right'
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">format_align_right</span>
                              <span>Direita</span>
                            </button>
                          </div>
                        </div>

                        {/* Posicionamento Vertical */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <label className="block text-[11px] font-bold text-slate-700">Posicionamento Vertical na Tela:</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => updateHeroForm((prev) => ({ ...prev, heroVerticalAlign: 'top' }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border cursor-pointer transition-all ${
                                (heroForm.heroVerticalAlign ?? 'center') === 'top'
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">vertical_align_top</span>
                              <span>Superior</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateHeroForm((prev) => ({ ...prev, heroVerticalAlign: 'center' }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border cursor-pointer transition-all ${
                                (heroForm.heroVerticalAlign ?? 'center') === 'center'
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">vertical_align_center</span>
                              <span>Centro</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateHeroForm((prev) => ({ ...prev, heroVerticalAlign: 'bottom' }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border cursor-pointer transition-all ${
                                (heroForm.heroVerticalAlign ?? 'center') === 'bottom'
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">vertical_align_bottom</span>
                              <span>Inferior</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Preview Box com seletor de tela */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 flex flex-col items-center justify-start">
                    <span className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Preview em Tempo Real</span>

                    {/* Selector de Dispositivos e Temas */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-xs">
                      {/* Dispositivos */}
                      <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            previewDevice === 'desktop' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">desktop_windows</span>
                          <span>Desktop</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewDevice('tablet')}
                          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            previewDevice === 'tablet' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">tablet_mac</span>
                          <span>Tablet</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            previewDevice === 'mobile' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">smartphone</span>
                          <span>Mobile</span>
                        </button>
                      </div>

                      {/* Temas */}
                      <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPreviewTheme('dark')}
                          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            previewTheme === 'dark' ? 'bg-slate-900 text-amber-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">dark_mode</span>
                          <span>Escuro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewTheme('light')}
                          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            previewTheme === 'light' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">light_mode</span>
                          <span>Claro</span>
                        </button>
                      </div>
                    </div>

                    {/* Mockup Container */}
                    <div className={`relative overflow-hidden transition-all duration-300 shadow-xl border border-slate-300 rounded-2xl ${
                      previewDevice === 'desktop'
                        ? 'w-full aspect-video'
                        : previewDevice === 'tablet'
                        ? 'w-[80%] aspect-[4/3]'
                        : 'w-[220px] aspect-[9/16]'
                    }`}>
                      <img
                        src={
                          previewDevice === 'mobile'
                            ? (previewTheme === 'light'
                                ? (heroForm.heroBgImageMobileLight || heroForm.heroBgImageMobile || heroForm.heroBgImage)
                                : (heroForm.heroBgImageMobile || heroForm.heroBgImage))
                            : previewDevice === 'tablet'
                            ? (previewTheme === 'light'
                                ? (heroForm.heroBgImageTabletLight || heroForm.heroBgImageTablet || heroForm.heroBgImage)
                                : (heroForm.heroBgImageTablet || heroForm.heroBgImage))
                            : (previewTheme === 'light'
                                ? (heroForm.heroBgImageLight || heroForm.heroBgImage)
                                : heroForm.heroBgImage)
                        }
                        alt="Hero Device Preview"
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      {/* Dynamic Overlay and Content Preview */}
                      <div
                        className={`absolute inset-0 p-4 flex flex-col text-white transition-all duration-200 ${
                          (heroForm.heroVerticalAlign === 'top') ? 'justify-start' : (heroForm.heroVerticalAlign === 'bottom') ? 'justify-end' : 'justify-center'
                        } ${
                          (heroForm.heroTextAlign === 'center') ? 'items-center text-center' : (heroForm.heroTextAlign === 'right') ? 'items-end text-right' : 'items-start text-left'
                        }`}
                        style={{
                          background: `linear-gradient(to top, rgba(28,27,27, ${Math.min(1, (((heroForm.heroOverlayOpacity ?? 70) / 100) * 1.2)).toFixed(2)}), rgba(28,27,27, ${(((heroForm.heroOverlayOpacity ?? 70) / 100) * 0.4).toFixed(2)}))`
                        }}
                      >
                        {(heroForm.showHeroTag ?? true) && (
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-gold-300 bg-gold-950/60 px-2 py-0.5 rounded-full border border-gold-400/30 mb-1">
                            {heroForm.heroTagText || 'Líder em Transporte Executivo'}
                          </span>
                        )}

                        {(heroForm.showHeroTitle ?? true) && (
                          <p className={`font-bold leading-tight mb-1 ${previewDevice === 'mobile' ? 'text-xs' : 'text-sm'}`}>
                            {heroForm.heroTitle}
                          </p>
                        )}

                        {(heroForm.showHeroSubtitle ?? true) && (
                          <p className="text-[10px] text-slate-200 line-clamp-2 mb-2">{heroForm.heroSubtitle}</p>
                        )}

                        {(heroForm.showHeroIcons ?? true) && (
                          <div className="flex items-center gap-2 text-[9px] text-gold-200">
                            <span className="flex items-center gap-0.5">✓ Motoristas</span>
                            <span className="flex items-center gap-0.5">★ Frota</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Gerenciador de Slides do Carrossel Hero */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A] text-2xl">view_carousel</span>
                      <h3 className="text-lg font-bold text-slate-900">Gerenciador de Slides do Carrossel Hero</h3>
                      <span className="bg-gold-100 text-[#0A0A0A] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-gold-200">
                        Até 5+ Capas Rotativas
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Cadastre e edite cada slide do carrossel da Capa Hero com imagens customizadas por tela (Desktop, Tablet, Celular) e por tema (Claro / Escuro).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddHeroSlide}
                      className="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>Adicionar Novo Slide Hero</span>
                    </button>
                  </div>
                </div>

                {/* Configurações Gerais do Carrossel (Auto-Slide & Tempo) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A]">autorenew</span>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">Troca Automática de Slides (Auto-Slide)</label>
                        <span className="text-[10px] text-slate-500">Avança automaticamente os slides em fila</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroForm.heroAutoSlideEnabled ?? true}
                      onChange={(e) => {
                        const newHeroForm = { ...heroForm, heroAutoSlideEnabled: e.target.checked };
                        setHeroForm(newHeroForm);
                        onUpdateInstitutional(newHeroForm);
                      }}
                      className="w-5 h-5 accent-[#0A0A0A] cursor-pointer rounded"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600">timer</span>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">Tempo de Permanência</label>
                        <span className="text-[10px] text-slate-500">Intervalo de troca entre slides</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={heroForm.heroAutoSlideInterval || 6000}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newHeroForm = { ...heroForm, heroAutoSlideInterval: val };
                          setHeroForm(newHeroForm);
                          onUpdateInstitutional(newHeroForm);
                        }}
                        className="border border-slate-200 rounded-lg text-xs font-bold px-3 py-1.5 bg-slate-50 text-slate-900 outline-none focus:border-[#0A0A0A]"
                      >
                        <option value={4000}>4 Segundos</option>
                        <option value={6000}>6 Segundos (Padrão)</option>
                        <option value={8000}>8 Segundos</option>
                        <option value={10000}>10 Segundos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lista de Cards de Cada Slide */}
                <div className="space-y-6">
                  {getHeroSlides().map((slide, index) => (
                    <div
                      key={slide.id || index}
                      className={`rounded-2xl border p-5 transition-all shadow-sm space-y-5 ${
                        slide.active !== false
                          ? 'bg-white border-slate-200/90'
                          : 'bg-slate-50/80 border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Top Bar do Card do Slide */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-[#0A0A0A] text-white font-mono font-extrabold text-sm flex items-center justify-center shadow-sm">
                            #{index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">
                              {slide.titulo || `Slide ${index + 1}`}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {slide.tag || 'Slide Hero'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Active Switch */}
                          <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.active !== false}
                              onChange={(e) => handleUpdateHeroSlide(slide.id, 'active', e.target.checked)}
                              className="accent-[#0A0A0A] cursor-pointer"
                            />
                            <span>{slide.active !== false ? 'Ativo no Site' : 'Inativo'}</span>
                          </label>

                          {/* Order Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveHeroSlide(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Mover para Cima"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                          </button>

                          {/* Order Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveHeroSlide(index, 'down')}
                            disabled={index === getHeroSlides().length - 1}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Mover para Baixo"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteHeroSlide(slide.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer transition-colors"
                            title="Excluir Slide"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Formulário de Textos do Slide */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Tag / Categoria do Slide:</label>
                          <input
                            type="text"
                            value={slide.tag || ''}
                            onChange={(e) => handleUpdateHeroSlide(slide.id, 'tag', e.target.value)}
                            placeholder="Ex: Aeroportos & Transfers VIP"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-[#0A0A0A] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Título do Slide:</label>
                          <input
                            type="text"
                            value={slide.titulo || ''}
                            onChange={(e) => handleUpdateHeroSlide(slide.id, 'titulo', e.target.value)}
                            placeholder="Ex: Mobilidade Corporativa..."
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-[#0A0A0A] outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Subtítulo / Descrição:</label>
                          <input
                            type="text"
                            value={slide.subtitulo || ''}
                            onChange={(e) => handleUpdateHeroSlide(slide.id, 'subtitulo', e.target.value)}
                            placeholder="Ex: Transporte executivo com motorista bilíngue..."
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-[#0A0A0A] outline-none"
                          />
                        </div>
                      </div>

                      {/* Editor das Imagens por Dispositivo e por Tema do Slide */}
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-gold-600 text-sm">photo_library</span>
                            <span>Imagens do Slide #{index + 1} Adaptadas por Dispositivo (Tema Escuro & Claro)</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSyncSlideImageToAllVariants(slide.id)}
                              className="text-[10px] bg-gold-100 hover:bg-gold-200 text-[#0A0A0A] font-bold px-2 py-1 rounded-lg border border-gold-200 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Aplica a imagem Desktop Escuro para todas as outras 5 variações deste slide (Tablet, Mobile, Tema Claro)"
                            >
                              <span className="material-symbols-outlined text-[13px]">sync</span>
                              <span>Sincronizar em Todas as Telas</span>
                            </button>
                            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">3 Telas x 2 Temas</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                          {/* 🖥️ 1. DESKTOP */}
                          <div className="p-3.5 border border-gold-100 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-gold-600 text-sm">desktop_windows</span>
                                <span>Desktop</span>
                              </span>
                              <span className="text-[9px] bg-gold-50 text-gold-700 font-bold px-1.5 py-0.5 rounded">16:9</span>
                            </div>

                            {/* Dark */}
                            <div className="p-2.5 bg-slate-900 rounded-lg text-white space-y-1.5 border border-slate-800">
                              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-amber-400 text-xs">dark_mode</span>
                                  <span>Escuro</span>
                                </span>
                                {slide.desktopDark && <span className="text-[9px] text-emerald-400">✓ OK</span>}
                              </div>
                              {(slide.desktopDark || heroForm.heroBgImage) && (
                                <img src={slide.desktopDark || heroForm.heroBgImage} alt="Desktop Dark" className="h-12 w-full object-cover rounded border border-slate-700" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadImageToCloudinary(file);
                                    if (res.url) handleUpdateHeroSlide(slide.id, 'desktopDark', res.url);
                                  } catch (err) {
                                    console.error('Upload desktopDark error:', err);
                                  }
                                }}
                                className="block w-full text-[10px] text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-slate-700 file:text-white cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.desktopDark || ''}
                                onChange={(e) => handleUpdateHeroSlide(slide.id, 'desktopDark', e.target.value)}
                                placeholder="URL Imagem Escura..."
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-white outline-none font-mono"
                              />
                            </div>

                            {/* Light */}
                            <div className="p-2.5 bg-amber-50/50 rounded-lg text-slate-800 space-y-1.5 border border-amber-200/60">
                              <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-amber-600 text-xs">light_mode</span>
                                  <span>Claro</span>
                                </span>
                                {slide.desktopLight && <span className="text-[9px] text-emerald-600">✓ OK</span>}
                              </div>
                              {(slide.desktopLight || heroForm.heroBgImageLight || heroForm.heroBgImage) && (
                                <img src={slide.desktopLight || heroForm.heroBgImageLight || heroForm.heroBgImage} alt="Desktop Light" className="h-12 w-full object-cover rounded border border-amber-200" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadImageToCloudinary(file);
                                    if (res.url) handleUpdateHeroSlide(slide.id, 'desktopLight', res.url);
                                  } catch (err) {
                                    console.error('Upload desktopLight error:', err);
                                  }
                                }}
                                className="block w-full text-[10px] text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-amber-100 file:text-amber-900 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.desktopLight || ''}
                                onChange={(e) => handleUpdateHeroSlide(slide.id, 'desktopLight', e.target.value)}
                                placeholder="URL Imagem Clara..."
                                className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-[10px] text-slate-900 outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* 📱 2. TABLET */}
                          <div className="p-3.5 border border-amber-100 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-amber-600 text-sm">tablet_mac</span>
                                <span>Tablet</span>
                              </span>
                              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">4:3</span>
                            </div>

                            {/* Dark */}
                            <div className="p-2.5 bg-slate-900 rounded-lg text-white space-y-1.5 border border-slate-800">
                              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-amber-400 text-xs">dark_mode</span>
                                  <span>Tablet Escuro</span>
                                </span>
                              </div>
                              {(slide.tabletDark || heroForm.heroBgImageTablet || heroForm.heroBgImage) && (
                                <img src={slide.tabletDark || heroForm.heroBgImageTablet || heroForm.heroBgImage} alt="Tablet Dark" className="h-12 w-full object-cover rounded border border-slate-700" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadImageToCloudinary(file);
                                    if (res.url) handleUpdateHeroSlide(slide.id, 'tabletDark', res.url);
                                  } catch (err) {
                                    console.error('Upload tabletDark error:', err);
                                  }
                                }}
                                className="block w-full text-[10px] text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-slate-700 file:text-white cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.tabletDark || ''}
                                onChange={(e) => handleUpdateHeroSlide(slide.id, 'tabletDark', e.target.value)}
                                placeholder="URL Tablet Escuro..."
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-white outline-none font-mono"
                              />
                            </div>

                            {/* Light */}
                            <div className="p-2.5 bg-amber-50/50 rounded-lg text-slate-800 space-y-1.5 border border-amber-200/60">
                              <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-amber-600 text-xs">light_mode</span>
                                  <span>Tablet Claro</span>
                                </span>
                              </div>
                              {(slide.tabletLight || heroForm.heroBgImageTabletLight || heroForm.heroBgImageLight || heroForm.heroBgImage) && (
                                <img src={slide.tabletLight || heroForm.heroBgImageTabletLight || heroForm.heroBgImageLight || heroForm.heroBgImage} alt="Tablet Light" className="h-12 w-full object-cover rounded border border-amber-200" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadImageToCloudinary(file);
                                    if (res.url) handleUpdateHeroSlide(slide.id, 'tabletLight', res.url);
                                  } catch (err) {
                                    console.error('Upload tabletLight error:', err);
                                  }
                                }}
                                className="block w-full text-[10px] text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-amber-100 file:text-amber-900 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.tabletLight || ''}
                                onChange={(e) => handleUpdateHeroSlide(slide.id, 'tabletLight', e.target.value)}
                                placeholder="URL Tablet Claro..."
                                className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-[10px] text-slate-900 outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* 📲 3. CELULAR / MOBILE */}
                          <div className="p-3.5 border border-emerald-200 rounded-xl bg-emerald-50/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-emerald-600 text-sm">smartphone</span>
                                <span>Celular (Vertical)</span>
                              </span>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">9:16</span>
                            </div>

                            {/* Dark */}
                            <div className="p-2.5 bg-slate-900 rounded-lg text-white space-y-1.5 border border-slate-800">
                              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-amber-400 text-xs">dark_mode</span>
                                  <span>Celular Escuro</span>
                                </span>
                              </div>
                              {(slide.mobileDark || heroForm.heroBgImageMobile || heroForm.heroBgImage) && (
                                <img src={slide.mobileDark || heroForm.heroBgImageMobile || heroForm.heroBgImage} alt="Mobile Dark" className="h-16 w-full object-cover rounded border border-slate-700" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadImageToCloudinary(file);
                                    if (res.url) handleUpdateHeroSlide(slide.id, 'mobileDark', res.url);
                                  } catch (err) {
                                    console.error('Upload mobileDark error:', err);
                                  }
                                }}
                                className="block w-full text-[10px] text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-slate-700 file:text-white cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.mobileDark || ''}
                                onChange={(e) => handleUpdateHeroSlide(slide.id, 'mobileDark', e.target.value)}
                                placeholder="URL Celular Escuro..."
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-white outline-none font-mono"
                              />
                            </div>

                            {/* Light */}
                            <div className="p-2.5 bg-white rounded-lg text-slate-800 space-y-1.5 border border-emerald-200">
                              <div className="flex items-center justify-between text-[10px] text-emerald-900 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-amber-600 text-xs">light_mode</span>
                                  <span>Celular Claro</span>
                                </span>
                              </div>
                              {(slide.mobileLight || heroForm.heroBgImageMobileLight || heroForm.heroBgImageMobile || heroForm.heroBgImage) && (
                                <img src={slide.mobileLight || heroForm.heroBgImageMobileLight || heroForm.heroBgImageMobile || heroForm.heroBgImage} alt="Mobile Light" className="h-16 w-full object-cover rounded border border-emerald-200" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadImageToCloudinary(file);
                                    if (res.url) handleUpdateHeroSlide(slide.id, 'mobileLight', res.url);
                                  } catch (err) {
                                    console.error('Upload mobileLight error:', err);
                                  }
                                }}
                                className="block w-full text-[10px] text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-emerald-100 file:text-emerald-900 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.mobileLight || ''}
                                onChange={(e) => handleUpdateHeroSlide(slide.id, 'mobileLight', e.target.value)}
                                placeholder="URL Celular Claro..."
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-900 outline-none font-mono"
                              />
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Botão CTA do Slide (Simular Viagem) */}
                      <div className="mt-4 p-3.5 border border-gold-200 rounded-xl bg-gold-50/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-gold-600 text-sm">ads_click</span>
                            Botão CTA (Solicitar Orçamento)
                          </label>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.ctaEnabled !== false}
                              onChange={(e) => handleUpdateHeroSlide(slide.id, 'ctaEnabled', e.target.checked)}
                              className="w-3.5 h-3.5 accent-[#0A0A0A]"
                            />
                            Exibir
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Texto do botão</label>
                          <input
                            type="text"
                            value={slide.ctaText || 'Solicitar Orçamento'}
                            onChange={(e) => handleUpdateHeroSlide(slide.id, 'ctaText', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-900 outline-none focus:border-gold-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Posição (grade 3x3)</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'] as const).map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => handleUpdateHeroSlide(slide.id, 'ctaPosition', pos)}
                                className={`py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-colors ${
                                  (slide.ctaPosition || 'bottom-left') === pos
                                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-gold-400'
                                }`}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        </div>

                        <HeroCtaResponsivePreview
                          slide={slide}
                          onUpdate={(field, value) => handleUpdateHeroSlide(slide.id, field, value)}
                        />

                        <div className="grid grid-cols-3 gap-2">
                          {(['Desktop', 'Tablet', 'Mobile'] as const).map((dev) => {
                            const xKey = getCtaPercentKey(dev, 'X');
                            const yKey = getCtaPercentKey(dev, 'Y');
                            return (
                              <div key={dev} className="space-y-1.5 bg-white p-2 rounded-lg border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">{dev} (%)</span>
                                <div className="flex items-center gap-1">
                                  <label className="text-[9px] text-slate-400 w-3">X</label>
                                  <input
                                    type="number"
                                    min={-45}
                                    max={45}
                                    value={typeof slide[xKey] === 'number' ? slide[xKey] : 0}
                                    onChange={(e) => handleUpdateHeroSlide(slide.id, xKey, Math.max(-45, Math.min(45, parseInt(e.target.value) || 0)))}
                                    className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px] text-slate-900 outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-[9px] text-slate-400 w-3">Y</label>
                                  <input
                                    type="number"
                                    min={-45}
                                    max={45}
                                    value={typeof slide[yKey] === 'number' ? slide[yKey] : 0}
                                    onChange={(e) => handleUpdateHeroSlide(slide.id, yKey, Math.max(-45, Math.min(45, parseInt(e.target.value) || 0)))}
                                    className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px] text-slate-900 outline-none"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Secondary Banners Table */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Banners Rotativos</h3>
                    <p className="text-xs text-slate-500">Gerencie imagens e anúncios complementares da página inicial.</p>
                  </div>
                  <button
                    onClick={() => setEditingBanner({ titulo: '', status: 'Ativo', image: ASSET_IMAGES.bannerTransfer })}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                    <span>Novo Banner</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <th className="px-6 py-3">Prévia</th>
                        <th className="px-6 py-3">Título</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {banners.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              <img src={b.image} alt={b.titulo} className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{b.titulo}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleBannerStatus(b.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                b.status === 'Ativo'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {b.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => setEditingBanner(b)}
                              className="text-[#0A0A0A] hover:bg-gold-50 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Editar Banner"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(b.id)}
                              className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Banner"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Card de Atalho para os Slides do "Sobre Nós" */}
              <section className="bg-gold-50/60 dark:bg-gold-950/40 rounded-2xl border border-gold-100 dark:border-gold-900 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">collections</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Carrossel de Imagens - Seção "Sobre a Confficar"</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gerencie, envie arquivos do computador ou troque URLs e legendas do carrossel da seção Sobre Nós.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSectionChange('conteudo')}
                  className="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Gerenciar Slides do Sobre Nós</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </section>
            </div>
          )}

          {/* Section: Gestão de Serviços */}
          {currentSection === 'servicos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Cards de Serviços</h1>
                  <p className="text-xs text-slate-500">Configure os serviços oferecidos e personalize o efeito visual de marca d'água nos cards.</p>
                </div>
                <button
                  onClick={() => setEditingService({ titulo: '', descricao: '', icon: 'business_center' })}
                  className="bg-[#0A0A0A] text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A] flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Adicionar Novo Serviço</span>
                </button>
              </div>

              {/* Card de Configuração do Efeito de Marca D'água nos Cards de Serviços */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">watermark</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Efeito Marca D'água nos Cards</h2>
                      <p className="text-xs text-slate-500">
                        Configure a exibição da logo em marca d'água nos cards de serviços (tamanho, posição, transparência e imagem).
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={heroForm.serviceWatermark?.enabled ?? false}
                      onChange={(e) => {
                        const updatedWm = {
                          ...(heroForm.serviceWatermark || { sizePx: 80, opacity: 30, position: 'top-right', showMode: 'always' }),
                          enabled: e.target.checked
                        };
                        const newForm = { ...heroForm, serviceWatermark: updatedWm };
                        setHeroForm(newForm);
                        onUpdateInstitutional(newForm);
                        triggerSaveNotification();
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A0A0A]"></div>
                    <span className="ml-3 text-xs font-bold text-slate-700">
                      {(heroForm.serviceWatermark?.enabled ?? false) ? 'Ativado' : 'Desativado'}
                    </span>
                  </label>
                </div>

                {(heroForm.serviceWatermark?.enabled ?? false) && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Controle do Tamanho da Logo em Pixels */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-[#0A0A0A]">aspect_ratio</span>
                            <span>Tamanho da Marca D'água</span>
                          </label>
                          <span className="text-xs font-extrabold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                            {heroForm.serviceWatermark?.sizePx ?? 80}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="260"
                          step="5"
                          value={heroForm.serviceWatermark?.sizePx ?? 80}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updatedWm = { ...(heroForm.serviceWatermark || {}), sizePx: val };
                            const newForm = { ...heroForm, serviceWatermark: updatedWm };
                            setHeroForm(newForm);
                            onUpdateInstitutional(newForm);
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Compacto (40px)</span>
                          <span>Médio (120px)</span>
                          <span>Fundo Amplo (260px)</span>
                        </div>
                      </div>

                      {/* Controle da Opacidade (%) */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-[#0A0A0A]">opacity</span>
                            <span>Opacidade / Transparência</span>
                          </label>
                          <span className="text-xs font-extrabold text-[#0A0A0A] bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                            {heroForm.serviceWatermark?.opacity ?? 30}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={heroForm.serviceWatermark?.opacity ?? 30}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updatedWm = { ...(heroForm.serviceWatermark || {}), opacity: val };
                            const newForm = { ...heroForm, serviceWatermark: updatedWm };
                            setHeroForm(newForm);
                            onUpdateInstitutional(newForm);
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Sutil (5%)</span>
                          <span>Moderado (30%)</span>
                          <span>Nítido (100%)</span>
                        </div>
                      </div>

                      {/* Posição no Card */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-base text-[#0A0A0A]">grid_view</span>
                          <span>Posição no Card</span>
                        </label>
                        <select
                          value={heroForm.serviceWatermark?.position || 'top-right'}
                          onChange={(e) => {
                            const pos = e.target.value as any;
                            const updatedWm = { ...(heroForm.serviceWatermark || {}), position: pos };
                            const newForm = { ...heroForm, serviceWatermark: updatedWm };
                            setHeroForm(newForm);
                            onUpdateInstitutional(newForm);
                          }}
                          className="w-full border border-slate-200 rounded-xl bg-white p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                        >
                          <option value="top-right">Canto Superior Direito</option>
                          <option value="bottom-right">Canto Inferior Direito</option>
                          <option value="center">Centro do Card</option>
                          <option value="top-left">Canto Superior Esquerdo</option>
                          <option value="bottom-left">Canto Inferior Esquerdo</option>
                        </select>
                      </div>

                      {/* Modo de Exibição */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-base text-[#0A0A0A]">visibility</span>
                          <span>Modo de Exibição</span>
                        </label>
                        <select
                          value={heroForm.serviceWatermark?.showMode || 'always'}
                          onChange={(e) => {
                            const mode = e.target.value as any;
                            const updatedWm = { ...(heroForm.serviceWatermark || {}), showMode: mode };
                            const newForm = { ...heroForm, serviceWatermark: updatedWm };
                            setHeroForm(newForm);
                            onUpdateInstitutional(newForm);
                          }}
                          className="w-full border border-slate-200 rounded-xl bg-white p-2.5 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                        >
                          <option value="always">Sempre Visível</option>
                          <option value="hover">Ao Passar o Mouse (Hover)</option>
                          <option value="selected">Somente Card Selecionado</option>
                        </select>
                      </div>

                      {/* Imagem da Marca D'água */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 lg:col-span-2">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-base text-[#0A0A0A]">image</span>
                          <span>Imagem da Marca D'água</span>
                        </label>
                        <p className="text-[11px] text-slate-500 mb-2">
                          Use a logo principal do site ou envie uma imagem/símbolo personalizado.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                          <div className="relative w-14 h-14 bg-slate-900 rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={heroForm.serviceWatermark?.imageUrl || logoForm.logoHeader || ASSET_IMAGES.logoHeader}
                              alt="Prévia Marca D'água"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) {
                                    const updatedWm = { ...(heroForm.serviceWatermark || {}), imageUrl: res.url };
                                    const newForm = { ...heroForm, serviceWatermark: updatedWm };
                                    setHeroForm(newForm);
                                    onUpdateInstitutional(newForm);
                                    triggerSaveNotification();
                                  }
                                } catch (err) {
                                  console.error('Erro no upload da marca d\'água:', err);
                                }
                              }}
                              className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={heroForm.serviceWatermark?.imageUrl || ''}
                              onChange={(e) => {
                                const url = e.target.value;
                                const updatedWm = { ...(heroForm.serviceWatermark || {}), imageUrl: url };
                                const newForm = { ...heroForm, serviceWatermark: updatedWm };
                                setHeroForm(newForm);
                                onUpdateInstitutional(newForm);
                              }}
                              placeholder="Ou cole a URL da imagem (deixe em branco para usar a logo padrão)"
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveHero()}
                        className="bg-[#0A0A0A] text-white font-semibold text-xs px-6 py-2.5 rounded-xl hover:bg-[#1A1A1A] cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span>Salvar Ajustes da Marca D'água</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((serv) => (
                  <div
                    key={serv.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#0A0A0A] transition-all group"
                  >
                    <div>
                      {/* Image Preview Header in CMS */}
                      {serv.image ? (
                        <div className="relative h-32 w-full mb-4 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                          <img
                            src={serv.image}
                            alt={serv.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">image</span>
                            <span>Imagem Personalizada</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-20 w-full mb-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 gap-1.5 text-xs">
                          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                          <span>Sem Imagem Customizada</span>
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[24px]">{serv.icon}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingService(serv)}
                            className="text-slate-500 hover:text-[#0A0A0A] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Editar Serviço"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(serv.id)}
                            className="text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Excluir Serviço"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2">{serv.titulo}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">{serv.descricao}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                      <span>Edição: {serv.ultimaEdicao}</span>
                      <span className="font-semibold text-[#0A0A0A]">Ativo na Home</span>
                    </div>
                  </div>
                ))}

                {/* Add Service Card Placeholder */}
                <div
                  onClick={() => setEditingService({ titulo: '', descricao: '', icon: 'business_center' })}
                  className="bg-slate-50 hover:bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200/80 group-hover:bg-[#0A0A0A] group-hover:text-white text-slate-500 flex items-center justify-center transition-colors mb-3">
                    <span className="material-symbols-outlined text-[28px]">add</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700">Adicionar Novo Serviço</p>
                  <p className="text-[11px] text-slate-400 mt-1">Clique para cadastrar um serviço corporativo com imagem customizada</p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Gestão de Tipos de Veículos */}
          {currentSection === 'frota' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Gestão de Tipos de Veículos</h1>
                  <p className="text-xs text-slate-500">Cadastre, organize por categorias e atualize os tipos de veículos e suas especificações técnicas.</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setEditingCategoryOldName(null);
                      setEditingCategoryNewName('');
                      setShowAddCategoryModal(true);
                    }}
                    className="bg-gold-50 dark:bg-gold-950 text-[#0A0A0A] dark:text-gold-300 hover:bg-gold-100 dark:hover:bg-gold-900 border border-gold-200 dark:border-gold-800 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">category</span>
                    <span>Gerenciar / Nova Categoria</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCustomCategoryInput('');
                      setEditingFleet({
                        nome: '',
                        categoria: allCategories[0] || 'Sedan Executivo',
                        descricao: '',
                        passageiros: '3 Passageiros',
                        malas: '3 Malas',
                        diferenciais: ['Climatizado', 'Wi-Fi'],
                        image: ASSET_IMAGES.corolla,
                      });
                      setFleetDiffInput('');
                    }}
                    className="bg-[#0A0A0A] text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-[#1A1A1A] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Novo Tipo de Veículo</span>
                  </button>
                </div>
              </div>

              {/* Category Filter & Quick Edit/Delete Bar */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrar Categoria:</span>
                  <button
                    onClick={() => setSelectedCategoryFilter('Todas')}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer font-semibold ${
                      selectedCategoryFilter === 'Todas'
                        ? 'bg-[#0A0A0A] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todas ({fleet.length})
                  </button>
                  {allCategories.map((cat) => {
                    const count = fleet.filter((f) => f.categoria === cat).length;
                    const isSelected = selectedCategoryFilter === cat;
                    return (
                      <div
                        key={cat}
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                          isSelected
                            ? 'bg-[#0A0A0A] text-white shadow-sm font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{cat}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {count}
                          </span>
                        </button>

                        {/* Quick edit & delete buttons for category */}
                        <div className="flex items-center gap-0.5 ml-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategoryOldName(cat);
                              setEditingCategoryNewName(cat);
                              setShowAddCategoryModal(true);
                            }}
                            className={`p-0.5 rounded hover:bg-black/20 cursor-pointer ${
                              isSelected ? 'text-white' : 'text-slate-500 hover:text-[#0A0A0A]'
                            }`}
                            title={`Renomear categoria "${cat}"`}
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat);
                            }}
                            className={`p-0.5 rounded hover:bg-black/20 cursor-pointer ${
                              isSelected ? 'text-rose-200 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                            }`}
                            title={`Excluir categoria "${cat}"`}
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryOldName(null);
                    setEditingCategoryNewName('');
                    setShowAddCategoryModal(true);
                  }}
                  className="text-xs font-bold text-[#0A0A0A] dark:text-gold-400 hover:underline flex items-center gap-1 px-2 py-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  <span>Gerenciar Categorias</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {fleet
                  .filter((item) => {
                    const matchesSearch =
                      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.categoria.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory =
                      selectedCategoryFilter === 'Todas' || item.categoria === selectedCategoryFilter;
                    return matchesSearch && matchesCategory;
                  })
                  .map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col sm:flex-row">
                      <div className="sm:w-2/5 bg-slate-100 relative h-48 sm:h-auto">
                        <img src={item.image} alt={item.nome} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                          {item.categoria}
                        </span>
                      </div>

                      <div className="sm:w-3/5 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-base font-bold text-slate-900">{item.nome}</h3>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveFleet(item.id, 'up')}
                                title="Mover para cima"
                                className="text-slate-400 hover:text-[#0A0A0A] cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveFleet(item.id, 'down')}
                                title="Mover para baixo"
                                className="text-slate-400 hover:text-[#0A0A0A] cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsCustomCategory(false);
                                  setCustomCategoryInput('');
                                  setEditingFleet(item);
                                  setFleetDiffInput('');
                                }}
                                className="text-slate-400 hover:text-[#0A0A0A]"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{item.modeloSpecs}</p>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-[#0A0A0A]">person</span>
                              <span>{item.passageiros}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-[#0A0A0A]">luggage</span>
                              <span>{item.malas}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <button
                            onClick={() => {
                              setIsCustomCategory(false);
                              setCustomCategoryInput('');
                              setEditingFleet(item);
                                setFleetDiffInput('');
                            }}
                            className="text-[#0A0A0A] font-semibold hover:underline"
                          >
                            Editar Detalhes
                          </button>
                          <button
                            onClick={() => handleDeleteFleet(item.id)}
                            className="text-rose-600 font-semibold hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {fleet.filter((item) => {
                  const matchesSearch =
                    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.categoria.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory =
                    selectedCategoryFilter === 'Todas' || item.categoria === selectedCategoryFilter;
                  return matchesSearch && matchesCategory;
                }).length === 0 && (
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                    <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">directions_car</span>
                    <p className="text-sm font-semibold">Nenhum veículo encontrado nesta categoria ou busca.</p>
                    <button
                      onClick={() => {
                        setSelectedCategoryFilter('Todas');
                        setSearchTerm('');
                      }}
                      className="mt-3 text-xs text-[#0A0A0A] font-bold hover:underline"
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Acesso TransporteApp */}
          {currentSection === 'painel_externo' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Acessar Sistema</h1>
                  <p className="text-xs text-slate-500">O gerenciamento operacional de reservas, motoristas e rotas é realizado no aplicativo TransporteApp.</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sistema Conectado</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6 max-w-3xl mx-auto my-8">
                <div className="w-20 h-20 rounded-full bg-gold-50 text-[#0A0A0A] flex items-center justify-center mx-auto border border-gold-100 shadow-inner">
                  <span className="material-symbols-outlined text-[40px]">directions_car</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Portal de Gestão - TransporteApp</h2>
                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    As solicitações de viagens, itinerários de executivos, alocação de frota e faturamento de corridas são operadas através do aplicativo dedicado TransporteApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[22px] mb-1">dashboard_customize</span>
                    <p className="font-bold text-xs text-slate-900">Controle Operacional</p>
                    <p className="text-[11px] text-slate-500 mt-1">Status de trajetos, motoristas e horários em tempo real.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[22px] mb-1">security</span>
                    <p className="font-bold text-xs text-slate-900">Acesso Seguro (SSO)</p>
                    <p className="text-[11px] text-slate-500 mt-1">Autenticação única para a equipe corporativa e logística.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="material-symbols-outlined text-[#0A0A0A] text-[22px] mb-1">analytics</span>
                    <p className="font-bold text-xs text-slate-900">Relatórios & Billing</p>
                    <p className="text-[11px] text-slate-500 mt-1">Faturamento consolidado por centro de custo e empresa.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => onViewChange('public')}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Voltar ao Site Público
                  </button>
                  <a
                    href="https://app.grupoconficar.com.br/login"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-3 bg-[#0A0A0A] text-white font-semibold text-xs rounded-xl hover:bg-[#1A1A1A] transition-all shadow flex items-center justify-center gap-2"
                  >
                    <span>Acessar Sistema</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Section: Depoimentos */}
          {currentSection === 'depoimentos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A0A0A] dark:text-gold-400">format_quote</span>
                    <span>Depoimentos Corporativos</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Edite todos os campos dos depoimentos, faça upload de fotos, reordene arrastando ou com os botões e salve na nuvem.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setEditingTestimonial({
                        autor: '',
                        cargo: 'Executivo',
                        empresa: '',
                        texto: '',
                        foto: '',
                        rating: 5,
                      })
                    }
                    className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>+ Novo Depoimento</span>
                  </button>

                  <button
                    onClick={handleSaveAllTestimonials}
                    className="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Salvar Depoimentos</span>
                  </button>
                </div>
              </div>

              {/* Drag and drop reordering tip banner */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">drag_indicator</span>
                  <span>
                    <strong>Reordenação Ativa:</strong> Arraste qualquer card pelo ícone de arraste ou use as setas <strong className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">▲ Subir</strong> e <strong className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">▼ Descer</strong> para definir a ordem no site.
                  </span>
                </div>
                <span className="text-[11px] font-bold bg-amber-200 dark:bg-amber-800 px-2.5 py-0.5 rounded-full">
                  {testimonialsList.length} Depoimentos
                </span>
              </div>

              {/* Cards List with Inline Editable Fields and Drag Handles */}
              <div className="space-y-4">
                {testimonialsList.map((t, index) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleTestimonialDragStart(e, index)}
                    onDragOver={(e) => handleTestimonialDragOver(e, index)}
                    onDrop={(e) => handleTestimonialDrop(e, index)}
                    className={`p-5 md:p-6 rounded-2xl border transition-all ${
                      dragOverTestimonialIndex === index
                        ? 'border-gold-500 ring-2 ring-gold-200 dark:ring-gold-900 bg-gold-50/40 dark:bg-gold-950/30 scale-[1.01]'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-sm hover:border-slate-700'
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-gold-200'
                    }`}
                  >
                    {/* Top Bar of Card: Reorder handle, position badge, move up/down, edit modal, delete */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200/20">
                      <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-gold-600 dark:hover:text-gold-400 flex items-center justify-center transition-colors"
                          title="Arraste para reordenar este depoimento"
                        >
                          <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                        </div>

                        {/* Order Badge */}
                        <span className="text-[11px] font-black px-2.5 py-1 rounded-md bg-[#0A0A0A] text-white">
                          #{index + 1}
                        </span>

                        {/* Move Up & Move Down buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveTestimonial(index, 'up')}
                            className={`p-1 rounded transition-colors ${
                              index === 0
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#0A0A0A] cursor-pointer'
                            }`}
                            title="Mover para cima"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === testimonialsList.length - 1}
                            onClick={() => handleMoveTestimonial(index, 'down')}
                            className={`p-1 rounded transition-colors ${
                              index === testimonialsList.length - 1
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#0A0A0A] cursor-pointer'
                            }`}
                            title="Mover para baixo"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTestimonial(t)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gold-50 dark:bg-gold-950 text-[#0A0A0A] dark:text-gold-300 hover:bg-gold-100 dark:hover:bg-gold-900 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Editar em Modal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonialItem(t.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>

                    {/* Editable Form Fields inside the Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Autor */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Nome do Autor / Executivo
                        </label>
                        <input
                          type="text"
                          value={t.autor}
                          onChange={(e) => handleInlineTestimonialChange(t.id, 'autor', e.target.value)}
                          placeholder="Ex: Carlos Eduardo"
                          className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none ${inputBgClass}`}
                        />
                      </div>

                      {/* Cargo */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={t.cargo}
                          onChange={(e) => handleInlineTestimonialChange(t.id, 'cargo', e.target.value)}
                          placeholder="Ex: Diretor de Logística"
                          className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                        />
                      </div>

                      {/* Empresa */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={t.empresa}
                          onChange={(e) => handleInlineTestimonialChange(t.id, 'empresa', e.target.value)}
                          placeholder="Ex: Banco Itaú, Vale, Petrobras..."
                          className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                        />
                      </div>

                      {/* Texto do Depoimento */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Texto do Depoimento
                        </label>
                        <textarea
                          rows={3}
                          value={t.texto}
                          onChange={(e) => handleInlineTestimonialChange(t.id, 'texto', e.target.value)}
                          placeholder="Escreva a avaliação ou depoimento do cliente..."
                          className={`w-full border rounded-xl p-2.5 text-xs outline-none italic leading-relaxed ${inputBgClass}`}
                        />
                      </div>

                      {/* Foto e Avaliação */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Foto do Autor (Opcional)
                          </label>
                          <div className="flex items-center gap-2">
                            {t.foto ? (
                              <img src={t.foto} alt={t.autor} className="w-9 h-9 rounded-full object-cover border shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                                {t.autor ? t.autor.charAt(0).toUpperCase() : 'A'}
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadImageToCloudinary(file);
                                  if (res.url) handleInlineTestimonialChange(t.id, 'foto', res.url);
                                } catch (err) {
                                  console.error('Error uploading avatar:', err);
                                }
                              }}
                              className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Avaliação (Estrelas)
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleInlineTestimonialChange(t.id, 'rating', star)}
                                className="p-0.5 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {star <= (t.rating || 5) ? 'star' : 'star_outline'}
                                </span>
                              </button>
                            ))}
                            <span className="text-xs font-bold text-slate-500 ml-1">{t.rating || 5}/5</span>
                          </div>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}


                {testimonialsList.length === 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">format_quote</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum depoimento cadastrado</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Clique no botão abaixo para adicionar o primeiro depoimento.</p>
                    <button
                      onClick={() =>
                        setEditingTestimonial({
                          autor: '',
                          cargo: 'Diretor',
                          empresa: '',
                          texto: '',
                          rating: 5,
                        })
                      }
                      className="bg-[#0A0A0A] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A] cursor-pointer"
                    >
                      + Criar Novo Depoimento
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Save Bar */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Lembre-se de salvar suas alterações para atualizar a exibição pública do site em tempo real.
                </span>
                <button
                  type="button"
                  onClick={handleSaveAllTestimonials}
                  className="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  <span>Salvar e Sincronizar Todos os Depoimentos</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Conteúdo Geral */}
          {currentSection === 'conteudo' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Texto Institucional</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quem Somos (Resumo Home)</label>
                    <textarea
                      rows={4}
                      value={heroForm.quemSomos}
                      onChange={(e) => setHeroForm({ ...heroForm, quemSomos: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:border-[#0A0A0A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nossa Missão</label>
                    <textarea
                      rows={3}
                      value={heroForm.missao}
                      onChange={(e) => setHeroForm({ ...heroForm, missao: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:border-[#0A0A0A] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveHero()}
                    className="bg-[#0A0A0A] text-white font-semibold text-xs px-6 py-2.5 rounded-xl hover:bg-[#1A1A1A] cursor-pointer"
                  >
                    Salvar Texto Institucional
                  </button>
                </div>
              </div>

              {/* Card de Gerenciamento do Slide / Galeria "Sobre a Confficar" */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A]">collections</span>
                      <span>Imagens do Carrossel (Seção Sobre Nós)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Troque as imagens, edite títulos, ative ou desative slides do bloco "Sobre a Confficar". As mudanças sincronizam em tempo real.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAboutSlide}
                    className="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                    <span>Adicionar Novo Slide</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getAboutSlides().map((slide, idx) => (
                    <div
                      key={slide.id || idx}
                      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                        slide.active !== false
                          ? 'bg-white border-slate-200 shadow-sm hover:border-[#0A0A0A]'
                          : 'bg-slate-50 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Imagem e Badge de Status */}
                        <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group">
                          <img src={slide.url} alt={slide.title || 'Slide'} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                slide.active !== false
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-700 text-slate-200'
                              }`}
                            >
                              {slide.active !== false ? 'Ativo' : 'Inativo / Oculto'}
                            </span>
                          </div>

                          {/* Controls Reorder & Delete */}
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleMoveAboutSlide(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Mover para esquerda/cima"
                            >
                              <span className="material-symbols-outlined text-base">arrow_back</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveAboutSlide(idx, 'down')}
                              disabled={idx === getAboutSlides().length - 1}
                              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Mover para direita/baixo"
                            >
                              <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAboutSlide(slide.id)}
                              className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                              title="Excluir Slide"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Toggle Ativo/Inativo */}
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-xs font-bold text-slate-700">Status no Site:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateAboutSlide(slide.id, 'active', slide.active === false)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              slide.active !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {slide.active !== false ? 'Desativar Slide' : 'Ativar Slide'}
                          </button>
                        </div>

                        {/* Upload e URL da Imagem */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Enviar Nova Imagem (Computador / Celular)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await uploadImageToCloudinary(file);
                                if (res.url) {
                                  handleUpdateAboutSlide(slide.id, 'url', res.url);
                                  triggerSaveNotification();
                                }
                              } catch (err) {
                                console.error('Erro ao enviar imagem do slide:', err);
                              }
                            }}
                            className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                          />

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Ou Cole a URL da Imagem
                            </label>
                            <input
                              type="text"
                              value={slide.url}
                              onChange={(e) => handleUpdateAboutSlide(slide.id, 'url', e.target.value)}
                              placeholder="https://exemplo.com/imagem.jpg"
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                            />
                          </div>
                        </div>

                        {/* Título e Subtítulo */}
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Título do Slide</label>
                            <input
                              type="text"
                              value={slide.title || ''}
                              onChange={(e) => handleUpdateAboutSlide(slide.id, 'title', e.target.value)}
                              placeholder="Ex: 15+ Anos de Atuação"
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Subtítulo do Slide</label>
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => handleUpdateAboutSlide(slide.id, 'subtitle', e.target.value)}
                              placeholder="Ex: Atendimento nacional para corporações"
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#0A0A0A] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveHero()}
                    className="bg-[#0A0A0A] text-white font-semibold text-xs px-6 py-2.5 rounded-xl hover:bg-[#1A1A1A] cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    <span>Salvar e Sincronizar Todos os Slides</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Configurações do Site */}
          {currentSection === 'configuracoes' && (
            <div className="space-y-6">
              {/* Cloud Realtime & Model Replication Card */}
              <div className={`p-6 md:p-8 rounded-2xl border transition-all ${cardBgClass}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/20 pb-6 mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">cloud_done</span>
                      <span>Modelo Replicável & Persistência em Tempo Real</span>
                    </h2>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Este site funciona com <strong>Banco de Dados na Nuvem (Firebase Cloud Firestore)</strong> ativado. Todas as edições de títulos, textos, fotos e frota são salvas instantaneamente online para todos os visitantes.
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Nuvem 100% Automática</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                      <span className="material-symbols-outlined text-amber-500 text-[20px]">download</span>
                      <span>Exportar Cópia de Segurança (JSON)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Baixe as configurações e textos atuais para importar como modelo base em outro cliente.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full mt-2 py-2 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Baixar Modelo JSON</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                      <span className="material-symbols-outlined text-emerald-500 text-[20px]">upload</span>
                      <span>Importar Modelo de Outro Cliente</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Carregue um modelo JSON salvo para replicar a estrutura completa de textos e mídias de outro cliente.
                    </p>
                    <label className="w-full mt-2 py-2 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5">
                      <span>Carregar Arquivo JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackupJSON}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Theme Settings Card */}
              <div className={`p-6 md:p-8 rounded-2xl border transition-colors ${cardBgClass}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-6 border-slate-200/20 gap-2">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0A0A0A]">palette</span>
                      <span>Tema e Aparência do Painel</span>
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Escolha o tema visual do painel administrativo. Suas preferências são salvas na sessão e mantidas entre navegações.
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border shrink-0 ${
                    isDark
                      ? 'bg-gold-950/80 text-gold-300 border-gold-800'
                      : 'bg-gold-50 text-[#0A0A0A] border-gold-100'
                  }`}>
                    {isDark ? 'Modo Escuro (Ativo)' : 'Modo Claro (Ativo)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <button
                    type="button"
                    onClick={() => handleToggleTheme('light')}
                    className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      !isDark
                        ? 'bg-gold-50/70 border-[#0A0A0A] ring-2 ring-[#0A0A0A]/20 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">light_mode</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Modo Claro (Padrão)</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Interface clara em tons suaves de cinza e branco.
                        </p>
                      </div>
                    </div>
                    {!isDark && (
                      <span className="material-symbols-outlined text-[#0A0A0A] text-[22px]">check_circle</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleTheme('dark')}
                    className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-[#0A0A0A] ring-2 ring-[#0A0A0A]/40 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 text-gold-300 flex items-center justify-center border border-slate-700 shrink-0">
                        <span className="material-symbols-outlined text-[24px]">dark_mode</span>
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Modo Escuro (Dark)</h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Cinza escuro corporativo com azul petróleo.
                        </p>
                      </div>
                    </div>
                    {isDark && (
                      <span className="material-symbols-outlined text-gold-400 text-[22px]">check_circle</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Site Default Theme Card */}
              <div className={`p-6 md:p-8 rounded-2xl border transition-colors ${cardBgClass}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/20 pb-4 mb-6 gap-2">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-gold-500">public</span>
                      <span>Tema Padrão do Site</span>
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Define o tema exibido para visitantes que ainda não escolheram manualmente. Quem já alternou no site mantém a própria escolha.
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                    (heroForm.defaultSiteTheme || 'light') === 'dark'
                      ? 'bg-gold-950/80 text-gold-300 border-gold-800'
                      : 'bg-gold-50 text-[#0A0A0A] border-gold-100'
                  }`}>
                    {(heroForm.defaultSiteTheme || 'light') === 'dark' ? 'Escuro (Padrão)' : 'Claro (Padrão)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <button
                    type="button"
                    onClick={() => setHeroForm({ ...heroForm, defaultSiteTheme: 'light' })}
                    className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      (heroForm.defaultSiteTheme || 'light') === 'light'
                        ? 'bg-gold-50/70 border-[#0A0A0A] ring-2 ring-[#0A0A0A]/20 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">light_mode</span>
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Claro (Padrão)</h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Site com fundos claros e quentes.
                        </p>
                      </div>
                    </div>
                    {(heroForm.defaultSiteTheme || 'light') === 'light' && (
                      <span className="material-symbols-outlined text-gold-500 text-[22px]">check_circle</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHeroForm({ ...heroForm, defaultSiteTheme: 'dark' })}
                    className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      (heroForm.defaultSiteTheme || 'light') === 'dark'
                        ? 'bg-slate-800 border-gold-500 ring-2 ring-gold-500/40 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 text-gold-300 flex items-center justify-center border border-slate-700 shrink-0">
                        <span className="material-symbols-outlined text-[24px]">dark_mode</span>
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Escuro (Padrão)</h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Site em preto e dourado à noite.
                        </p>
                      </div>
                    </div>
                    {(heroForm.defaultSiteTheme || 'light') === 'dark' && (
                      <span className="material-symbols-outlined text-gold-400 text-[22px]">check_circle</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Contact Settings Card */}
              <div className={`p-6 md:p-8 rounded-2xl border transition-colors ${cardBgClass}`}>
                <div className="flex items-center justify-between border-b border-slate-200/20 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Configurações de Contato & Rodapé</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Gerencie os canais de atendimento e contatos oficiais exibidos no site.
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gold-50 text-[#0A0A0A] border-gold-100'
                  }`}>
                    Canais Públicos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Telefone Principal de Atendimento</label>
                    <input
                      type="text"
                      value={heroForm.telefone || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, telefone: e.target.value })}
                      placeholder="(11) 4051-7447"
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>WhatsApp Corporativo (Link Direto)</label>
                    <input
                      type="text"
                      value={heroForm.whatsappUrl || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, whatsappUrl: e.target.value })}
                      placeholder="https://wa.me/5511940517447"
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>E-mail Comercial & Cotações</label>
                    <input
                      type="email"
                      value={heroForm.email || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, email: e.target.value })}
                      placeholder="contato@grupoconficar.com.br"
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Endereço da Sede Confficar</label>
                    <input
                      type="text"
                      value={heroForm.endereco || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, endereco: e.target.value })}
                      placeholder="Av. das Nações Unidas, 12901 - Brooklin Paulista, São Paulo - SP"
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/20 flex justify-end">
                  <button
                    onClick={() => {
                      onUpdateInstitutional(heroForm);
                      triggerSaveNotification();
                    }}
                    className="bg-[#0A0A0A] text-white font-semibold text-xs px-6 py-2.5 rounded-xl hover:bg-[#1A1A1A] cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Gestão de Usuários & Permissões (SuperAdmin) */}
          {currentSection === 'usuarios' && (
            <UserManagement isDark={isDark} />
          )}

          {/* Section 8: SEO Management System */}
          {currentSection === 'seo' && (
            <SEOManager
              seo={seo || {
                metaTitle: 'Confficar',
                metaDescription: 'Transporte executivo e transfers VIP.',
                keywords: ['transporte executivo', 'transfer aeroporto'],
                canonicalUrl: 'https://grupoconficar.com.br/',
                author: 'Confficar',
                siteName: 'Confficar',
                ogTitle: 'Confficar',
                ogDescription: 'Transporte executivo e transfers VIP.',
                ogImage: ASSET_IMAGES.heroBg,
                robots: 'index, follow',
                structuredDataJson: '{}',
              }}
              onUpdateSEO={onUpdateSEO || (() => {})}
              isDark={isDark}
            />
          )}

          {/* Section 9: Cloudinary CDN Manager */}
          {currentSection === 'cloudinary' && (
            <CloudinarySettings isDark={isDark} config={cloudinaryConfig} onConfigSaved={onUpdateCloudinaryConfig} />
          )}
        </div>

        {/* Admin Dashboard Footer */}
        <footer className={`mt-auto py-4 px-8 border-t text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <p>© 2026 Confficar. Painel de Controle CMS.</p>
          <p>
            Desenvolvido por:{' '}
            <a
              href="https://transporteapp.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#0A0A0A] hover:underline"
            >
              Transporteapp
            </a>
          </p>
        </footer>
      </main>

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 relative border max-h-[90vh] overflow-y-auto transition-colors ${modalBgClass}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingBanner.id ? 'Editar Banner' : 'Novo Banner da Home'}
            </h3>
            <form onSubmit={handleSaveBannerModal} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Título do Banner</label>
                <input
                  type="text"
                  value={editingBanner.titulo || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, titulo: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Imagem do Banner</label>
                {editingBanner.image && (
                  <div className="mb-2 p-2 border rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-center">
                    <img src={editingBanner.image} alt="Preview Banner" className="max-h-28 object-contain rounded-lg" />
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Upload do Computador:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadImageToCloudinary(file);
                          if (res.url) setEditingBanner((prev) => (prev ? { ...prev, image: res.url } : prev));
                        } catch (err) {
                          console.error('Error uploading banner image:', err);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ou Cole a URL da Imagem:
                    </label>
                    <input
                      type="text"
                      value={editingBanner.image || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                      placeholder="https://..."
                      className={`w-full border rounded-xl p-2 text-xs font-mono outline-none ${inputBgClass}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Status</label>
                <select
                  value={editingBanner.status || 'Ativo'}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, status: e.target.value as 'Ativo' | 'Inativo' })
                  }
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A0A0A] text-white text-xs font-semibold rounded-xl hover:bg-[#1A1A1A]"
                >
                  Salvar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 relative border max-h-[90vh] overflow-y-auto transition-colors ${modalBgClass}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingService.id ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <form onSubmit={handleSaveServiceModal} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Título do Serviço</label>
                <input
                  type="text"
                  value={editingService.titulo || ''}
                  onChange={(e) => setEditingService({ ...editingService, titulo: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Ícone Material (ex: business_center, flight_takeoff, shield)</label>
                <input
                  type="text"
                  value={editingService.icon || 'business_center'}
                  onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs font-mono outline-none ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Descrição</label>
                <textarea
                  rows={3}
                  value={editingService.descricao || ''}
                  onChange={(e) => setEditingService({ ...editingService, descricao: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  required
                />
              </div>

              {/* Service Image Field */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Foto / Imagem do Serviço (Aparece ao passar o mouse e no modal)</label>
                {editingService.image && (
                  <div className="mb-2 p-2 border rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-center relative group">
                    <img src={editingService.image} alt="Preview Serviço" className="max-h-32 object-cover rounded-lg w-full" />
                    <button
                      type="button"
                      onClick={() => setEditingService({ ...editingService, image: '' })}
                      className="absolute top-3 right-3 bg-rose-600 text-white p-1 rounded-full text-xs shadow-md opacity-90 hover:opacity-100 transition-opacity"
                      title="Remover Imagem"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Upload do Computador:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadImageToCloudinary(file);
                          if (res.url) setEditingService((prev) => (prev ? { ...prev, image: res.url } : prev));
                        } catch (err) {
                          console.error('Error uploading service image:', err);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ou colar URL da Imagem:
                    </label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem-servico.jpg"
                      value={editingService.image || ''}
                      onChange={(e) => setEditingService({ ...editingService, image: e.target.value })}
                      className={`w-full border rounded-xl p-2 text-xs outline-none ${inputBgClass}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A0A0A] text-white text-xs font-semibold rounded-xl hover:bg-[#1A1A1A]"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fleet Modal */}
      {editingFleet && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 relative border max-h-[90vh] overflow-y-auto transition-colors ${modalBgClass}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingFleet.id ? 'Editar Tipo de Veículo' : 'Cadastrar Tipo de Veículo'}
            </h3>
            <form onSubmit={handleSaveFleetModal} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Nome do Veículo</label>
                <input
                  type="text"
                  value={editingFleet.nome || ''}
                  onChange={(e) => setEditingFleet({ ...editingFleet, nome: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Categoria do Veículo</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      setCustomCategoryInput('');
                    }}
                    className="text-[11px] text-[#0A0A0A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isCustomCategory ? 'list' : 'add'}
                    </span>
                    <span>{isCustomCategory ? 'Selecionar da Lista' : 'Digitar Nova Categoria'}</span>
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    placeholder="Digite o nome da nova categoria (ex: SUV de Luxo, Limousine...)"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                    required
                  />
                ) : (
                  <select
                    value={editingFleet.categoria || allCategories[0]}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsCustomCategory(true);
                        setCustomCategoryInput('');
                      } else {
                        setEditingFleet({ ...editingFleet, categoria: e.target.value });
                      }
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none cursor-pointer ${inputBgClass}`}
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__new__">+ Digitar Outra Categoria...</option>
                  </select>
                )}
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Foto / Imagem do Veículo</label>
                {editingFleet.image && (
                  <div className="mb-2 p-2 border rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-center">
                    <img src={editingFleet.image} alt="Preview Veículo" className="max-h-28 object-contain rounded-lg" />
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Upload do Computador:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadImageToCloudinary(file);
                          if (res.url) setEditingFleet((prev) => (prev ? { ...prev, image: res.url } : prev));
                        } catch (err) {
                          console.error('Error uploading fleet image:', err);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] hover:file:bg-gold-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ou Cole a URL da Imagem:
                    </label>
                    <input
                      type="text"
                      value={editingFleet.image || ''}
                      onChange={(e) => setEditingFleet({ ...editingFleet, image: e.target.value })}
                      placeholder="https://..."
                      className={`w-full border rounded-xl p-2 text-xs font-mono outline-none ${inputBgClass}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Passageiros</label>
                  <input
                    type="text"
                    value={editingFleet.passageiros || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, passageiros: e.target.value })}
                    className={`w-full border rounded-xl p-2 text-xs outline-none ${inputBgClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Malas</label>
                  <input
                    type="text"
                    value={editingFleet.malas || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, malas: e.target.value })}
                    className={`w-full border rounded-xl p-2 text-xs outline-none ${inputBgClass}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Diferenciais / Atributos do Veículo
                </label>
                {(editingFleet.diferenciais || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {editingFleet.diferenciais!.map((diff, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                          isDark
                            ? 'bg-gold-950/60 text-gold-300 border-gold-800'
                            : 'bg-gold-50 text-[#0A0A0A] border-gold-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>{diff}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingFleet((prev) =>
                              prev
                                ? { ...prev, diferenciais: (prev.diferenciais || []).filter((_, idx) => idx !== i) }
                                : prev
                            )
                          }
                          className="hover:text-rose-600 cursor-pointer"
                          title={`Remover "${diff}"`}
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={`text-[11px] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhum atributo cadastrado. Adicione abaixo (ex: Ar Condicionado, Wi-Fi, Blindagem...).
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Ar Condicionado, Wi-Fi, Blindagem..."
                    value={fleetDiffInput}
                    onChange={(e) => setFleetDiffInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFleetDiff();
                      }
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  />
                  <button
                    type="button"
                    onClick={addFleetDiff}
                    className="px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Descrição</label>
                <textarea
                  rows={3}
                  value={editingFleet.descricao || ''}
                  onChange={(e) => setEditingFleet({ ...editingFleet, descricao: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFleet(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A0A0A] text-white text-xs font-semibold rounded-xl hover:bg-[#1A1A1A]"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal (Add, Edit & Delete Categories) */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border max-h-[85vh] flex flex-col ${modalBgClass}`}>
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A0A0A] dark:text-gold-400 text-[24px]">category</span>
                <div>
                  <h3 className="text-lg font-bold">Gestão de Categorias de Veículos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Adicione, renomeie ou exclua as categorias da frota.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingCategoryOldName(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto pr-1">
              {/* Form to Add New Category */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCategoryName.trim()) return;
                  const trimmed = newCategoryName.trim();
                  if (!customCategories.includes(trimmed)) {
                    setCustomCategories((prev) => [...prev, trimmed]);
                  }
                  setSelectedCategoryFilter(trimmed);
                  setNewCategoryName('');
                  triggerSaveNotification();
                }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  + Cadastrar Nova Categoria
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: SUV de Luxo, Limousine, Armored SUV..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`flex-1 border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  />
                  <button
                    type="submit"
                    className="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Categorias Ativas ({allCategories.length})
                </h4>

                <div className="space-y-2">
                  {allCategories.map((cat) => {
                    const vehicleCount = fleet.filter((f) => f.categoria === cat).length;
                    const isEditingThis = editingCategoryOldName === cat;

                    return (
                      <div
                        key={cat}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 shadow-sm"
                      >
                        {isEditingThis ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editingCategoryNewName}
                              onChange={(e) => setEditingCategoryNewName(e.target.value)}
                              autoFocus
                              className={`flex-1 border rounded-lg p-2 text-xs font-bold outline-none ${inputBgClass}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameCategory(cat, editingCategoryNewName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryOldName(null)}
                              className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3 py-2 rounded-lg cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {vehicleCount} {vehicleCount === 1 ? 'veículo' : 'veículos'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryOldName(cat);
                                  setEditingCategoryNewName(cat);
                                }}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gold-50 dark:bg-gold-950 text-[#0A0A0A] dark:text-gold-300 hover:bg-gold-100 dark:hover:bg-gold-900 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                <span>Renomear</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                <span>Excluir</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 bg-gold-50 dark:bg-gold-950/40 border border-gold-200 dark:border-gold-800/60 rounded-xl text-[11px] text-gold-900 dark:text-gold-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Dica de Sincronização:
                </p>
                <p>
                  Ao <strong>renomear</strong> uma categoria, todos os veículos pertencentes a ela serão atualizados automaticamente no site. Ao <strong>excluir</strong> uma categoria com veículos, eles serão reatribuídos com segurança.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 mt-3 border-t border-slate-200/20 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingCategoryOldName(null);
                }}
                className="px-5 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-[#1A1A1A] cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vercel initialData.ts Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative border flex flex-col max-h-[90vh] ${modalBgClass}`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A0A0A] dark:text-gold-400 text-[24px]">code</span>
                <div>
                  <h3 className="text-base font-bold">Exportar Código de Dados para a Vercel</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Substitua o conteúdo de <code className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-gold-600 dark:text-gold-400">src/data/initialData.ts</code> com o código abaixo para que todos os visitantes vejam seus textos online.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="my-4 overflow-y-auto flex-1 font-mono text-[11px] bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 space-y-2 select-all">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {generateInitialDataTSContent(getCurrentCMSBundle())}
              </pre>
            </div>

            {copySuccessMessage && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{copySuccessMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/20 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Dica: Cole o código no seu repositório no GitHub para atualizar a Vercel automaticamente.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCodeTS}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copiar Código</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCodeTS}
                  className="px-5 py-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Baixar initialData.ts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit / New Testimonial Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border ${modalBgClass}`}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A0A0A] dark:text-gold-400">format_quote</span>
                <h3 className="text-lg font-bold">
                  {editingTestimonial.id ? 'Editar Depoimento' : 'Novo Depoimento'}
                </h3>
              </div>
              <button
                onClick={() => setEditingTestimonial(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTestimonialModal} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Nome do Autor / Executivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto Andrade"
                  value={editingTestimonial.autor || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, autor: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Cargo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: VP de Operações"
                    value={editingTestimonial.cargo || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, cargo: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Grupo Sonda"
                    value={editingTestimonial.empresa || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, empresa: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Texto do Depoimento *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva a experiência com o transporte executivo..."
                  value={editingTestimonial.texto || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, texto: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBgClass}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Foto de Perfil (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const res = await uploadImageToCloudinary(file);
                        if (res.url) setEditingTestimonial({ ...editingTestimonial, foto: res.url });
                      } catch (err) {
                        console.error('Error uploading modal foto:', err);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-gold-50 file:text-[#0A0A0A] cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Ou cole a URL da foto..."
                    value={editingTestimonial.foto || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, foto: e.target.value })}
                    className={`w-full border rounded-xl p-2 text-[11px] mt-1 outline-none font-mono ${inputBgClass}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Avaliação (Estrelas)
                  </label>
                  <div className="flex items-center gap-1 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: star })}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {star <= (editingTestimonial.rating || 5) ? 'star' : 'star_outline'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/20">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-[#1A1A1A] cursor-pointer"
                >
                  Salvar Depoimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
