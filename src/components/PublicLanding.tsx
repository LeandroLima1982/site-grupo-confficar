import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSET_IMAGES } from '../data/initialData';
import { FleetItem, HeroSlideItem, InstitutionalContent, QuoteForm, SEOSettings, ServiceItem, SiteLogos, TestimonialItem, ViewMode } from '../types';
import Switch from './ui/sky-toggle';

interface PublicLandingProps {
  logos?: SiteLogos;
  institutional: InstitutionalContent;
  services: ServiceItem[];
  fleet: FleetItem[];
  testimonials: TestimonialItem[];
  seo?: SEOSettings;
  onViewChange: (view: ViewMode) => void;
}

function getServiceImage(serv?: ServiceItem | null): string {
  if (!serv) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop';
  if (serv.image && serv.image.trim().length > 0) {
    return serv.image;
  }
  const titleLower = (serv.titulo || '').toLowerCase();
  const iconLower = (serv.icon || '').toLowerCase();

  if (titleLower.includes('aeroporto') || titleLower.includes('transfer') || iconLower.includes('flight')) {
    return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop';
  }
  if (titleLower.includes('grupo') || titleLower.includes('van') || titleLower.includes('ônibus') || iconLower.includes('groups')) {
    return 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop';
  }
  if (titleLower.includes('blindad') || titleLower.includes('segurança') || iconLower.includes('shield')) {
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop';
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  logos,
  institutional,
  services,
  fleet,
  testimonials,
  seo,
  onViewChange,
}) => {
  // Track scroll position for dynamic header/logo sizing
  const [isScrolled, setIsScrolled] = useState(false);

  // Dynamic SEO meta tags injection
  useEffect(() => {
    if (!seo) return;

    if (seo.metaTitle) {
      document.title = seo.metaTitle;
    }

    const updateMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      if (!contentVal) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    const updateLinkTag = (rel: string, hrefVal: string) => {
      if (!hrefVal) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', hrefVal);
    };

    updateMetaTag('meta[name="description"]', 'name', 'description', seo.metaDescription);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', seo.keywords ? seo.keywords.join(', ') : '');
    updateMetaTag('meta[name="author"]', 'name', 'author', seo.author);
    updateMetaTag('meta[name="robots"]', 'name', 'robots', seo.robots);

    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.ogTitle || seo.metaTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.ogDescription || seo.metaDescription);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', seo.ogImage);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', seo.siteName);

    updateLinkTag('canonical', seo.canonicalUrl);

    if (seo.structuredDataJson) {
      let scriptEl = document.querySelector('#seven-transfers-jsonld-schema') as HTMLScriptElement | null;
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'seven-transfers-jsonld-schema';
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = seo.structuredDataJson;
    }
  }, [seo]);

  // Mobile navigation drawer open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Mobile menu items list with icons and descriptions
  const mobileNavItems = [
    { href: '#cotacao', icon: 'calculate', label: 'Cotação Rápida', desc: 'Simulação instantânea de viagem' },
    { href: '#servicos', icon: 'directions_car', label: 'Nossos Serviços', desc: 'Executivo, Transfer & Blindados' },
    { href: '#tipos-veiculos', icon: 'airport_shuttle', label: 'Tipos de Veículos', desc: 'Sedan, SUV, Vans & Ônibus' },
    { href: '#sobre', icon: 'domain', label: 'Sobre a Confficar', desc: 'Excelência, tradição & segurança' },
    { href: '#depoimentos', icon: 'rate_review', label: 'Depoimentos', desc: 'Avaliações de parceiros corporativos' },
    { href: '#contato', icon: 'support_agent', label: 'Contato & Canais', desc: 'Central de atendimento 24 horas' },
  ];

  // Public site theme mode persistence (light or dark)
  // First-time visitors (no saved choice) follow the site's default theme defined by the admin CMS.
  const [publicTheme, setPublicTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('confficar_public_theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    return institutional?.defaultSiteTheme || 'light';
  });

  const isDark = publicTheme === 'dark';

  const handleTogglePublicTheme = (mode: 'light' | 'dark') => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => unknown }).startViewTransition(() => {
        setPublicTheme(mode);
      });
    } else {
      setPublicTheme(mode);
    }
    localStorage.setItem('confficar_public_theme', mode);
  };

  // Smart Header Auto-hide on Scroll Down / Show on Scroll Up + Back-To-Top button trigger
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const prevScrollY = lastScrollYRef.current;

      // Style background when scrolled past top hero
      setIsScrolled(currentScrollY > 40);

      // Show back-to-top floating button when scrolled down
      setShowBackToTop(currentScrollY > 350);

      // Smart hide/show header logic
      if (currentScrollY < 30 || mobileMenuOpen) {
        // Always show near top or when mobile menu is open
        setIsHeaderVisible(true);
      } else if (currentScrollY - prevScrollY > 8) {
        // Scrolling DOWN -> hide header smoothly
        setIsHeaderVisible(false);
      } else if (prevScrollY - currentScrollY > 8) {
        // Scrolling UP -> show header smoothly
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Smooth scroll back to top handler
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Estado do card de serviço selecionado / em hover para efeito marca d'água
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Slide de imagens da seção "Sobre a Confficar"
  const [aboutSlideIndex, setAboutSlideIndex] = useState(0);
  const [isAboutSlidePaused, setIsAboutSlidePaused] = useState(false);

  const activeAboutSlides = useMemo(() => {
    const list = (institutional.aboutSlides || []).filter((s) => s.active !== false);
    if (list.length > 0) return list;
    return [
      {
        id: 'default',
        url: ASSET_IMAGES.bannerTransfer,
        title: '15+ Anos de Atuação',
        subtitle: 'Atendimento nacional para grandes corporações',
        active: true,
      },
    ];
  }, [institutional.aboutSlides]);

  useEffect(() => {
    if (activeAboutSlides.length <= 1 || isAboutSlidePaused) return;
    const interval = setInterval(() => {
      setAboutSlideIndex((prev) => (prev + 1) % activeAboutSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAboutSlides.length, isAboutSlidePaused]);

  // Função auxiliar para mapear chaves de serviço/veículo para um veículo existente na frota
  const resolveVehicleFromKey = (key: string, fleetList: FleetItem[]): string => {
    if (!fleetList || fleetList.length === 0) return 'Toyota Corolla 2025';
    if (!key) return fleetList[0].nome;

    const kLower = key.toLowerCase().trim();

    // 1. Correspondência exata de nome ou ID
    const exactNameMatch = fleetList.find(
      (f) => f.nome.toLowerCase() === kLower || f.id.toLowerCase() === kLower
    );
    if (exactNameMatch) return exactNameMatch.nome;

    // 2. Correspondência de categoria
    const catMatch = fleetList.find(
      (f) => f.categoria.toLowerCase() === kLower
    );
    if (catMatch) return catMatch.nome;

    // 3. Busca por palavras-chave de serviços e categorias
    if (kLower.includes('van') || kLower.includes('grupo') || kLower.includes('sprinter') || kLower.includes('event')) {
      const van = fleetList.find((f) => {
        const c = (f.categoria + ' ' + f.nome + ' ' + (f.modeloSpecs || '')).toLowerCase();
        return c.includes('van') || c.includes('sprinter') || c.includes('grupo');
      });
      if (van) return van.nome;
    }

    if (kLower.includes('blind') || kLower.includes('suv') || kLower.includes('shield')) {
      const blind = fleetList.find((f) => {
        const c = (f.categoria + ' ' + f.nome + ' ' + f.descricao).toLowerCase();
        return c.includes('blind') || c.includes('suv') || c.includes('armored');
      });
      if (blind) return blind.nome;
    }

    if (kLower.includes('onibus') || kLower.includes('ônibus') || kLower.includes('massa') || kLower.includes('bus')) {
      const bus = fleetList.find((f) => {
        const c = (f.categoria + ' ' + f.nome).toLowerCase();
        return c.includes('ônibus') || c.includes('onibus') || c.includes('massa') || c.includes('bus');
      });
      if (bus) return bus.nome;
    }

    if (kLower.includes('sedan') || kLower.includes('transfer') || kLower.includes('executiv') || kLower.includes('corolla') || kLower.includes('business')) {
      const sedan = fleetList.find((f) => {
        const c = (f.categoria + ' ' + f.nome).toLowerCase();
        return c.includes('sedan') || c.includes('corolla') || c.includes('executiv');
      });
      if (sedan) return sedan.nome;
    }

    // 4. Correspondência parcial
    const partial = fleetList.find((f) => {
      const c = (f.categoria + ' ' + f.nome).toLowerCase();
      return c.includes(kLower) || kLower.includes(f.nome.toLowerCase());
    });
    if (partial) return partial.nome;

    return fleetList[0].nome;
  };

  // Handler para direcionamento imediato ao formulário próprio de cotação (#cotacao-form)
  const handleRequestQuoteDirectly = (veiculoKey?: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (veiculoKey) {
      const matchedVehicleName = resolveVehicleFromKey(veiculoKey, fleet);
      setQuote((prev) => ({ ...prev, veiculo: matchedVehicleName }));
    }

    setMobileMenuOpen(false);
    setSelectedVehicleModal(null);

    // Scroll suave direcionado exatamente para o cartão do formulário de cotação considerando a altura da barra superior
    const targetEl = document.getElementById('cotacao-form') || document.getElementById('cotacao');
    if (targetEl) {
      const headerEl = document.getElementById('main-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 80;
      const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }

    // Auto-foco no campo de Nome para preenchimento imediato
    setTimeout(() => {
      const inputEl = document.getElementById('nomeCliente');
      if (inputEl) {
        inputEl.focus({ preventScroll: true });
      }
    }, 450);
  };

  // Handler genérico de navegação suave para âncoras considerando offset do header
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);

    let cleanId = targetId.replace('#', '');
    if (cleanId === 'frota') cleanId = 'tipos-veiculos';

    const targetEl = document.getElementById(cleanId);
    if (targetEl) {
      const headerEl = document.getElementById('main-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 80;
      const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 16;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  // Quote form state
  const [quote, setQuote] = useState<QuoteForm>({
    origem: 'Heliporto de Farol de São Thomé',
    destino: 'Aeroporto Santos Dumont',
    dataHora: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    passageiros: '1 a 3 Passageiros',
    veiculo: fleet[0]?.nome || 'Toyota Corolla 2025',
    nomeCliente: '',
    whatsappCliente: '',
  });

  // Quote calculation modal
  const [calculatedQuote, setCalculatedQuote] = useState<{
    showModal: boolean;
    origem: string;
    destino: string;
    dataHora: string;
    veiculoNome: string;
    passageiros: string;
    nomeCliente: string;
    whatsappCliente: string;
    submittedSuccess?: boolean;
  } | null>(null);

  // Selected vehicle detail modal
  const [selectedVehicleModal, setSelectedVehicleModal] = useState<FleetItem | null>(null);

  // Hero Slideshow State (Adaptive to screen size: Desktop, Tablet, Mobile and Theme: Light/Dark)
  const activeHeroSlides = useMemo<HeroSlideItem[]>(() => {
    if (institutional.heroSlides && institutional.heroSlides.length > 0) {
      const activeOnly = institutional.heroSlides.filter((s) => s.active !== false);
      if (activeOnly.length > 0) return activeOnly;
    }
    return [
      {
        id: 'hs-default',
        tag: institutional.heroTagText || 'Líder em Transporte Executivo',
        titulo: institutional.heroTitle,
        subtitulo: institutional.heroSubtitle,
        desktopDark: institutional.heroBgImage,
        desktopLight: institutional.heroBgImageLight || institutional.heroBgImage,
        tabletDark: institutional.heroBgImageTablet || institutional.heroBgImage,
        tabletLight: institutional.heroBgImageTabletLight || institutional.heroBgImageTablet || institutional.heroBgImage,
        mobileDark: institutional.heroBgImageMobile || institutional.heroBgImage,
        mobileLight: institutional.heroBgImageMobileLight || institutional.heroBgImageMobile || institutional.heroBgImage,
        active: true,
      },
    ];
  }, [institutional]);

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // Hero Swipe & Drag Handlers for Mobile & Desktop
  const heroTouchStartX = useRef<number | null>(null);
  const heroTouchStartY = useRef<number | null>(null);
  const heroTouchEndX = useRef<number | null>(null);
  const heroIsSwiping = useRef<boolean>(false);

  const handleHeroSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (activeHeroSlides.length <= 1) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    heroTouchStartX.current = clientX;
    heroTouchStartY.current = clientY;
    heroTouchEndX.current = clientX;
    heroIsSwiping.current = true;
    setIsHeroPaused(true);
  };

  const handleHeroSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!heroIsSwiping.current || heroTouchStartX.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    heroTouchEndX.current = clientX;
  };

  const handleHeroSwipeEnd = () => {
    if (heroIsSwiping.current && heroTouchStartX.current !== null && heroTouchEndX.current !== null) {
      const diffX = heroTouchStartX.current - heroTouchEndX.current;
      const minSwipeDistance = 40; // 40px threshold

      if (Math.abs(diffX) >= minSwipeDistance) {
        if (diffX > 0) {
          handleNextHeroSlide();
        } else {
          handlePrevHeroSlide();
        }
      }
    }

    heroTouchStartX.current = null;
    heroTouchStartY.current = null;
    heroTouchEndX.current = null;
    heroIsSwiping.current = false;
    setIsHeroPaused(false);
  };

  // Auto slide timer
  useEffect(() => {
    if (activeHeroSlides.length <= 1 || isHeroPaused || institutional.heroAutoSlideEnabled === false) {
      return;
    }
    const intervalMs = institutional.heroAutoSlideInterval || 6000;
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % activeHeroSlides.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeHeroSlides.length, isHeroPaused, currentHeroIndex, institutional.heroAutoSlideEnabled, institutional.heroAutoSlideInterval]);

  useEffect(() => {
    if (currentHeroIndex >= activeHeroSlides.length) {
      setCurrentHeroIndex(0);
    }
  }, [activeHeroSlides.length, currentHeroIndex]);

  // CTA do slide: só aparece 5s após o slide ficar ativo, deslizando da esquerda
  const [ctaReady, setCtaReady] = useState(false);
  const ctaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCtaReady(false);
    if (ctaTimerRef.current) {
      clearTimeout(ctaTimerRef.current);
    }
    const currentSlide = activeHeroSlides[currentHeroIndex];
    if (currentSlide && currentSlide.ctaEnabled !== false) {
      ctaTimerRef.current = setTimeout(() => setCtaReady(true), 5000);
    }
    return () => {
      if (ctaTimerRef.current) {
        clearTimeout(ctaTimerRef.current);
      }
    };
  }, [currentHeroIndex, activeHeroSlides]);

  const handlePrevHeroSlide = () => {
    setCurrentHeroIndex((prev) => (prev - 1 + activeHeroSlides.length) % activeHeroSlides.length);
  };

  const handleNextHeroSlide = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % activeHeroSlides.length);
  };

  // Services Carousel, Category Filter & Quick Detail Modal
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('Todos');
  // Por padrão: grade (todos visíveis) no desktop, carrossel no mobile/tablet
  const [serviceDisplayMode, setServiceDisplayMode] = useState<'carousel' | 'grid'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'grid' : 'carousel'
  );
  const [selectedServiceModal, setSelectedServiceModal] = useState<ServiceItem | null>(null);

  const servicesScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeftServices, setCanScrollLeftServices] = useState(false);
  const [canScrollRightServices, setCanScrollRightServices] = useState(true);

  // Mouse drag scrolling state & refs for computer drag-to-scroll
  const [isDraggingServices, setIsDraggingServices] = useState(false);
  const isMouseDownServicesRef = useRef(false);
  const startXServicesRef = useRef(0);
  const scrollLeftStartServicesRef = useRef(0);
  const hasMovedServicesRef = useRef(false);

  const handleServicesMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!servicesScrollRef.current) return;
    if (e.button !== 0) return;
    isMouseDownServicesRef.current = true;
    hasMovedServicesRef.current = false;
    startXServicesRef.current = e.clientX - servicesScrollRef.current.offsetLeft;
    scrollLeftStartServicesRef.current = servicesScrollRef.current.scrollLeft;
  };

  const handleServicesMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownServicesRef.current || !servicesScrollRef.current) return;
    const x = e.clientX - servicesScrollRef.current.offsetLeft;
    const walk = x - startXServicesRef.current;
    if (Math.abs(walk) > 4) {
      if (!hasMovedServicesRef.current) {
        hasMovedServicesRef.current = true;
        setIsDraggingServices(true);
      }
      e.preventDefault();
      servicesScrollRef.current.scrollLeft = scrollLeftStartServicesRef.current - walk;
    }
  };

  const handleServicesMouseUpOrLeave = () => {
    if (!isMouseDownServicesRef.current) return;
    isMouseDownServicesRef.current = false;
    setTimeout(() => {
      hasMovedServicesRef.current = false;
      setIsDraggingServices(false);
    }, 60);
  };

  const updateServicesScrollState = () => {
    if (servicesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = servicesScrollRef.current;
      setCanScrollLeftServices(scrollLeft > 10);
      setCanScrollRightServices(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollServicesLeft = () => {
    if (servicesScrollRef.current) {
      servicesScrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollServicesRight = () => {
    if (servicesScrollRef.current) {
      servicesScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const serviceCategories = useMemo(() => [
    'Todos',
    'Aeroportos & Transfers',
    'Executivo & Diretoria',
    'Grupos & Eventos',
    'Blindados & Segurança'
  ], []);

  const filteredServices = useMemo(() => {
    if (selectedServiceCategory === 'Todos') return services;
    const cat = selectedServiceCategory.toLowerCase();
    return services.filter(s => {
      const text = (s.titulo + ' ' + s.descricao).toLowerCase();
      if (cat.includes('aeroporto') || cat.includes('transfer')) {
        return text.includes('aeroporto') || text.includes('transfer') || text.includes('desembarque') || text.includes('voo') || text.includes('gru') || text.includes('cgh');
      }
      if (cat.includes('executiv') || cat.includes('diretoria')) {
        return text.includes('executiv') || text.includes('diretor') || text.includes('reuni') || text.includes('roadshow') || text.includes('bilingue');
      }
      if (cat.includes('grupo') || cat.includes('evento')) {
        return text.includes('grupo') || text.includes('evento') || text.includes('van') || text.includes('ônibus') || text.includes('onibus') || text.includes('feiras') || text.includes('convenç');
      }
      if (cat.includes('blindad') || cat.includes('segurança')) {
        return text.includes('blindad') || text.includes('seguran') || text.includes('nível') || text.includes('defensiv');
      }
      return true;
    });
  }, [services, selectedServiceCategory]);

  useEffect(() => {
    // Wait for DOM to adjust
    const timer = setTimeout(() => {
      updateServicesScrollState();
    }, 100);
    return () => clearTimeout(timer);
  }, [filteredServices, serviceDisplayMode]);

  // Phone mask & error validation state
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const formatWhatsApp = (val: string): string => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const validateWhatsApp = (val: string): string | null => {
    const digits = val.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      return 'Informe o número completo com DDD (10 ou 11 dígitos). Ex: (11) 99999-8888';
    }
    const ddd = parseInt(digits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) {
      return 'DDD inválido. Informe um DDD brasileiro válido entre 11 e 99.';
    }
    if (/^(\d)\1+$/.test(digits)) {
      return 'Número de telefone inválido.';
    }
    if (digits.length === 11 && digits[2] !== '9') {
      return 'Celulares com 11 dígitos devem começar com o número 9 após o DDD.';
    }
    return null;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setQuote((prev) => ({ ...prev, whatsappCliente: formatted }));
    if (phoneError) {
      setPhoneError(null);
    }
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate WhatsApp number before proceeding
    const err = validateWhatsApp(quote.whatsappCliente || '');
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError(null);

    // Determine vehicle details
    let vNome = quote.veiculo || 'Sedan Executivo';
    const matchedFleet = fleet.find(
      (f) => f.nome === quote.veiculo || f.id === quote.veiculo || f.categoria === quote.veiculo
    );
    if (matchedFleet) {
      vNome = `${matchedFleet.categoria} (${matchedFleet.nome})`;
    } else if (quote.veiculo === 'blindado') {
      vNome = 'Sedan Blindado Nível III-A';
    } else if (quote.veiculo === 'van') {
      vNome = 'Van Executiva (Mercedes Sprinter VIP)';
    } else if (quote.veiculo === 'onibus') {
      vNome = 'Ônibus Executivo Leito';
    }

    setCalculatedQuote({
      showModal: true,
      origem: quote.origem || 'Heliporto de Farol de São Thomé',
      destino: quote.destino || 'Aeroporto Santos Dumont',
      dataHora: quote.dataHora.replace('T', ' '),
      veiculoNome: vNome,
      passageiros: quote.passageiros,
      nomeCliente: quote.nomeCliente || 'Cliente',
      whatsappCliente: quote.whatsappCliente || 'Não informado',
      submittedSuccess: false,
    });
  };

  const handleConfirmBooking = () => {
    if (!calculatedQuote) return;
    setCalculatedQuote((prev) => (prev ? { ...prev, submittedSuccess: true } : null));
  };

  return (
    <div className={`min-h-screen flex flex-col font-body-md theme-smooth-transition ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#fcf9f8] text-[#1c1b1b]'
    }`}>
      {/* TopNavBar */}
      <header
        id="main-header"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? isDark
              ? 'bg-slate-950/20 backdrop-blur-xl border-b border-white/20 shadow-sm'
              : 'bg-white/45 backdrop-blur-xl border-b border-white/40 shadow-sm'
            : isDark
              ? 'bg-slate-950/20 backdrop-blur-xl border-b border-white/20 shadow-sm'
              : 'bg-white/45 backdrop-blur-xl border-b border-white/40 shadow-sm'
        }`}
      >
        <div
          className={`flex justify-between items-center px-4 md:px-10 w-full max-w-[1400px] mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled ? 'h-16 md:h-16' : 'h-18 md:h-20'
          }`}
        >
          {/* Brand Logo & Title */}
          <a href="#" className="flex items-center gap-2 sm:gap-3.5 group shrink min-w-0">
            <img
              src={(isDark ? (logos?.logoDark || logos?.logoHeader) : logos?.logoHeader) || ASSET_IMAGES.logoHeader}
              alt="Confficar Logo"
              style={{
                height: logos?.logoHeaderHeightPx
                  ? isScrolled
                    ? `${Math.max(20, Math.round(logos.logoHeaderHeightPx * 0.82))}px`
                    : `${logos.logoHeaderHeightPx}px`
                  : undefined
              }}
              className={`w-auto object-contain transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-95 shrink-0 ${
                !logos?.logoHeaderHeightPx
                  ? isScrolled
                    ? 'h-8 sm:h-10 md:h-10'
                    : 'h-9 sm:h-11 md:h-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                  : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
              }`}
            />
            {((logos?.logoTitle !== undefined ? logos.logoTitle.trim() : 'Confficar') || (logos?.logoSubtitle && logos.logoSubtitle.trim())) && (
              <div className="flex flex-col justify-center min-w-0">
                {(logos?.logoTitle !== undefined ? logos.logoTitle.trim() : 'Confficar') && (
                  <span
                    className={`font-extrabold tracking-tight transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] leading-tight text-sm sm:text-lg md:text-xl truncate ${
                      isScrolled
                        ? isDark
                          ? 'text-white'
                          : 'text-[#0A0A0A]'
                        : isDark
                          ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'
                          : 'text-[#0A0A0A]'
                    }`}
                  >
                    {logos?.logoTitle !== undefined ? logos.logoTitle : 'Confficar'}
                  </span>
                )}
                {logos?.logoSubtitle && logos.logoSubtitle.trim() && (
                  <span
                    className={`font-medium tracking-wide transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] leading-tight text-[9px] sm:text-[10px] md:text-[11px] truncate ${
                      isScrolled
                        ? isDark
                          ? 'text-slate-400'
                          : 'text-slate-500'
                        : isDark
                          ? 'text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                          : 'text-slate-500'
                    }`}
                  >
                    {logos.logoSubtitle}
                  </span>
                )}
              </div>
            )}
          </a>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-12 text-sm font-semibold">
            <a
              href="#servicos"
              onClick={(e) => handleAnchorClick(e, '#servicos')}
              className={`transition-colors duration-500 ease-in-out ${
                isScrolled
                  ? isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
                  : isDark
                    ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] hover:text-[#D4AF37]'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
              }`}
            >
              Serviços
            </a>
            <a
              href="#tipos-veiculos"
              onClick={(e) => handleAnchorClick(e, '#tipos-veiculos')}
              className={`transition-colors duration-500 ease-in-out ${
                isScrolled
                  ? isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
                  : isDark
                    ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] hover:text-[#D4AF37]'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
              }`}
            >
              Tipos de Veículos
            </a>
            <a
              href="#sobre"
              onClick={(e) => handleAnchorClick(e, '#sobre')}
              className={`transition-colors duration-500 ease-in-out ${
                isScrolled
                  ? isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
                  : isDark
                    ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] hover:text-[#D4AF37]'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
              }`}
            >
              Sobre Nós
            </a>
            <a
              href="#depoimentos"
              onClick={(e) => handleAnchorClick(e, '#depoimentos')}
              className={`transition-colors duration-500 ease-in-out ${
                isScrolled
                  ? isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
                  : isDark
                    ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] hover:text-[#D4AF37]'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
              }`}
            >
              Depoimentos
            </a>
            <a
              href="#contato"
              onClick={(e) => handleAnchorClick(e, '#contato')}
              className={`transition-colors duration-500 ease-in-out ${
                isScrolled
                  ? isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
                  : isDark
                    ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] hover:text-[#D4AF37]'
                    : 'text-[#414750] hover:text-[#0A0A0A]'
              }`}
            >
              Contato
            </a>
          </nav>

          {/* Trailing Action Button + Sky Toggle Switcher + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Solicitar Cotação Button */}
            <div className="hidden lg:flex items-center">
              <button
                type="button"
                onClick={(e) => handleRequestQuoteDirectly(undefined, e)}
                className={`flex items-center justify-center text-xs uppercase tracking-wider font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md active:scale-95 cursor-pointer border ${
                  isScrolled
                    ? isDark
                      ? 'bg-gold-600 hover:bg-gold-500 text-white border-gold-400/40 shadow-gold-950/40'
                      : 'bg-gold-500 hover:bg-gold-400 text-white border-gold-600/30 shadow-gold-600/25'
                    : isDark
                      ? 'bg-white/20 hover:bg-white/35 text-white border border-white/50 backdrop-blur-md hover:border-white shadow-lg'
                      : 'bg-gold-500 hover:bg-gold-400 text-white border-gold-600/30 shadow-gold-600/25'
                }`}
                title="Solicitar Orçamento"
              >
                <span className="material-symbols-outlined mr-1.5 text-[18px]">calculate</span>
                <span>Solicitar Orçamento</span>
              </button>
            </div>

            {/* Sky Toggle Theme Switcher + Acessar Sistema Icon (Desktop Only) */}
            <div className="hidden lg:flex items-center gap-2">
              <Switch
                checked={isDark}
                onChange={(checked) => handleTogglePublicTheme(checked ? 'dark' : 'light')}
                size="10.5px"
              />

              <a
                href="https://app.grupoconficar.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  isScrolled
                    ? isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-slate-100'
                    : isDark
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-slate-100'
                }`}
                title="Acessar o Sistema Operacional de Viagens (app.grupoconficar.com.br)"
              >
                <span className="material-symbols-outlined text-[22px]">desktop_windows</span>
              </a>

              <button
                type="button"
                onClick={() => onViewChange('cms-login')}
                className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  isScrolled
                    ? isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-slate-100'
                    : isDark
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-slate-100'
                }`}
                title="Acessar o Painel de Gerenciamento do Site (CMS)"
              >
                <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              </button>
            </div>

            {/* Mobile Theme Switcher (same segmented control as the CMS header) */}
            <div className={`lg:hidden flex items-center p-1 rounded-xl border transition-all ${
              isScrolled
                ? isDark
                  ? 'bg-slate-800/90 border-slate-700/80'
                  : 'bg-slate-100/90 border-slate-200/90'
                : isDark
                  ? 'bg-black/35 border-white/25 backdrop-blur-md'
                  : 'bg-slate-100/90 border-slate-200/90'
            }`}>
              <button
                type="button"
                onClick={() => handleTogglePublicTheme('light')}
                title="Ativar Modo Claro"
                className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-[#0A0A0A] shadow-xs font-bold'
                    : isScrolled
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-white/70 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
                <span className="hidden sm:inline">Claro</span>
              </button>
              <button
                type="button"
                onClick={() => handleTogglePublicTheme('dark')}
                title="Ativar Modo Escuro"
                className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0A0A] text-white shadow-xs font-bold'
                    : isScrolled
                      ? 'text-slate-500 hover:text-slate-800'
                      : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                <span className="hidden sm:inline">Escuro</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu Principal"
              className={`lg:hidden flex items-center justify-center p-2 rounded-lg transition-all active:scale-95 cursor-pointer ${
                isScrolled
                  ? isDark
                    ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-[#0A0A0A] hover:bg-slate-200 border border-slate-200/80'
                  : isDark
                    ? 'bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/30'
                    : 'bg-slate-100 text-[#0A0A0A] hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Expanded Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md lg:hidden"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed top-0 right-0 bottom-0 z-[90] w-[88vw] max-w-sm lg:hidden flex flex-col justify-between shadow-2xl border-l theme-smooth-transition ${
                isDark
                  ? 'bg-slate-950/98 border-slate-800 text-slate-100'
                  : 'bg-white/98 border-slate-200 text-[#1c1b1b]'
              }`}
            >
              {/* Drawer Header */}
              <div
                className={`p-5 flex items-center justify-between border-b ${
                  isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200/80 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={(isDark ? (logos?.logoDark || logos?.logoHeader) : logos?.logoHeader) || ASSET_IMAGES.logoHeader}
                    alt="Confficar"
                    className="h-9 w-auto object-contain"
                  />
                  <div>
                    <span className={`font-extrabold text-base block leading-tight ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                      {logos?.logoTitle || 'Confficar'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide block leading-tight">
                      Mobilidade Corporativa
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
                <div className="flex items-center justify-between px-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-gold-400' : 'text-[#0A0A0A]'
                  }`}>
                    Menu do Portal
                  </span>
                  <span className="text-[10px] text-slate-400">
                    6 Seções
                  </span>
                </div>

                {mobileNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === '#cotacao') {
                        handleRequestQuoteDirectly(undefined, e);
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-300 group cursor-pointer ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800 hover:border-gold-500/50 text-slate-200'
                        : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/90 hover:border-[#0A0A0A]/40 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                        isDark ? 'bg-gold-950/80 text-gold-400 border border-gold-800/60' : 'bg-[#FEEFC3]/80 text-[#0A0A0A]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm leading-snug transition-colors ${
                        isDark ? 'group-hover:text-gold-300 text-white' : 'group-hover:text-[#0A0A0A] text-slate-900'
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-[11px] truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {item.desc}
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[18px] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${
                        isDark ? 'text-gold-400' : 'text-[#0A0A0A]'
                      }`}
                    >
                      chevron_right
                    </span>
                  </a>
                ))}
              </div>

              {/* Drawer Footer */}
              <div
                className={`p-5 border-t space-y-4 ${
                  isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200/80 bg-slate-50'
                }`}
              >
                {/* Theme Mode Toggle inside Drawer */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>
                      {isDark ? 'dark_mode' : 'light_mode'}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Tema: {isDark ? 'Modo Escuro' : 'Modo Claro'}
                    </span>
                  </div>
                  <Switch
                    checked={isDark}
                    onChange={(checked) => handleTogglePublicTheme(checked ? 'dark' : 'light')}
                    size="10px"
                  />
                </div>

                {/* Direct Access CTAs */}
                <div className="space-y-2">
                  <a
                    href="https://app.grupoconficar.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                    <span>ACESSAR SISTEMA (app.grupoconficar.com.br)</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>

                {/* Footer details */}
                <div className="text-center pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
                  <span>Confficar Concierge 24</span>
                </div>
                <div className="mt-1.5 text-center text-[10px] text-slate-500">
                  Desenvolvido por:{' '}
                  <a
                    href="https://transporteapp.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-bold hover:underline ${isDark ? 'text-gold-300' : 'text-[#0A0A0A]'}`}
                  >
                    TransporteApp
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-grow transition-all duration-300">
        {/* Dynamic Responsive Hero Image Custom Sizing Styles */}
        {(() => {
          const desktopHeight = institutional.heroHeightUnitDesktop === 'px' && institutional.heroHeightDesktopPx
            ? `${institutional.heroHeightDesktopPx}px`
            : institutional.heroHeightUnitDesktop === 'auto'
              ? 'auto'
              : `${institutional.heroHeightDesktopVh ?? 75}vh`;

          const tabletHeight = institutional.heroHeightUnitTablet === 'px' && institutional.heroHeightTabletPx
            ? `${institutional.heroHeightTabletPx}px`
            : institutional.heroHeightUnitTablet === 'auto'
              ? 'auto'
              : `${institutional.heroHeightTabletVh ?? 65}vh`;

          const mobileHeight = institutional.heroHeightUnitMobile === 'px' && institutional.heroHeightMobilePx
            ? `${institutional.heroHeightMobilePx}px`
            : institutional.heroHeightUnitMobile === 'auto'
              ? 'auto'
              : `${institutional.heroHeightMobileVh ?? 60}vh`;

          const desktopFit = institutional.heroObjectFitDesktop || 'cover';
          const tabletFit = institutional.heroObjectFitTablet || 'cover';
          const mobileFit = institutional.heroObjectFitMobile || 'cover';

          const desktopPos = institutional.heroObjectPositionDesktop || 'center';
          const tabletPos = institutional.heroObjectPositionTablet || 'center';
          const mobilePos = institutional.heroObjectPositionMobile || 'center';

          const desktopZoom = (institutional.heroImageZoomDesktop ?? 100) / 100;
          const tabletZoom = (institutional.heroImageZoomTablet ?? 100) / 100;
          const mobileZoom = (institutional.heroImageZoomMobile ?? 100) / 100;

          return (
            <style>{`
              #hero {
                min-height: ${mobileHeight};
              }
              .hero-bg-img {
                object-fit: ${mobileFit};
                object-position: ${mobilePos};
                transform: scale(${mobileZoom});
                transform-origin: center center;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: high-quality;
                backface-visibility: hidden;
              }
              @media (min-width: 640px) {
                #hero {
                  min-height: ${tabletHeight};
                }
                .hero-bg-img {
                  object-fit: ${tabletFit};
                  object-position: ${tabletPos};
                  transform: scale(${tabletZoom});
                }
              }
              @media (min-width: 1024px) {
                #hero {
                  min-height: ${desktopHeight};
                }
                .hero-bg-img {
                  object-fit: ${desktopFit};
                  object-position: ${desktopPos};
                  transform: scale(${desktopZoom});
                }
              }
            `}</style>
          );
        })()}

        {/* Hero Section with Interactive Multi-Slide Background (Adaptive to Screen Sizes & Dark/Light Themes) */}
        <section
          id="hero"
          onTouchStart={handleHeroSwipeStart}
          onTouchMove={handleHeroSwipeMove}
          onTouchEnd={handleHeroSwipeEnd}
          onTouchCancel={handleHeroSwipeEnd}
          onMouseDown={handleHeroSwipeStart}
          onMouseMove={handleHeroSwipeMove}
          onMouseUp={handleHeroSwipeEnd}
          onMouseLeave={handleHeroSwipeEnd}
          onMouseEnter={() => setIsHeroPaused(true)}
          onFocusCapture={() => setIsHeroPaused(true)}
          onBlurCapture={() => setIsHeroPaused(false)}
          className="relative flex items-center justify-center overflow-hidden pt-32 pb-14 md:pt-40 transition-all duration-300 group/hero select-none"
          style={{
            backgroundColor: isDark ? '#080f1c' : '#dfe7ef',
            '--hero-edge-color': isDark ? 'rgba(8, 15, 28, 0.82)' : 'rgba(223, 231, 239, 0.82)',
          } as React.CSSProperties}
        >
          {/* Background Images for All Active Hero Slides */}
          <div className="absolute inset-0 z-0">
            {activeHeroSlides.map((slide, idx) => {
              const isActive = idx === currentHeroIndex;

              // Responsive background images by screen size & theme mode
              const bgMobileDark = slide.mobileDark || slide.desktopDark || institutional.heroBgImage;
              const bgMobileLight = slide.mobileLight || slide.desktopLight || bgMobileDark;
              const bgMobile = !isDark ? bgMobileLight : bgMobileDark;

              const bgTabletDark = slide.tabletDark || slide.desktopDark || institutional.heroBgImage;
              const bgTabletLight = slide.tabletLight || slide.desktopLight || bgTabletDark;
              const bgTablet = !isDark ? bgTabletLight : bgTabletDark;

              const bgDesktopDark = slide.desktopDark || institutional.heroBgImage;
              const bgDesktopLight = slide.desktopLight || bgDesktopDark;
              const bgDesktop = !isDark ? bgDesktopLight : bgDesktopDark;

              const slideImageKey = `${slide.id || idx}_${bgDesktop}_${bgTablet}_${bgMobile}_${isDark ? 'dark' : 'light'}`;

              return (
                <div
                  key={slideImageKey}
                  className={`absolute inset-0 z-0 transition-all duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                >
                  {/* Blurred image layer fills contain-mode edges with the active slide colors. */}
                  <picture className="hero-bg-backdrop-picture" aria-hidden="true">
                    {bgMobile && <source media="(max-width: 639px)" srcSet={bgMobile} />}
                    {bgTablet && <source media="(max-width: 1023px)" srcSet={bgTablet} />}
                    <img src={bgDesktop} alt="" className="hero-bg-backdrop" loading="eager" decoding="async" />
                  </picture>
                  <picture key={slideImageKey} className="absolute inset-0 w-full h-full">
                    {bgMobile && <source media="(max-width: 639px)" srcSet={bgMobile} />}
                    {bgTablet && <source media="(max-width: 1023px)" srcSet={bgTablet} />}
                    <img
                      key={slideImageKey}
                      src={bgDesktop}
                      alt={slide.titulo || "Fundo Hero Confficar"}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full hero-bg-img transition-transform duration-1000"
                    />
                  </picture>
                  <div className="hero-bg-edge-fade" aria-hidden="true" />
                  {/* Dynamic Hero Dark Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-all duration-300"
                    style={{
                      background: `linear-gradient(to right, rgba(28, 27, 27, ${Math.min(
                        1,
                        ((institutional.heroOverlayOpacity ?? 70) / 100) * 1.25
                      ).toFixed(2)}), rgba(28, 27, 27, ${((institutional.heroOverlayOpacity ?? 70) / 100).toFixed(
                        2
                      )}), rgba(28, 27, 27, ${(((institutional.heroOverlayOpacity ?? 70) / 100) * 0.55).toFixed(
                        2
                      )}))`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Previous / Next Slide Arrows Only (Hidden on Mobile) */}
          {activeHeroSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  handlePrevHeroSlide();
                  setIsHeroPaused(false);
                }}
                 className="hidden md:flex absolute left-3 md:left-6 top-1/2 lg:top-[calc(50%+200px)] -translate-y-1/2 z-20 p-3.5 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-2xl items-center justify-center opacity-85 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                title="Slide Anterior"
                aria-label="Slide Anterior"
              >
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleNextHeroSlide();
                  setIsHeroPaused(false);
                }}
                 className="hidden md:flex absolute right-3 md:right-6 top-1/2 lg:top-[calc(50%+200px)] -translate-y-1/2 z-20 p-3.5 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-2xl items-center justify-center opacity-85 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                title="Próximo Slide"
                aria-label="Próximo Slide"
              >
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">chevron_right</span>
              </button>
            </>
          )}

          {/* Hero Content Area */}
          <div
            className={`relative z-30 pointer-events-none w-full max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col ${
              institutional.heroVerticalAlign === 'top'
                ? 'justify-start'
                : institutional.heroVerticalAlign === 'bottom'
                ? 'justify-end'
                : 'justify-center'
            } min-h-[480px] md:min-h-[560px] py-12 md:py-16`}
          >
            {/* Animated Text Content for Current Slide */}
            <AnimatePresence mode="sync">
              {(() => {
                const currentSlide = activeHeroSlides[currentHeroIndex] || activeHeroSlides[0];
                const slideTag = currentSlide.tag || institutional.heroTagText || 'Líder em Transporte Executivo';
                const slideTitle = currentSlide.titulo || institutional.heroTitle;
                const slideSubtitle = currentSlide.subtitulo || institutional.heroSubtitle;

                const ctaPosition = currentSlide.ctaPosition || 'bottom-left';
                const ctaVertical = ctaPosition.split('-')[0] as 'top' | 'center' | 'bottom';
                const ctaHorizontal = (ctaPosition.split('-')[1] || 'left') as 'left' | 'center' | 'right';

                const ctaBaseX = ctaHorizontal === 'center' ? 50 : ctaHorizontal === 'right' ? 93 : 7;
                const ctaBaseY = ctaVertical === 'top' ? 20 : ctaVertical === 'center' ? 50 : 73;
                const ctaAnchorX = ctaHorizontal === 'center' ? '-50%' : ctaHorizontal === 'right' ? '-100%' : '0%';
                const ctaAnchorY = ctaVertical === 'center' ? '-50%' : ctaVertical === 'bottom' ? '-100%' : '0%';
                const legacyOffsetPercent = (value: number | undefined, axis: 'X' | 'Y', device: 'Desktop' | 'Tablet' | 'Mobile') => {
                  if (typeof value !== 'number') return 0;
                  const designSize = axis === 'X' ? 1280 : device === 'Desktop' ? 680 : device === 'Tablet' ? 580 : 520;
                  return Math.round((value / designSize) * 100);
                };

                const ctaOffset = {
                  desktopX:
                    typeof currentSlide.ctaOffsetXDesktopPercent === 'number'
                      ? `${currentSlide.ctaOffsetXDesktopPercent}%`
                      : `${legacyOffsetPercent(currentSlide.ctaOffsetXDesktop, 'X', 'Desktop')}%`,
                  desktopY:
                    typeof currentSlide.ctaOffsetYDesktopPercent === 'number'
                      ? `${currentSlide.ctaOffsetYDesktopPercent}%`
                      : `${legacyOffsetPercent(currentSlide.ctaOffsetYDesktop, 'Y', 'Desktop')}%`,
                  tabletX:
                    typeof currentSlide.ctaOffsetXTabletPercent === 'number'
                      ? `${currentSlide.ctaOffsetXTabletPercent}%`
                      : `${legacyOffsetPercent(currentSlide.ctaOffsetXTablet, 'X', 'Tablet')}%`,
                  tabletY:
                    typeof currentSlide.ctaOffsetYTabletPercent === 'number'
                      ? `${currentSlide.ctaOffsetYTabletPercent}%`
                      : `${legacyOffsetPercent(currentSlide.ctaOffsetYTablet, 'Y', 'Tablet')}%`,
                  mobileX:
                    typeof currentSlide.ctaOffsetXMobilePercent === 'number'
                      ? `${currentSlide.ctaOffsetXMobilePercent}%`
                      : `${legacyOffsetPercent(currentSlide.ctaOffsetXMobile, 'X', 'Mobile')}%`,
                  mobileY:
                    typeof currentSlide.ctaOffsetYMobilePercent === 'number'
                      ? `${currentSlide.ctaOffsetYMobilePercent}%`
                      : `${legacyOffsetPercent(currentSlide.ctaOffsetYMobile, 'Y', 'Mobile')}%`,
                };

                const heroCta = (
                  <div
                    key={`${currentSlide.id || currentHeroIndex}-cta`}
                    className="hero-cta-anchor pointer-events-auto"
                    style={{
                      '--cta-base-x': `${ctaBaseX}%`,
                      '--cta-base-y': `${ctaBaseY}%`,
                      '--cta-anchor-x': ctaAnchorX,
                      '--cta-anchor-y': ctaAnchorY,
                      '--cta-offset-x-desktop': ctaOffset.desktopX,
                      '--cta-offset-y-desktop': ctaOffset.desktopY,
                      '--cta-offset-x-tablet': ctaOffset.tabletX,
                      '--cta-offset-y-tablet': ctaOffset.tabletY,
                      '--cta-offset-x-mobile': ctaOffset.mobileX,
                      '--cta-offset-y-mobile': ctaOffset.mobileY,
                    } as React.CSSProperties}
                  >
                    <motion.div
                      initial={{ x: '-100vw', opacity: 0 }}
                      animate={ctaReady ? { x: 0, opacity: 1 } : { x: '-100vw', opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 55, damping: 18, mass: 1 }}
                      className="w-max max-w-[calc(100vw-32px)]"
                    >
                    <button
                      type="button"
                      onClick={(e) => {
                        setIsHeroPaused(false);
                        handleRequestQuoteDirectly(currentSlide.titulo || undefined, e);
                      }}
                      className="group relative inline-flex items-center gap-2.5 overflow-hidden bg-gradient-to-r from-[#0A0A0A] via-[#1A1A1A] to-gold-600 hover:from-[#1A1A1A] hover:via-[#C89200] hover:to-gold-500 text-white font-black text-sm sm:text-base uppercase tracking-wider px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl shadow-[0_10px_35px_-8px_rgba(219,164,0,0.5)] hover:shadow-[0_14px_45px_-8px_rgba(250,200,40,0.65)] transition-all duration-300 hover:scale-[1.04] active:scale-95 cursor-pointer border border-white/20 backdrop-blur-sm"
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                      <span className="material-symbols-outlined text-[20px]">calculate</span>
                      <span>{currentSlide.ctaText || 'Solicitar Orçamento'}</span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                    </button>
                    </motion.div>
                  </div>
                );

                return (
                  <>
                  <motion.div
                    key={currentSlide.id || currentHeroIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className={`text-white flex flex-col transition-all duration-500 max-w-3xl ${
                      institutional.heroTextAlign === 'center'
                        ? 'text-center items-center mx-auto'
                        : institutional.heroTextAlign === 'right'
                        ? 'text-right items-end ml-auto'
                        : 'text-left items-start'
                    }`}
                  >
                    {(institutional.showHeroTag ?? true) && (
                      <span className="inline-flex items-center gap-1.5 bg-[#1A1A1A]/80 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-md backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                        <span>{slideTag}</span>
                      </span>
                    )}

                    {(institutional.showHeroTitle ?? true) && (
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-5 text-white leading-[1.15] tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                        {slideTitle}
                      </h1>
                    )}

                    {(institutional.showHeroSubtitle ?? true) && (
                      <p
                        className={`text-base md:text-xl text-[#eae7e7] mb-8 leading-relaxed font-normal ${
                          institutional.heroTextAlign === 'center'
                            ? 'max-w-xl mx-auto'
                            : institutional.heroTextAlign === 'right'
                            ? 'max-w-xl ml-auto'
                            : 'max-w-xl'
                        }`}
                      >
                        {slideSubtitle}
                      </p>
                    )}

                    {(institutional.showHeroIcons ?? true) && (
                      <div
                        className={`flex flex-wrap items-center gap-3 sm:gap-5 text-[#f0eded] pt-2 ${
                          institutional.heroTextAlign === 'center'
                            ? 'justify-center'
                            : institutional.heroTextAlign === 'right'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
                          <span className="material-symbols-filled text-[#D4AF37] text-lg">verified</span>
                          <span className="text-xs md:text-sm font-bold tracking-wide">Motoristas Qualificados</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
                          <span className="material-symbols-filled text-[#D4AF37] text-lg">workspace_premium</span>
                          <span className="text-xs md:text-sm font-bold tracking-wide">Frota Premium</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
                          <span className="material-symbols-filled text-[#D4AF37] text-lg">support_agent</span>
                          <span className="text-xs md:text-sm font-bold tracking-wide">Atendimento 24/7</span>
                        </div>
                      </div>
                    )}

                  </motion.div>
                  {currentSlide.ctaEnabled !== false && heroCta}
                  </>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Hero Slide Indicators / Dots */}
          {activeHeroSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15">
              {activeHeroSlides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentHeroIndex(idx);
                    setIsHeroPaused(false);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentHeroIndex
                      ? 'w-4 bg-gold-400 shadow-[0_0_8px_rgba(219,164,0,0.9)]'
                      : 'w-1.5 bg-white/30 hover:bg-white/70'
                  }`}
                  aria-label={`Ir para o slide ${idx + 1}`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Dedicated Quotation Section - Always Visible */}
        <section
          id="cotacao"
          className={`py-16 md:py-24 border-b transition-colors duration-500 relative overflow-hidden scroll-mt-24 md:scroll-mt-28 ${
            isDark
              ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800 text-white'
              : 'bg-gradient-to-b from-slate-50 via-gold-50/20 to-white border-slate-200 text-[#1c1b1b]'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
              isDark ? 'bg-gold-600/10' : 'bg-[#0A0A0A]/5'
            }`}
          />
          <div
            className={`absolute bottom-0 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
              isDark ? 'bg-gold-600/10' : 'bg-gold-500/5'
            }`}
          />

          <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-10">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span
                className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border shadow-xs ${
                  isDark
                    ? 'bg-gold-950/80 text-gold-300 border-gold-700/80'
                    : 'bg-[#FEEFC3] text-[#0A0A0A] border-[#0A0A0A]/20'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cotação Online 24/7</span>
              </span>

              <h2 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3 tracking-tight">
                Solicite sua Cotação Personalizada
              </h2>

              <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Preencha os detalhes da viagem abaixo para receber uma estimativa instantânea e atendimento especializado dos nossos consultores.
              </p>
            </div>

            {/* Layout Grid: Info Column + Quote Form Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Benefits & Trust Markers */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-between h-full">
                <div className={`p-6 md:p-8 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-white backdrop-blur-md shadow-lg shadow-black/40'
                    : 'bg-white border-slate-200/80 text-slate-800 shadow-xl shadow-slate-200/50'
                }`}>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-2xl ${isDark ? `text-gold-400` : `text-[#0A0A0A]`}`}>verified_user</span>
                    <span>Por que viajar com a Confficar?</span>
                  </h3>

                  <div className="space-y-5 text-sm">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'bg-[#0A0A0A]/10 text-[#0A0A0A]'
                      }`}>
                        <span className="material-symbols-outlined text-xl">speed</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-0.5">Resposta Rápida</h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Orçamentos transparentes com atendimento em poucos minutos via WhatsApp ou e-mail.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'bg-[#0A0A0A]/10 text-[#0A0A0A]'
                      }`}>
                        <span className="material-symbols-outlined text-xl">directions_car</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-0.5">Frota Nova & Higienizada</h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Sedans, SUVs blindados, Vans e Ônibus revisados com seguro completo de passageiros.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'bg-[#0A0A0A]/10 text-[#0A0A0A]'
                      }`}>
                        <span className="material-symbols-outlined text-xl">badge</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-0.5">Motoristas Profissionais</h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Motoristas qualificados, trajados e treinados em condução defensiva e sigilo corporativo.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'bg-[#0A0A0A]/10 text-[#0A0A0A]'
                      }`}>
                        <span className="material-symbols-outlined text-xl">domain</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-0.5">Faturamento para Empresas</h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Condições especiais de pagamento faturado para contas corporativas e eventos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Box */}
                <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-100' : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-emerald-500 shrink-0">chat</span>
                    <div>
                      <h4 className="font-bold text-sm">Precisa de atendimento imediato?</h4>
                      <p className="text-xs opacity-80">Fale diretamente com nossa central de reservas no WhatsApp.</p>
                    </div>
                  </div>
                  <a
                    href={institutional?.whatsappUrl || 'https://wa.me/5511940517447'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>Falar no WhatsApp</span>
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Full Responsive Quote Form */}
              <div id="cotacao-form" className="lg:col-span-7 scroll-mt-28">
                <div className={`rounded-3xl p-6 sm:p-8 md:p-10 border shadow-2xl transition-all relative overflow-hidden ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white ring-1 ring-gold-500/20 shadow-gold-950/40'
                    : 'bg-white border-slate-200/80 text-slate-900 ring-1 ring-[#0A0A0A]/10 shadow-2xl shadow-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between pb-6 mb-6 border-b ${isDark ? `border-slate-800` : `border-slate-200`}">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-2xl ${isDark ? `text-gold-400` : `text-[#0A0A0A]`}`}>calendar_clock</span>
                        <span>Solicitar Orçamento</span>
                      </h3>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Informe os dados da sua rota para receber o valor calculado
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-500/10 ${isDark ? `text-emerald-400` : `text-emerald-600`} border border-emerald-500/20 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Retorno Rápido</span>
                    </span>
                  </div>

                  <form onSubmit={handleQuoteSubmit} className="space-y-5">
                    {/* Contact Info Group */}
                    <div className={`p-4 rounded-xl border space-y-4 transition-colors ${
                      isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
                    }`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="nomeCliente" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Seu Nome Completo *
                          </label>
                          <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 focus-within:border-gold-400'
                              : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                          }`}>
                            <span className={`material-symbols-outlined mr-2 text-[20px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>person</span>
                            <input
                              id="nomeCliente"
                              type="text"
                              value={quote.nomeCliente || ''}
                              onChange={(e) => setQuote({ ...quote, nomeCliente: e.target.value })}
                              placeholder="Ex: Carlos Silva"
                              className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${
                                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                              }`}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="whatsappCliente" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            WhatsApp / Telefone com DDD *
                          </label>
                          <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                            phoneError
                              ? 'border-red-500 focus-within:border-red-600'
                              : isDark
                                ? 'bg-slate-900 border-slate-700 focus-within:border-gold-400'
                                : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                          }`}>
                            <span className={`material-symbols-outlined mr-2 text-[20px] ${phoneError ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>phone</span>
                            <input
                              id="whatsappCliente"
                              type="tel"
                              value={quote.whatsappCliente || ''}
                              onChange={handleWhatsAppChange}
                              placeholder="(11) 99999-8888"
                              className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${
                                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                              }`}
                              required
                            />
                          </div>
                          {phoneError && (
                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              <span>{phoneError}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Route Info Group */}
                    <div className={`p-4 rounded-xl border space-y-4 transition-colors ${
                      isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
                    }`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="origem" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Origem *
                          </label>
                          <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 focus-within:border-gold-400'
                              : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                          }`}>
                            <span className={`material-symbols-outlined mr-2 text-[20px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>my_location</span>
                            <input
                              id="origem"
                              type="text"
                              value={quote.origem}
                              onChange={(e) => setQuote({ ...quote, origem: e.target.value })}
                              placeholder="Heliporto de Farol de São Thomé"
                              className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${
                                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                              }`}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="destino" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Destino *
                          </label>
                          <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 focus-within:border-gold-400'
                              : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                          }`}>
                            <span className={`material-symbols-outlined mr-2 text-[20px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>location_on</span>
                            <input
                              id="destino"
                              type="text"
                              value={quote.destino}
                              onChange={(e) => setQuote({ ...quote, destino: e.target.value })}
                              placeholder="Aeroporto Santos Dumont"
                              className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${
                                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                              }`}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details & Vehicle Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="data" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Data e Hora *
                        </label>
                        <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 focus-within:border-gold-400'
                            : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                        }`}>
                          <span className={`material-symbols-outlined mr-2 text-[18px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>calendar_today</span>
                          <input
                            id="data"
                            type="datetime-local"
                            value={quote.dataHora}
                            onChange={(e) => setQuote({ ...quote, dataHora: e.target.value })}
                            className={`w-full bg-transparent border-none p-0 text-xs sm:text-sm focus:ring-0 outline-none ${
                              isDark ? 'text-white [color-scheme:dark]' : 'text-slate-900'
                            }`}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="passageiros" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Passageiros
                        </label>
                        <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 focus-within:border-gold-400'
                            : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                        }`}>
                          <span className={`material-symbols-outlined mr-2 text-[18px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>group</span>
                          <select
                            id="passageiros"
                            value={quote.passageiros}
                            onChange={(e) => setQuote({ ...quote, passageiros: e.target.value })}
                            className={`w-full bg-transparent border-none p-0 text-xs sm:text-sm focus:ring-0 cursor-pointer outline-none ${
                              isDark ? 'text-white bg-slate-800' : 'text-slate-900'
                            }`}
                          >
                            <option value="1 a 3 Passageiros" className={isDark ? 'bg-slate-800 text-white' : ''}>1 a 3 Pass.</option>
                            <option value="4 a 6 Passageiros" className={isDark ? 'bg-slate-800 text-white' : ''}>4 a 6 Pass.</option>
                            <option value="7 a 15 Passageiros" className={isDark ? 'bg-slate-800 text-white' : ''}>7 a 15 Pass.</option>
                            <option value="15+ Passageiros" className={isDark ? 'bg-slate-800 text-white' : ''}>15+ Pass.</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="veiculo" className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Veículo / Frota
                        </label>
                        <div className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 focus-within:border-gold-400'
                            : 'bg-white border-slate-300 focus-within:border-[#0A0A0A]'
                        }`}>
                          <span className={`material-symbols-outlined mr-2 text-[18px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>directions_car</span>
                          <select
                            id="veiculo"
                            value={quote.veiculo}
                            onChange={(e) => setQuote({ ...quote, veiculo: e.target.value })}
                            className={`w-full bg-transparent border-none p-0 text-xs sm:text-sm focus:ring-0 cursor-pointer outline-none ${
                              isDark ? 'text-white bg-slate-800' : 'text-slate-900'
                            }`}
                          >
                            {fleet.map((item) => (
                              <option key={item.id} value={item.nome} className={isDark ? 'bg-slate-800 text-white' : ''}>
                                {item.categoria} - {item.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gold-500 hover:bg-gold-400 text-white font-extrabold text-sm uppercase tracking-wider py-4 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5 border border-gold-600/30 mt-2"
                    >
                      <span>CALCULAR COTAÇÃO INSTANTÂNEA</span>
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className={`py-20 transition-colors duration-500 scroll-mt-24 md:scroll-mt-28 ${isDark ? 'bg-slate-900' : 'bg-[#ffffff]'}`} id="servicos">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  isDark ? 'bg-gold-950/70 text-gold-300 border border-gold-900/60' : 'bg-[#FEEFC3] text-[#0A0A0A]'
                }`}>
                  Excelência Operacional
                </span>
                <h2 className={`text-2xl md:text-3xl font-black mt-3 mb-3 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>
                  Soluções em Mobilidade Corporativa
                </h2>
                <p className={`text-sm md:text-base max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                  Serviços customizados de alto padrão para diretores, comitivas, diplomatas e equipes de alta gerência. Navegue e personalize seu roteiro.
                </p>
              </div>

              {/* View Mode Switcher (Grid vs Slide/Carousel) */}
              <div className={`flex items-center gap-1.5 p-1 rounded-xl border self-start md:self-end ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setServiceDisplayMode('carousel')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    serviceDisplayMode === 'carousel'
                      ? 'bg-[#0A0A0A] text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-[#0A0A0A]'
                  }`}
                  aria-label="Modo Carrossel"
                >
                  <span className="material-symbols-outlined text-[16px]">view_carousel</span>
                  <span className="hidden sm:inline">Deslizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDisplayMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    serviceDisplayMode === 'grid'
                      ? 'bg-[#0A0A0A] text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-[#0A0A0A]'
                  }`}
                  aria-label="Modo Grelha"
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span className="hidden sm:inline">Ver Todos</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
              {serviceCategories.map((category) => {
                const isActive = selectedServiceCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedServiceCategory(category);
                      // Scroll list to start when changing filter
                      if (servicesScrollRef.current) {
                        servicesScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all cursor-pointer border ${
                      isActive
                        ? isDark
                          ? 'bg-gold-600/25 border-gold-400 text-gold-400 font-black shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                          : 'bg-[#0A0A0A] border-[#0A0A0A] text-white shadow-md'
                        : isDark
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredServices.length === 0 && (
              <div className={`p-16 text-center rounded-2xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`material-symbols-outlined text-4xl mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  search_off
                </span>
                <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Nenhum serviço correspondente encontrado para a categoria selecionada.
                </p>
                <button
                  onClick={() => setSelectedServiceCategory('Todos')}
                  className={`mt-4 font-bold text-xs ${isDark ? `text-gold-400` : `text-[#0A0A0A]`} hover:underline cursor-pointer`}
                >
                  Ver todas as opções de transporte
                </button>
              </div>
            )}

            {/* Slider / Carousel View Mode */}
            {filteredServices.length > 0 && (
              <div className="relative group/carousel">
                {serviceDisplayMode === 'carousel' ? (
                  <>
                    {/* Horizontal Scroller Container */}
                    <div
                      ref={servicesScrollRef}
                      onScroll={updateServicesScrollState}
                      onMouseDown={handleServicesMouseDown}
                      onMouseMove={handleServicesMouseMove}
                      onMouseUp={handleServicesMouseUpOrLeave}
                      onMouseLeave={handleServicesMouseUpOrLeave}
                      className={`flex gap-6 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 select-none ${
                        isDraggingServices
                          ? 'cursor-grabbing scroll-auto'
                          : 'cursor-grab scroll-smooth snap-x snap-mandatory'
                      }`}
                    >
                      {filteredServices.map((serv) => {
                        const isSelected = selectedServiceId === serv.id;
                        const serviceImg = getServiceImage(serv);

                        return (
                          <div
                            key={serv.id}
                            className="w-[290px] sm:w-[320px] md:w-[340px] shrink-0 snap-start flex flex-col justify-between group cursor-pointer"
                            onClick={() => {
                              if (hasMovedServicesRef.current) return;
                              setSelectedServiceModal(serv);
                            }}
                          >
                            <div
                              className={`h-full rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1.5 ${
                                isSelected
                                  ? isDark
                                    ? 'bg-slate-900 border-gold-500 shadow-lg shadow-gold-950/30 text-white ring-2 ring-gold-500/50'
                                    : 'bg-white border-[#0A0A0A] shadow-lg shadow-[#0A0A0A]/20 text-[#1c1b1b] ring-2 ring-[#0A0A0A]/30'
                                  : isDark
                                    ? 'bg-slate-950 border-slate-800 text-slate-200 group-hover:border-slate-700'
                                    : 'bg-[#fcf9f8] border-slate-200/80 group-hover:border-[#0A0A0A] text-[#1c1b1b]'
                              }`}
                            >
                              {/* Service Clean Image Header */}
                              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                                <img
                                  src={serviceImg}
                                  alt={serv.titulo}
                                  draggable={false}
                                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-active:scale-100 pointer-events-none"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300" />
                              </div>

                              {/* Content Area */}
                              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                <div>
                                  {/* Header with Icon + Title */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                                      isSelected
                                        ? 'bg-gold-500 text-white shadow-md'
                                        : 'bg-[#0A0A0A] text-white shadow-sm'
                                    }`}>
                                      <span className="material-symbols-outlined text-[22px]">{serv.icon}</span>
                                    </div>
                                    <h3 className={`text-base sm:text-lg font-black leading-snug transition-colors group-hover:${isDark ? `text-gold-300` : `text-[#0A0A0A]`} ${
                                      isDark ? 'text-white' : 'text-[#1c1b1b]'
                                    }`}>
                                      {serv.titulo}
                                    </h3>
                                  </div>

                                  <p className={`text-xs leading-relaxed line-clamp-3 md:line-clamp-none ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {serv.descricao}
                                  </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-5 pt-4 border-t border-slate-200/10 flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedServiceModal(serv);
                                    }}
                                    className={`w-full py-2 px-3 rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                      isDark
                                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                                        : 'bg-white border-slate-200 text-[#0A0A0A] hover:bg-slate-100 hover:border-[#0A0A0A]/40'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    <span>Ver Detalhes do Serviço</span>
                                  </button>
                                  <a
                                    href="#cotacao"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedServiceId(serv.id);
                                      handleRequestQuoteDirectly(serv.titulo || serv.id, e);
                                    }}
                                    className={`w-full py-2 px-3 rounded-xl text-[11px] font-black tracking-wider uppercase text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                      isDark
                                        ? 'bg-gold-600 hover:bg-gold-500 text-white'
                                        : 'bg-gold-500 hover:bg-gold-400 text-white'
                                    }`}
                                  >
                                    <span>Solicitar agora</span>
                                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons (Only visible on desktop/hover) */}
                    {canScrollLeftServices && (
                      <button
                        onClick={scrollServicesLeft}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all z-10 hover:scale-105 active:scale-95 cursor-pointer hidden md:flex items-center justify-center ${
                          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-[#0A0A0A]'
                        }`}
                        title="Anterior"
                        aria-label="Anterior"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                    )}
                    {canScrollRightServices && (
                      <button
                        onClick={scrollServicesRight}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all z-10 hover:scale-105 active:scale-95 cursor-pointer hidden md:flex items-center justify-center ${
                          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-[#0A0A0A]'
                        }`}
                        title="Próximo"
                        aria-label="Próximo"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    )}

                    {/* Desktop Swipe Hint */}
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <div className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Deslize para navegar pelas opções
                      </div>
                      <span className={`material-symbols-outlined text-[12px] animate-pulse ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        swipe
                      </span>
                    </div>
                  </>
                ) : (
                  /* Normal Grid View Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredServices.map((serv) => {
                      const isSelected = selectedServiceId === serv.id;
                      const serviceImg = getServiceImage(serv);

                      return (
                        <div
                          key={serv.id}
                          className="group flex flex-col justify-between cursor-pointer"
                          onClick={() => setSelectedServiceModal(serv)}
                        >
                          <div
                            className={`h-full rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1.5 ${
                              isSelected
                                ? isDark
                                  ? 'bg-slate-900 border-gold-500 shadow-lg shadow-gold-950/30 text-white ring-2 ring-gold-500/50'
                                  : 'bg-white border-[#0A0A0A] shadow-lg shadow-[#0A0A0A]/20 text-[#1c1b1b] ring-2 ring-[#0A0A0A]/30'
                                : isDark
                                  ? 'bg-slate-950 border-slate-800 text-slate-200 group-hover:border-slate-700'
                                  : 'bg-[#fcf9f8] border-slate-200/80 group-hover:border-[#0A0A0A] text-[#1c1b1b]'
                            }`}
                          >
                            {/* Service Clean Image Header */}
                            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                              <img
                                src={serviceImg}
                                alt={serv.titulo}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-active:scale-100"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300" />
                            </div>

                            {/* Content Area */}
                            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                              <div>
                                {/* Header with Icon + Title */}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                                    isSelected
                                      ? 'bg-gold-500 text-white shadow-md'
                                      : 'bg-[#0A0A0A] text-white shadow-sm'
                                  }`}>
                                    <span className="material-symbols-outlined text-[22px]">{serv.icon}</span>
                                  </div>
                                  <h3 className={`text-base sm:text-lg font-black leading-snug transition-colors group-hover:${isDark ? `text-gold-300` : `text-[#0A0A0A]`} ${
                                    isDark ? 'text-white' : 'text-[#1c1b1b]'
                                  }`}>
                                    {serv.titulo}
                                  </h3>
                                </div>

                                <p className={`text-xs leading-relaxed line-clamp-3 md:line-clamp-none ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {serv.descricao}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-5 pt-4 border-t border-slate-200/10 flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedServiceModal(serv);
                                  }}
                                  className={`w-full py-2 px-3 rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                    isDark
                                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                                      : 'bg-white border-slate-200 text-[#0A0A0A] hover:bg-slate-100 hover:border-[#0A0A0A]/40'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">info</span>
                                  <span>Ver Detalhes do Serviço</span>
                                </button>
                                <a
                                  href="#cotacao"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedServiceId(serv.id);
                                    handleRequestQuoteDirectly(serv.titulo || serv.id, e);
                                  }}
                                  className={`w-full py-2 px-3 rounded-xl text-[11px] font-black tracking-wider uppercase text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                    isDark
                                      ? 'bg-gold-600 hover:bg-gold-500 text-white'
                                      : 'bg-gold-500 hover:bg-gold-400 text-white'
                                  }`}
                                >
                                  <span>Solicitar agora</span>
                                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Vehicle Types Showcase Section */}
        <section className={`py-20 transition-colors duration-500 scroll-mt-24 md:scroll-mt-28 ${isDark ? 'bg-slate-950' : 'bg-[#fcf9f8]'}`} id="tipos-veiculos">
          <div id="frota" className="scroll-mt-28" />
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  isDark ? 'bg-gold-950 text-gold-300 border border-gold-800' : 'bg-[#FEEFC3] text-[#0A0A0A]'
                }`}>
                  Segurança & Conforto
                </span>
                <h2 className={`text-2xl md:text-3xl font-bold mt-3 mb-2 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>Tipos de Veículos</h2>
                <p className={`text-base max-w-xl ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                  Veículos novos, rigorosamente higienizados e inspecionados para garantir conforto e segurança em cada trajeto.
                </p>
              </div>
              <a
                href="#contato"
                className={`inline-flex items-center justify-center border font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded transition-colors w-fit ${
                  isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                    : 'border-[#727781] text-[#1c1b1b] hover:bg-[#f0eded]'
                }`}
              >
                Ver Catálogo Completo
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {fleet.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
                  className={`rounded-xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col hover:-translate-y-1.5 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#c1c7d2]/60'
                  }`}
                >
                  <div className={`relative h-64 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-[#f0eded]'}`}>
                    <img
                      src={item.image}
                      alt={item.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className={`absolute top-4 left-4 backdrop-blur-sm px-3 py-1 rounded-full border shadow-xs ${
                      isDark ? 'bg-slate-950/90 text-slate-200 border-slate-800' : 'bg-white/90 text-[#1c1b1b] border-[#727781]/20'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {item.categoria}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>{item.nome}</h3>
                      <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>{item.descricao}</p>
                    </div>

                    <div>
                      <div className={`grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t text-xs ${
                        isDark ? 'border-slate-800 text-slate-300' : 'border-[#c1c7d2]/30 text-[#414750]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>person</span>
                          <span>{item.passageiros}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>luggage</span>
                          <span>{item.malas}</span>
                        </div>
                        {item.diferenciais.slice(0, 2).map((diff, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[18px] ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>check_circle</span>
                            <span>{diff}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-6">
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleModal(item)}
                          className={`flex-1 font-semibold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-[#f0eded] hover:bg-slate-200 text-[#1c1b1b] border-slate-300'
                          }`}
                        >
                          <span>Detalhes</span>
                          <span className="material-symbols-outlined text-[15px]">info</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            handleRequestQuoteDirectly(item.nome || item.categoria, e);
                          }}
                          className="flex-1 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer bg-gold-500 hover:bg-gold-400 text-white shadow-sm active:scale-95"
                        >
                          <span>Cotação</span>
                          <span className="material-symbols-outlined text-[15px]">calculate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Institutional / Sobre Nós */}
        <section className={`py-20 transition-colors duration-500 scroll-mt-24 md:scroll-mt-28 ${isDark ? 'bg-slate-900' : 'bg-[#ffffff]'}`} id="sobre">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  isDark ? 'bg-gold-950 text-gold-300 border border-gold-800' : 'bg-[#FEEFC3] text-[#0A0A0A]'
                }`}>
                  Sobre a Confficar
                </span>
                <h2 className={`text-2xl md:text-3xl font-bold mt-4 mb-6 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>
                  Tradição, Segurança e Discrição Corporativa
                </h2>
                <p className={`text-base leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                  {institutional.quemSomos}
                </p>
                <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-[#414750]'}`}>
                  {institutional.missao}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {institutional.valores.map((valor, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-[#fcf9f8] border-[#c1c7d2]/50 text-[#1c1b1b]'
                    }`}>
                      <span className={`material-symbols-filled ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>verified</span>
                      <span className="text-xs font-bold">{valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                onMouseEnter={() => setIsAboutSlidePaused(true)}
                onMouseLeave={() => setIsAboutSlidePaused(false)}
                onTouchStart={() => setIsAboutSlidePaused(true)}
                onTouchEnd={() => setIsAboutSlidePaused(false)}
                onTouchCancel={() => setIsAboutSlidePaused(false)}
                onFocusCapture={() => setIsAboutSlidePaused(true)}
                onBlurCapture={() => setIsAboutSlidePaused(false)}
                className={`relative rounded-2xl overflow-hidden shadow-xl border group min-h-[360px] md:min-h-[420px] bg-slate-950 ${isDark ? 'border-slate-800' : 'border-[#c1c7d2]'}`}
              >
                <AnimatePresence mode="wait">
                  {activeAboutSlides.map((slide, idx) => {
                    if (idx !== (aboutSlideIndex % activeAboutSlides.length)) return null;
                    return (
                      <motion.div
                        key={`${slide.id || idx}_${slide.url}`}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0"
                      >
                        <img
                          src={slide.url}
                          alt={slide.title || "Confficar Sobre Nós"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/20 to-transparent flex items-end p-6 md:p-8">
                          <div className="text-white max-w-lg">
                            {slide.title && <p className="text-xl md:text-2xl font-bold leading-tight drop-shadow">{slide.title}</p>}
                            {slide.subtitle && <p className="text-xs md:text-sm text-[#D4AF37] mt-1 drop-shadow">{slide.subtitle}</p>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Controles do Carousel / Setas dos Slides em "Sobre a Confficar" */}
                {activeAboutSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAboutSlideIndex((prev) => (prev - 1 + activeAboutSlides.length) % activeAboutSlides.length);
                        setIsAboutSlidePaused(true);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900/95 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xl z-10 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                      title="Slide Anterior"
                      aria-label="Slide Anterior"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAboutSlideIndex((prev) => (prev + 1) % activeAboutSlides.length);
                        setIsAboutSlidePaused(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900/95 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xl z-10 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                      title="Próximo Slide"
                      aria-label="Próximo Slide"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className={`py-20 transition-colors duration-500 scroll-mt-24 md:scroll-mt-28 ${isDark ? 'bg-slate-950' : 'bg-[#f6f3f2]'}`} id="depoimentos">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="text-center mb-16">
              <h2 className={`text-2xl md:text-3xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>
                O que dizem nossos parceiros corporativos
              </h2>
              <p className={`text-base max-w-2xl mx-auto ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                A confiança de grandes empresas é o que move nossa busca constante pela excelência em cada trajeto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl p-8 border shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-[#c1c7d2]/50 text-[#414750]'
                  }`}
                >
                  <div>
                    {/* Stars Rating if available */}
                    {item.rating && item.rating > 0 && (
                      <div className="flex items-center gap-1 mb-3 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx} className="material-symbols-outlined text-sm">
                            {idx < (item.rating || 5) ? 'star' : 'star_outline'}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className={`text-sm italic mb-8 leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                      "{item.texto}"
                    </p>
                  </div>

                  <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-[#c1c7d2]/30'}`}>
                    <div className="flex items-center gap-3">
                      {item.foto ? (
                        <img
                          src={item.foto}
                          alt={item.autor}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#0A0A0A]/20 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isDark ? 'bg-gold-950 text-gold-300 border border-gold-800' : 'bg-gold-50 text-[#0A0A0A] border border-gold-100'
                        }`}>
                          {item.autor ? item.autor.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                      <div>
                        <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>{item.autor}</p>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>
                          {item.cargo}
                        </p>
                        {item.empresa && (
                          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#727781]'}`}>{item.empresa}</p>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-filled text-[#1A1A1A] text-[28px] opacity-20 shrink-0">format_quote</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors duration-500 ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-[#f4f1f0] border-[#c1c7d2]/80 text-[#1c1b1b]'
      }`} id="contato">
        {/* Top Quick Contact Bar */}
        <div className={`border-b ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-[#c1c7d2]/40 bg-white/60'}`}>
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-gold-950 text-gold-400 border border-gold-800' : 'bg-[#FEEFC3] text-[#0A0A0A]'
              }`}>
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#727781]'}`}>Atendimento 24 Horas</p>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>Central de Reservas & Plantão</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#727781]'}`}>WhatsApp Corporativo</p>
                <a href="#cotacao" onClick={(e) => handleRequestQuoteDirectly(undefined, e)} className={`text-xs font-bold hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  Solicitar Cotação Direta
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-gold-950 text-gold-400 border border-gold-700' : 'bg-gold-100 text-[#0A0A0A]'
              }`}>
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#727781]'}`}>E-mail Oficial</p>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>contato@grupoconficar.com.br</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-800'
              }`}>
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#727781]'}`}>Certificações</p>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>Frota Segurada & Cadastur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 py-16 px-4 md:px-10 max-w-[1280px] mx-auto">
          {/* Brand Column */}
          <div className="space-y-4">
            <a href="#" onClick={(e) => handleAnchorClick(e, '#header')} className="flex items-center gap-2.5">
              <img
                src={(isDark ? (logos?.logoDark || logos?.logoFooter) : logos?.logoFooter) || ASSET_IMAGES.logoFooter}
                alt="Confficar Logo Footer"
                style={{
                  height: logos?.logoFooterHeightPx ? `${logos.logoFooterHeightPx}px` : undefined
                }}
                className={`w-auto object-contain ${
                  !logos?.logoFooterHeightPx ? 'h-9' : ''
                }`}
              />
              {(logos?.logoTitle !== undefined ? logos.logoTitle.trim() : 'Confficar') && (
                <span className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                  {logos?.logoTitle !== undefined ? logos.logoTitle : 'Confficar'}
                </span>
              )}
            </a>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#414750]'}`}>
              Soluções de excelência em mobilidade corporativa, transporte executivo de diretores, transfer aeroporto e faturamento empresarial com frota própria e segurança máxima.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>
                Siga a Confficar:
              </span>
              <div className={`flex gap-2 ${isDark ? 'text-slate-400' : 'text-[#414750]'}`}>
                <a href="#" className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 hover:text-white hover:border-gold-500' : 'bg-white border-slate-200 hover:text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`} title="Linkedin Confficar"><span className="material-symbols-outlined text-[16px]">work</span></a>
                <a href="#" className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 hover:text-white hover:border-gold-500' : 'bg-white border-slate-200 hover:text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`} title="Instagram Confficar"><span className="material-symbols-outlined text-[16px]">photo_camera</span></a>
                <a href="#" className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 hover:text-white hover:border-gold-500' : 'bg-white border-slate-200 hover:text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`} title="Localização Confficar"><span className="material-symbols-outlined text-[16px]">location_on</span></a>
              </div>
            </div>
          </div>

          {/* Column 2: Empresa & Institucional */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 pb-2 border-b ${
              isDark ? 'text-white border-slate-800' : 'text-[#1c1b1b] border-slate-300'
            }`}>
              Empresa
            </h4>
            <ul className={`space-y-2.5 text-xs ${isDark ? 'text-slate-400' : 'text-[#414750]'}`}>
              <li>
                <a href="#sobre" onClick={(e) => handleAnchorClick(e, '#sobre')} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">chevron_right</span>
                  <span>Sobre a Confficar</span>
                </a>
              </li>
              <li>
                <a href="#tipos-veiculos" onClick={(e) => handleAnchorClick(e, '#tipos-veiculos')} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">chevron_right</span>
                  <span>Frota & Veículos</span>
                </a>
              </li>
              <li>
                <a href="#servicos" onClick={(e) => handleAnchorClick(e, '#servicos')} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">chevron_right</span>
                  <span>Diferenciais</span>
                </a>
              </li>
              <li>
                <a href="#depoimentos" onClick={(e) => handleAnchorClick(e, '#depoimentos')} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">chevron_right</span>
                  <span>Depoimentos de Clientes</span>
                </a>
              </li>
              <li>
                <a href="#contato" onClick={(e) => handleAnchorClick(e, '#contato')} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">chevron_right</span>
                  <span>Falar com Atendimento</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Soluções & Serviços */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 pb-2 border-b ${
              isDark ? 'text-white border-slate-800' : 'text-[#1c1b1b] border-slate-300'
            }`}>
              Serviços Executivos
            </h4>
            <ul className={`space-y-2.5 text-xs ${isDark ? 'text-slate-400' : 'text-[#414750]'}`}>
              <li>
                <a href="#cotacao" onClick={(e) => handleRequestQuoteDirectly('sedan', e)} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">directions_car</span>
                  <span>Transporte Executivo</span>
                </a>
              </li>
              <li>
                <a href="#cotacao" onClick={(e) => handleRequestQuoteDirectly('sedan', e)} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">flight_land</span>
                  <span>Transfer Aeroporto (GRU/CGH/VCP)</span>
                </a>
              </li>
              <li>
                <a href="#cotacao" onClick={(e) => handleRequestQuoteDirectly('suv', e)} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">shield</span>
                  <span>Veículos Blindados & SUVs</span>
                </a>
              </li>
              <li>
                <a href="#cotacao" onClick={(e) => handleRequestQuoteDirectly('van', e)} className={`transition-colors flex items-center gap-1.5 ${isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[14px] opacity-60">airport_shuttle</span>
                  <span>Vans & Logística de Eventos</span>
                </a>
              </li>
              <li>
                <a href="#cotacao" onClick={(e) => handleRequestQuoteDirectly(undefined, e)} className={`transition-colors flex items-center gap-1.5 font-bold ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-[#0A0A0A] hover:text-[#1A1A1A]'}`}>
                  <span className="material-symbols-outlined text-[14px]">calculate</span>
                  <span>Solicitar Cotação Rápida</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Portais & Acesso (TODOS OS BOTÕES E LINKS DE ACESSO NO MESMO LADO) */}
          <div className="space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider pb-2 border-b ${
              isDark ? 'text-white border-slate-800' : 'text-[#1c1b1b] border-slate-300'
            }`}>
              Portais & Acesso
            </h4>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#414750]'}`}>
              Acesso direto para passageiros, gestores de frota e administração do portal.
            </p>

            {/* Agrupamento dos Botões de Acesso do mesmo lado */}
            <div className="space-y-2.5 pt-1">
              {/* Botão 1: ACESSAR SISTEMA (app.grupoconficar.com.br) */}
              <a
                href="https://app.grupoconficar.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full inline-flex items-center justify-between gap-2 text-xs uppercase tracking-wider font-extrabold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer border ${
                  isDark
                    ? 'bg-gold-600 hover:bg-gold-500 text-white border-gold-400/40 shadow-gold-950/40'
                    : 'bg-gold-500 hover:bg-gold-400 text-white border-gold-600/30 shadow-gold-600/25'
                }`}
                title="Acessar o Sistema Operacional de Viagens Corporativas (app.grupoconficar.com.br)"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                  <span>ACESSAR SISTEMA</span>
                </div>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>

              {/* Botão 2: Acesso Restrito */}
              <button
                type="button"
                onClick={() => onViewChange('cms-login')}
                className={`w-full inline-flex items-center justify-between gap-2 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer border ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
                }`}
                title="Painel Administrativo do Site"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                  <span>Acesso Restrito</span>
                </div>
                <span className="material-symbols-outlined text-[14px] opacity-60">chevron_right</span>
              </button>
            </div>

            {/* Links Legais Adicionais na mesma coluna */}
            <div className={`pt-2 border-t text-[11px] flex flex-wrap gap-x-4 gap-y-1 ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-[#727781]'
            }`}>
              <a href="#" className={isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}>Privacidade</a>
              <span>•</span>
              <a href="#" className={isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}>Termos de Uso</a>
              <span>•</span>
              <a href="#" className={isDark ? 'hover:text-white' : 'hover:text-[#0A0A0A]'}>LGPD</a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={`border-t py-6 px-4 md:px-10 ${isDark ? 'border-slate-800 text-slate-400' : 'border-[#c1c7d2]/40 text-[#414750]'}`}>
          <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>
              © 2026 Confficar. Todos os direitos reservados.
              <span className="hidden sm:inline mx-2">|</span>
              <span className="block sm:inline mt-1 sm:mt-0">
                Desenvolvido por:{' '}
                <a
                  href="https://transporteapp.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-bold hover:underline ${isDark ? 'text-gold-300' : 'text-[#0A0A0A]'}`}
                >
                  Transporteapp
                </a>
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span>PT-BR</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a
        href={`${(institutional?.whatsappUrl || 'https://wa.me/5511940517447').replace(/\?text=.*$/, '')}?text=${encodeURIComponent('Olá! Gostaria de solicitar mais informações sobre os serviços de transporte executivo da Confficar.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-3.5 sm:p-4 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white border-2 border-white/30 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
        title="Falar com a Central Confficar via WhatsApp"
        aria-label="Atendimento via WhatsApp"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border border-white"></span>
        </span>
        <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="hidden sm:inline font-bold text-xs tracking-wide">Falar no WhatsApp</span>
      </a>

      {/* Floating Back-To-Top Button */}
      <button
        type="button"
        onClick={handleScrollToTop}
        className={`fixed bottom-22 right-6 z-40 p-3 sm:p-3.5 rounded-2xl shadow-xl border transition-all duration-300 transform active:scale-90 cursor-pointer flex items-center justify-center gap-1 group ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        } ${
          isDark
            ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-slate-950/60 backdrop-blur-md'
            : 'bg-white/90 hover:bg-slate-100 text-[#0A0A0A] border-slate-300 shadow-slate-900/15 backdrop-blur-md'
        }`}
        title="Voltar ao topo da página"
        aria-label="Voltar ao topo"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-y-1">
          arrow_upward
        </span>
      </button>

      {/* Quote Breakdown Result Modal */}
      {calculatedQuote && calculatedQuote.showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#c1c7d2] text-[#1c1b1b]'
          }`}>
            <button
              onClick={() => setCalculatedQuote(null)}
              className={`absolute top-4 right-4 ${isDark ? 'text-slate-400 hover:text-white' : 'text-[#727781] hover:text-[#1c1b1b]'}`}
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            {!calculatedQuote.submittedSuccess ? (
              <>
                <div className={`flex items-center gap-2 mb-3 ${isDark ? 'text-emerald-400' : 'text-[#0A0A0A]'}`}>
                  <span className="material-symbols-outlined text-[28px]">chat</span>
                  <h3 className="text-xl font-bold">Solicitar Cotação via WhatsApp</h3>
                </div>

                <p className={`text-xs mb-6 ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                  Confira o resumo das suas informações de itinerário e contato. Clique no botão abaixo para solicitar sua cotação diretamente via WhatsApp.
                </p>

                <div className={`space-y-3 p-4 rounded-lg border text-xs mb-6 ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-[#fcf9f8] border-[#c1c7d2]/60 text-[#1c1b1b]'
                }`}>
                  <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-[#c1c7d2]/40'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Nome do Solicitante:</span>
                    <span className="font-semibold text-right">{calculatedQuote.nomeCliente}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-[#c1c7d2]/40'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>WhatsApp de Contato:</span>
                    <span className="font-semibold text-right">{calculatedQuote.whatsappCliente}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-[#c1c7d2]/40'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Origem:</span>
                    <span className="font-semibold text-right">{calculatedQuote.origem}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-[#c1c7d2]/40'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Destino:</span>
                    <span className="font-semibold text-right">{calculatedQuote.destino}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-[#c1c7d2]/40'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Data/Hora:</span>
                    <span className="font-semibold">{calculatedQuote.dataHora}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-[#c1c7d2]/40'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Veículo:</span>
                    <span className={`font-semibold ${isDark ? 'text-gold-300' : 'text-[#0A0A0A]'}`}>{calculatedQuote.veiculoNome}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Passageiros:</span>
                    <span className="font-semibold">{calculatedQuote.passageiros}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCalculatedQuote(null)}
                    className={`border font-semibold text-xs py-3 px-4 rounded-lg ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#c1c7d2] text-[#1c1b1b] hover:bg-[#f0eded]'
                    }`}
                  >
                    Alterar Dados
                  </button>

                  <a
                    href={`${(institutional?.whatsappUrl || 'https://wa.me/5511940517447').replace(/\?text=.*$/, '')}?text=${encodeURIComponent(
                      `Olá! Gostaria de solicitar cotação para viagem executiva:\n\n` +
                      `• Nome: ${calculatedQuote.nomeCliente}\n` +
                      `• WhatsApp: ${calculatedQuote.whatsappCliente}\n` +
                      `• Origem: ${calculatedQuote.origem}\n` +
                      `• Destino: ${calculatedQuote.destino}\n` +
                      `• Data/Hora: ${calculatedQuote.dataHora}\n` +
                      `• Veículo: ${calculatedQuote.veiculoNome}\n` +
                      `• Passageiros: ${calculatedQuote.passageiros}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleConfirmBooking}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>SOLICITAR COTAÇÃO VIA WHATSAPP</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-gold-950 text-gold-300' : 'bg-[#FEEFC3] text-[#0A0A0A]'
                }`}>
                  <span className="material-symbols-filled text-[36px]">check_circle</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>Solicitação Recebida!</h3>
                <p className={`text-xs mb-6 ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
                  Sua solicitação de cotação foi enviada com sucesso para a central de operações e para o sistema externo de viagens. Nosso concierge entrará em contato em breve.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setCalculatedQuote(null)}
                    className="bg-[#0A0A0A] text-white font-semibold text-xs px-6 py-2.5 rounded hover:bg-[#1A1A1A]"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedServiceModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative border max-h-[90vh] overflow-y-auto transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#c1c7d2] text-[#1c1b1b]'
          }`}>
            {/* Modal Service Image Banner */}
            <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-slate-950">
              <img
                src={getServiceImage(selectedServiceModal)}
                alt={selectedServiceModal.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Close Button on Image */}
              <button
                onClick={() => setSelectedServiceModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all z-10 cursor-pointer"
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              {/* Title Overlay on Image */}
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                    <span className="material-symbols-outlined text-[26px]">{selectedServiceModal.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-gold-500 text-white shadow-sm">
                      Serviço Executivo Premium
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-md">
                      {selectedServiceModal.titulo}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className={`p-5 rounded-xl border leading-relaxed text-sm mb-6 ${
                isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-[#fcf9f8] border-slate-200 text-[#414750]'
              }`}>
                <p className={`font-semibold text-base mb-2 ${isDark ? `text-gold-400` : `text-[#0A0A0A]`}`}>Visão Geral:</p>
                {selectedServiceModal.descricao}
              </div>

            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-200' : 'text-[#1c1b1b]'}`}>
              O que este serviço inclui:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                { title: 'Motoristas Bilíngues', desc: 'Opção de motoristas profissionais fluentes em inglês e espanhol.', icon: 'translate' },
                { title: 'Monitoramento de Voos', desc: 'Controle de pousos para ajuste automático de horários.', icon: 'flight_land' },
                { title: 'Frota Nova & Blindada', desc: 'Veículos higienizados com alto padrão de blindagem Nível III-A.', icon: 'shield' },
                { title: 'Atendimento 24h', desc: 'Suporte contínuo via central exclusiva para alterações rápidas.', icon: 'support_agent' },
                { title: 'Água & Conectividade', desc: 'Cortesia de água mineral e Wi-Fi de alta velocidade a bordo.', icon: 'wifi' },
                { title: 'Faturamento Mensal', desc: 'Planos corporativos customizados com cobrança flexível.', icon: 'payments' },
              ].map((item, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border flex gap-3 ${
                  isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
                }`}>
                  <span className={`material-symbols-outlined shrink-0 text-[22px] ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>
                    {item.icon}
                  </span>
                  <div>
                    <h5 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>{item.title}</h5>
                    <p className={`text-[11px] leading-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 flex-wrap pt-4 border-t border-slate-200/10">
              <button
                type="button"
                onClick={() => setSelectedServiceModal(null)}
                className={`font-semibold text-xs px-5 py-3 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-[#1c1b1b] hover:bg-slate-200'
                }`}
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={(e) => {
                  setSelectedServiceModal(null);
                  handleRequestQuoteDirectly(selectedServiceModal.titulo, e);
                }}
                className="font-bold text-xs px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-white flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 border border-gold-600/30"
              >
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span>Solicitar Orçamento deste Serviço</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicleModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative border max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#c1c7d2] text-[#1c1b1b]'
          }`}>
            <button
              onClick={() => setSelectedVehicleModal(null)}
              className={`absolute top-4 right-4 ${isDark ? 'text-slate-400 hover:text-white' : 'text-[#727781] hover:text-[#1c1b1b]'}`}
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            <div className={`h-64 rounded-lg overflow-hidden mb-6 ${isDark ? 'bg-slate-800' : 'bg-[#f0eded]'}`}>
              <img
                src={selectedVehicleModal.image}
                alt={selectedVehicleModal.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
              isDark ? 'bg-gold-950 text-gold-300' : 'bg-[#FEEFC3] text-[#0A0A0A]'
            }`}>
              {selectedVehicleModal.categoria}
            </span>
            <h3 className={`text-2xl font-bold mt-2 mb-3 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>{selectedVehicleModal.nome}</h3>
            <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>{selectedVehicleModal.descricao}</p>

            <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg border text-xs mb-6 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#fcf9f8] border-[#c1c7d2]/50'
            }`}>
              <div>
                <p className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Capacidade de Passageiros:</p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>{selectedVehicleModal.passageiros}</p>
              </div>
              <div>
                <p className={isDark ? 'text-slate-400' : 'text-[#727781]'}>Capacidade de Bagagem:</p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>{selectedVehicleModal.malas}</p>
              </div>
            </div>

            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-white' : 'text-[#1c1b1b]'}`}>Diferenciais e Conforto</h4>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8 text-xs ${isDark ? 'text-slate-300' : 'text-[#414750]'}`}>
              {selectedVehicleModal.diferenciais.map((d, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-2 rounded ${isDark ? 'bg-slate-800' : 'bg-[#f0eded]'}`}>
                  <span className={`material-symbols-filled text-[16px] ${isDark ? 'text-gold-400' : 'text-[#0A0A0A]'}`}>check_circle</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedVehicleModal(null)}
                className={`font-semibold text-xs px-5 py-3 rounded-xl cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-[#f0eded] text-[#1c1b1b] hover:bg-[#eae7e7]'
                }`}
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={(e) => {
                  handleRequestQuoteDirectly(selectedVehicleModal.nome || selectedVehicleModal.categoria, e);
                }}
                className="font-bold text-xs px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-white flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span>Solicitar Cotação com Este Veículo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
