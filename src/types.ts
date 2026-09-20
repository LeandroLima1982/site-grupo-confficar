export type ViewMode = 'public' | 'login' | 'admin' | 'cms-login';

export type UserRole = 'empresa' | 'motorista' | 'equipe';

export type AdminSection = 
  | 'dashboard'
  | 'logos'
  | 'banners'
  | 'servicos'
  | 'frota'
  | 'depoimentos'
  | 'conteudo'
  | 'seo'
  | 'cloudinary'
  | 'painel_externo'
  | 'usuarios'
  | 'configuracoes';

export interface CMSUser {
  id: string;
  name: string;
  email: string;
  password: string;
  isSuperAdmin: boolean;
  active: boolean;
  allowedSections: AdminSection[];
  createdAt: string;
  lastLogin?: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  author: string;
  siteName: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robots: string;
  structuredDataJson: string;
  lastUpdatedDate?: string;
  lastTitleChangeDate?: string;
}

export interface SiteLogos {
  logoHeader: string;
  logoSidebar: string;
  logoLogin: string;
  logoFooter: string;
  logoDark?: string;
  logoLoading?: string;
  logoTitle?: string;
  logoSubtitle?: string;
  logoHeaderHeightPx?: number;
  logoFooterHeightPx?: number;
  logoSidebarHeightPx?: number;
  logoLoginHeightPx?: number;
}

export interface QuoteForm {
  origem: string;
  destino: string;
  dataHora: string;
  passageiros: string;
  veiculo: string;
  nomeCliente?: string;
  whatsappCliente?: string;
}

export interface BannerItem {
  id: string;
  titulo: string;
  status: 'Ativo' | 'Inativo';
  image: string;
  desc?: string;
}

export interface ServiceItem {
  id: string;
  titulo: string;
  descricao: string;
  icon: string;
  ultimaEdicao: string;
  destaque?: boolean;
  image?: string;
}

export interface FleetItem {
  id: string;
  nome: string;
  categoria: string;
  modeloSpecs: string;
  descricao: string;
  passageiros: string;
  malas: string;
  diferenciais: string[];
  image: string;
  disponivel: boolean;
  precoEstimadoBase: number;
}

export interface TestimonialItem {
  id: string;
  autor: string;
  cargo: string;
  empresa: string;
  texto: string;
  foto?: string;
  rating?: number;
  destaque?: boolean;
}

export interface AboutSlideItem {
  id: string;
  url: string;
  title?: string;
  subtitle?: string;
  active: boolean;
}

export interface HeroSlideItem {
  id: string;
  titulo?: string;
  subtitulo?: string;
  tag?: string;

  // Imagens customizadas por tipo de tela (Desktop, Tablet, Mobile) e por Tema (Claro / Escuro)
  desktopDark: string;
  desktopLight?: string;

  tabletDark?: string;
  tabletLight?: string;

  mobileDark?: string;
  mobileLight?: string;

  active?: boolean;

  // Botão CTA do slide (Simular Viagem)
  ctaEnabled?: boolean;
  ctaText?: string;
  ctaPosition?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  ctaOffsetXDesktop?: number;
  ctaOffsetYDesktop?: number;
  ctaOffsetXTablet?: number;
  ctaOffsetYTablet?: number;
  ctaOffsetXMobile?: number;
  ctaOffsetYMobile?: number;
  // Percentual offsets override the legacy pixel fields above.
  ctaOffsetXDesktopPercent?: number;
  ctaOffsetYDesktopPercent?: number;
  ctaOffsetXTabletPercent?: number;
  ctaOffsetYTabletPercent?: number;
  ctaOffsetXMobilePercent?: number;
  ctaOffsetYMobilePercent?: number;
}

export interface ServiceWatermarkConfig {
  enabled?: boolean;
  imageUrl?: string;
  sizePx?: number;
  opacity?: number;
  position?: 'top-right' | 'bottom-right' | 'center' | 'top-left' | 'bottom-left';
  showMode?: 'always' | 'hover' | 'selected';
}

export interface InstitutionalContent {
  heroTitle: string;
  heroSubtitle: string;
  heroTagText?: string;
  heroBgImage: string;
  heroBgImageLight?: string;
  heroBgImageTablet?: string;
  heroBgImageTabletLight?: string;
  heroBgImageMobile?: string;
  heroBgImageMobileLight?: string;
  heroOverlayOpacity?: number;
  showHeroTag?: boolean;
  showHeroTitle?: boolean;
  showHeroSubtitle?: boolean;
  showHeroIcons?: boolean;
  heroTextAlign?: 'left' | 'center' | 'right';
  heroVerticalAlign?: 'top' | 'center' | 'bottom';

  // Configurações do Carrossel de Slides Hero (até 5 slides com customização por tela e tema)
  heroSlides?: HeroSlideItem[];
  heroAutoSlideInterval?: number; // Tempo em milissegundos (ex: 5000)
  heroAutoSlideEnabled?: boolean;

  // Personalização Manual de Tamanho e Formato do Background Hero por Dispositivo
  heroHeightDesktopVh?: number;
  heroHeightTabletVh?: number;
  heroHeightMobileVh?: number;

  heroHeightDesktopPx?: number;
  heroHeightTabletPx?: number;
  heroHeightMobilePx?: number;

  heroHeightUnitDesktop?: 'vh' | 'px' | 'auto';
  heroHeightUnitTablet?: 'vh' | 'px' | 'auto';
  heroHeightUnitMobile?: 'vh' | 'px' | 'auto';

  heroObjectFitDesktop?: 'cover' | 'contain' | 'fill' | 'scale-down';
  heroObjectFitTablet?: 'cover' | 'contain' | 'fill' | 'scale-down';
  heroObjectFitMobile?: 'cover' | 'contain' | 'fill' | 'scale-down';

  heroObjectPositionDesktop?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top center' | 'bottom center';
  heroObjectPositionTablet?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top center' | 'bottom center';
  heroObjectPositionMobile?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top center' | 'bottom center';

  heroImageZoomDesktop?: number;
  heroImageZoomTablet?: number;
  heroImageZoomMobile?: number;

  quemSomos: string;
  missao: string;
  valores: string[];
  aboutSlides?: AboutSlideItem[];
  serviceWatermark?: ServiceWatermarkConfig;
  telefone?: string;
  whatsappUrl?: string;
  email?: string;
  endereco?: string;
  defaultSiteTheme?: 'light' | 'dark';
}

export interface ReservaItem {
  id: string;
  codigo: string;
  cliente: string;
  empresaCliente?: string;
  origem: string;
  destino: string;
  dataHora: string;
  veiculo: string;
  passageiros: string;
  status: 'Pendente' | 'Confirmada' | 'Em Trânsito' | 'Concluída' | 'Cancelada';
  valorEstimado: string;
  dataCriacao: string;
}
