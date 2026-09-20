import { BannerItem, FleetItem, InstitutionalContent, ServiceItem, SiteLogos, TestimonialItem, SEOSettings } from '../types';

export const ASSET_IMAGES = {
  logoHeader: '/logo-header.png',
  logoSidebar: '/logo-header.png',
  logoLogin: '/logo-header.png',
  logoFooter: '/logo-header.png',
  logoFull: '/logo-confficar.png',
  
  heroBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbXJBuXDJjtJE61ruULVLH3D0ViLjMVBbia95hdlyrRlEFVshdcfMuTkFfYlbzl2KAGG8A3qNY0eyj1KuxuT9aglu2j4b6dIyJNJ9nQh9FJCAtjaO0Gwwi77ehNxZZkY5VS6qnSUY9FElTVm-jbi16sRS6G4NviISrpYvYwm32mJCS3NOwWsjLZw-XgvW6yf3kr5fXklF4kq17wTIvwxkwF39N_0du8j3X92kcHgopwgx_Ogo45p6X',
  loginBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGUKJXQMqXfMCnyFj2t5hGy4Irg3HiFmvqTHjEpVLiLaex7P0k_PI8RCthREeL-TTt9-g_rwPi-bY31e6L5H_Un3SlMFa5JjVS3Jjo8PIslchXU1kkGovw7g6SbN1qnhgBdS-1A2LgXqE58_l2eRrSyaR7Ryvy6dV9MKt9W33HwmYQVnp45OyuKXX-l1Fq_aMwbFCbg8kbYDEb0lXTozrfviHvsuSI0Uk9A7VIfyYa11Fbd2r0Y-p4',

  corolla: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP9FHB2pttjX6Ktyukegh-zzzWtboYcoOfBa2_yjKSIVgXeK12VN1pNntXpY3PjWBCS-ypZM2K-J8iiqiovxiWtiqNNv2GHOdtxFuFB2H-JThGPRSMczSPL81Pmy3iaeSuuMv5a5_6XEfoURe77SReA7fuvGcduvTjV9BdVNIEikTBU34FNIYThMG9R8T-WxwhQCpHVOh8Hm0ttP1BtOIdczDVnWyi-JRRnIOJrRX1Hox8kkMst2I4',
  sprinter: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8-BiEt9DbGjFZrJtl4yTFo8zkzC2hIljf54h2J4a461nI9qIfjgWEo62NUt2VzC-DLb7xvNlfHRU9hkreuFu9s3x9JYaiyQLvs15Cax8f8rClHGD2AH9ED0hq8xNQMUp4xU9N6-dV3wo0-zTKwBH7FpByUY6nwa_Ogv2C738aNy66zds5526ujrCIoZRe8Q9C_nu3Scs8rLlu5V4oPEVgOtyjQ5xxYjY-AJzTVJ3r46xW9H_Wh5CU',
  onibus: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBo5a1y7zB4MgVMRADp2DkY_BsJpgG45s8CgAkmk3ZAWCZ8UDL5C14CW467Vw6fOIxwuAW_ChMZ_M-kmwcTxkPgiNPjLYA2z1DTWgaMoAmHLcPKavk4OapRljrFGPqoCSg6Vocn4CWdkK1eAq7m3DOIVp3K0AzaHUT2C2iAdEahF5ic0ioO8uh4k-CpUPH9LBg_qChh1SEJUtxD15txUU5jYu5icrHcnBTLUmrtiWgRkPlQ6ajbUX2R',

  bannerTransfer: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxu51s87nLGk9cWo0nyT63ds79xCinK_Zfx1ugLL8n9qZGkHwFM1mVgywtgOJzVxF39vw3T-_t_5ZAbkTU8r6P59qYvHho0n20tzdhexF7N9PvwbnqZAtSCK8UKwOndGaep60YHK0VHuYR-FDFe-Qz7-FoMMKj6-Kp5Na4mGsGiQuPdN_IT4O2ghR-lZuzk3LF1SDLwW9xgw2bGlr31tX3cPpSBm851eqKHPQ7cBEqm5fnRJSxuMyw',
  bannerBlindada: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDU6IRJML0M-8Bksw6l_WBXFaGlu5qQbfO-6-cZjLO4xoVC-t-RhxcySCOJMjRX_f_uR2ervDxHgPzWqNanDjtmJhd8MqxF20MkEi8jLZa82iwcIslul8FFna4y9PD3qi4EfHjnZjDGbjrYnNeghXCZNRsyyHbZG30F_F-LtpR8jT3QB6QrPBRUVE6QGKs2LuxVeYADH83WItDpEts374qRZ6IatuCNL4Jt0CWPPz4a8uGO05hMQydy',

  adminFleetSedan: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBD7YfzfHVROvSt16Kp1Jp9TehyNiwCMFQtHC7KnX-EdAFYLQN7LCl2AZQh9t2kIiD9AlsPFpoMd0S5P-8JshoqxulY4ijBVMuoPc-4rqi5OBbbUwSkAAA1fIN1ozCbhipa9ykJCFuzvcHNJ-Bu4FTwyPq9ay3mFlHANHuts1nmMn-T41WFOrB59GlppvdpImdT-RLPDqDjlJxvv9NKl6VPuxYevlMTCLAmTGx9LHT9L7u7ZtZa25cw',
  adminFleetVan: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnfTUjXiIc147bSpBmzHn84hGCVLCv76zEBLfHmf8FKJ_LYYlXRXrw_Ba_BCgWT0WCVZ_d-Ostr6pUISP7LwvoGAPJag0CvQKTKJ4tOyqF3okDvT8MdBFNolFvdpafT2yrcqDcnNl6kDNx-Wf7qUO209TT5q8Yo6tmx6TRSBfX-22Wy5VnjoTW7d0zRyJgJXtHNzH59v_wsskFPW0mDVzuGw7-Zm8x6dnWJaNppsqSFi495nfCdgMZ'
};

export const INITIAL_LOGOS: SiteLogos = {
  logoHeader: ASSET_IMAGES.logoHeader,
  logoSidebar: ASSET_IMAGES.logoSidebar,
  logoLogin: ASSET_IMAGES.logoLogin,
  logoFooter: ASSET_IMAGES.logoFooter,
  logoDark: '/logo-dark.png',
  logoLoading: '/favicon.png',
  logoTitle: 'Confficar',
  logoSubtitle: 'Mobilidade Corporativa',
  logoHeaderHeightPx: 48,
  logoFooterHeightPx: 48,
  logoSidebarHeightPx: 40,
  logoLoginHeightPx: 56,
};

export const INITIAL_BANNERS: BannerItem[] = [
  {
    id: 'b1',
    titulo: 'Transfer Executivo - SP',
    status: 'Ativo',
    image: ASSET_IMAGES.bannerTransfer,
    desc: 'Traslados ágeis nos principais aeroportos de São Paulo e região metropolitana.'
  },
  {
    id: 'b2',
    titulo: 'Frota Blindada Premium',
    status: 'Inativo',
    image: ASSET_IMAGES.bannerBlindada,
    desc: 'Veículos com certificação nível III-A para máximo rigor protocolar e de segurança.'
  }
];

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 's1',
    titulo: 'Transporte Executivo',
    descricao: 'Motoristas bilíngues e trajados a rigor, garantindo discrição e eficiência para reuniões e roadshows.',
    icon: 'business_center',
    ultimaEdicao: 'Hoje, 09:15',
    destaque: true,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 's2',
    titulo: 'Transfer Aeroporto',
    descricao: 'Recepção no desembarque (Meet & Greet) e monitoramento de voos em tempo real para pontualidade absoluta.',
    icon: 'flight_takeoff',
    ultimaEdicao: 'Ontem',
    destaque: true,
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 's3',
    titulo: 'Transporte de Grupos',
    descricao: 'Logística completa para eventos corporativos, feiras e convenções com vans e ônibus executivos de luxo.',
    icon: 'groups',
    ultimaEdicao: '10/05/2025',
    destaque: true,
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 's4',
    titulo: 'Veículos Blindados',
    descricao: 'Máxima segurança para executivos com frota certificada nível III-A e motoristas treinados em direção defensiva.',
    icon: 'shield',
    ultimaEdicao: '12/05/2025',
    destaque: true,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop'
  }
];

export const INITIAL_FLEET: FleetItem[] = [
  {
    id: 'f1',
    nome: 'Toyota Corolla 2025',
    categoria: 'Sedan Executivo',
    modeloSpecs: 'Toyota Corolla ou similar',
    descricao: 'O padrão em transporte executivo, oferecendo interior espaçoso em couro, ar-condicionado digital e silêncio absoluto.',
    passageiros: '3 Passageiros',
    malas: '3 Malas M',
    diferenciais: ['Climatizado', 'Wi-Fi a Bordo', 'Carregadores USB', 'Água Mineral'],
    image: ASSET_IMAGES.corolla,
    disponivel: true,
    precoEstimadoBase: 350
  },
  {
    id: 'f2',
    nome: 'Mercedes-Benz Sprinter',
    categoria: 'Van Premium',
    modeloSpecs: 'Mercedes-Benz Sprinter VIP',
    descricao: 'Ideal para delegações e equipes. Poltronas reclináveis em couro, amplo espaço interno e conforto superior para trajetos médios e longos.',
    passageiros: 'Até 15 Pass.',
    malas: '15 Malas G',
    diferenciais: ['Bancos Couro', 'Tomadas 110V', 'Wi-Fi a Bordo', 'Geladeira'],
    image: ASSET_IMAGES.sprinter,
    disponivel: true,
    precoEstimadoBase: 850
  },
  {
    id: 'f3',
    nome: 'Ônibus Executivo',
    categoria: 'Transporte em Massa',
    modeloSpecs: 'Scania / Marcopolo Paradiso',
    descricao: 'A solução definitiva para grandes eventos corporativos. Oferece toilette a bordo, entretenimento e poltronas leito para máximo conforto.',
    passageiros: 'Até 46 Pass.',
    malas: 'Bagageiro Amplo',
    diferenciais: ['Toilette', 'Monitores', 'Frigobar', 'Som Surround'],
    image: ASSET_IMAGES.onibus,
    disponivel: true,
    precoEstimadoBase: 2400
  }
];

export const INITIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    autor: 'Ricardo Almeida',
    cargo: 'Diretor de Operações',
    empresa: 'Global Tech SP',
    texto: 'A pontualidade da Confficar é impecável. Para nossa diretoria, a discrição e o profissionalismo dos motoristas bilíngues fazem toda a diferença em visitas internacionais.'
  },
  {
    id: 't2',
    autor: 'Fernanda Costa',
    cargo: 'Gerente de Logística',
    empresa: 'InvestCorp Partners',
    texto: 'Utilizamos o serviço de veículos blindados para nossos executivos e a sensação de segurança é total. O treinamento da equipe de direção defensiva é perceptível.'
  },
  {
    id: 't3',
    autor: 'Marcos Silveira',
    cargo: 'Head de Facilities',
    empresa: 'Grupo Confficar',
    texto: 'A logística para nosso último evento anual foi complexa, envolvendo vans e ônibus. A Confficar coordenou tudo com maestria, sem um único atraso registrado.'
  }
];

export const INITIAL_INSTITUTIONAL: InstitutionalContent = {
  heroTitle: 'Mobilidade Corporativa de Excelência.',
  heroSubtitle: 'Transporte executivo focado em pontualidade, discrição e segurança para sua empresa. Agende seu veículo com motorista bilíngue agora.',
  heroTagText: 'Líder em Transporte Executivo',
  heroBgImage: ASSET_IMAGES.heroBg,
  heroBgImageLight: ASSET_IMAGES.heroBg,
  heroBgImageTablet: ASSET_IMAGES.heroBg,
  heroBgImageTabletLight: ASSET_IMAGES.heroBg,
  heroBgImageMobile: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop',
  heroBgImageMobileLight: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop',
  heroOverlayOpacity: 70,
  showHeroTag: true,
  showHeroTitle: true,
  showHeroSubtitle: true,
  showHeroIcons: true,
  heroTextAlign: 'left',
  heroVerticalAlign: 'center',

  // Configuração do Carrossel de 5 Slides da Hero (com adaptação por Tela e Tema)
  heroAutoSlideInterval: 6000,
  heroAutoSlideEnabled: true,
  heroSlides: [
    {
      id: 'hs1',
      tag: 'Líder em Transporte Executivo',
      titulo: 'Mobilidade Corporativa de Excelência.',
      subtitulo: 'Transporte executivo focado em pontualidade, discrição e segurança para sua empresa. Agende seu veículo com motorista bilíngue agora.',
      desktopDark: ASSET_IMAGES.heroBg,
      desktopLight: ASSET_IMAGES.heroBg,
      tabletDark: ASSET_IMAGES.heroBg,
      tabletLight: ASSET_IMAGES.heroBg,
      mobileDark: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop',
      mobileLight: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop',
      active: true,
    },
    {
      id: 'hs2',
      tag: 'Aeroportos & Transfers VIP',
      titulo: 'Traslados Ágeis e Monitoramento de Voos.',
      subtitulo: 'Receptivo corporativo exclusivo nos aeroportos GRU, CGH e VCP com motoristas trajados a rigor e acompanhamento em tempo real.',
      desktopDark: ASSET_IMAGES.bannerTransfer,
      desktopLight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1600&auto=format&fit=crop',
      tabletDark: ASSET_IMAGES.bannerTransfer,
      tabletLight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop',
      mobileDark: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?q=80&w=800&auto=format&fit=crop',
      mobileLight: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?q=80&w=800&auto=format&fit=crop',
      active: true,
    },
    {
      id: 'hs3',
      tag: 'Segurança & Blindagem Nível III-A',
      titulo: 'Frota Blindada para Máxima Proteção.',
      subtitulo: 'Protocolos rigorosos de segurança e condutores treinados em direção defensiva para transporte de autoridades e conselheiros.',
      desktopDark: ASSET_IMAGES.bannerBlindada,
      desktopLight: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
      tabletDark: ASSET_IMAGES.bannerBlindada,
      tabletLight: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
      mobileDark: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
      mobileLight: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
      active: true,
    },
    {
      id: 'hs4',
      tag: 'Grupos, Feiras & Convenções',
      titulo: 'Vans Executivas e Ônibus Leito.',
      subtitulo: 'Coordenação e logística completa de frota para grandes comitivas corporativas, eventos e convenções de negócios.',
      desktopDark: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1600&auto=format&fit=crop',
      desktopLight: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1600&auto=format&fit=crop',
      tabletDark: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1000&auto=format&fit=crop',
      tabletLight: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop',
      mobileDark: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop',
      mobileLight: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop',
      active: true,
    },
    {
      id: 'hs5',
      tag: 'Roadshows & Atendimento 24/7',
      titulo: 'Atendimento Concierge e Gestão Inteligente.',
      subtitulo: 'Central operacional 24 horas pronta para ajustar itinerários, voos e necessidades especiais de roadshows executivos.',
      desktopDark: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
      desktopLight: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
      tabletDark: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
      tabletLight: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
      mobileDark: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      mobileLight: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      active: true,
    },
  ],

  // Default Responsive Hero Background Image Sizing Customization
  heroHeightUnitDesktop: 'vh',
  heroHeightDesktopVh: 75,
  heroHeightDesktopPx: 680,
  heroObjectFitDesktop: 'cover',
  heroObjectPositionDesktop: 'center',
  heroImageZoomDesktop: 100,

  heroHeightUnitTablet: 'vh',
  heroHeightTabletVh: 65,
  heroHeightTabletPx: 580,
  heroObjectFitTablet: 'cover',
  heroObjectPositionTablet: 'center',
  heroImageZoomTablet: 100,

  heroHeightUnitMobile: 'vh',
  heroHeightMobileVh: 60,
  heroHeightMobilePx: 520,
  heroObjectFitMobile: 'cover',
  heroObjectPositionMobile: 'center',
  heroImageZoomMobile: 100,

  quemSomos: 'Com mais de 15 anos de excelência no mercado de mobilidade corporativa, a Confficar conecta grandes empresas e executivos aos seus destinos com eficiência rigorosa e padrão internacional.',
  missao: 'Garantir soluções de transporte executivo com o mais elevado nível de segurança, discrição, conforto e tecnologia para líderes e corporações globais.',
  valores: ['Segurança Inegociável', 'Discrição Absoluta', 'Pontualidade de Elite', 'Atendimento White-Glove'],
  aboutSlides: [
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
  ],
  serviceWatermark: {
    enabled: false,
    imageUrl: '',
    sizePx: 80,
    opacity: 30,
    position: 'top-right',
    showMode: 'always'
  },
  telefone: '(22) 99918-8888',
  whatsappUrl: 'https://wa.me/5522999188888',
  email: 'contato@grupoconficar.com.br',
  endereco: 'Rio de Janeiro - RJ',
  defaultSiteTheme: 'light',
};

export const INITIAL_SEO: SEOSettings = {
  metaTitle: 'Confficar | Transporte Executivo e Transfers VIP',
  metaDescription: 'Líder em transporte executivo, transfer de aeroportos, vans de luxo e veículos blindados com motoristas bilíngues. Solicite sua cotação corporativa rápida.',
  keywords: [
    'transporte executivo',
    'transfer aeroporto rj',
    'aluguel van corporativa',
    'carro blindado executivo',
    'motorista bilingue rj',
    'mobilidade corporativa',
    'confficar transporte',
    'transfer galeao'
  ],
  canonicalUrl: 'https://grupoconficar.com.br/',
  author: 'Confficar',
  siteName: 'Confficar',
  ogTitle: 'Confficar | Transporte Executivo de Elite',
  ogDescription: 'Mobilidade executiva focada em pontualidade, segurança e veículos de alto padrão com motoristas bilíngues no Rio de Janeiro e todo o Brasil.',
  ogImage: ASSET_IMAGES.heroBg,
  robots: 'index, follow',
  structuredDataJson: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": "Confficar",
    "description": "Serviço especializado de transporte executivo, transfer aeroportuário e frota blindada corporativa.",
    "url": "https://grupoconficar.com.br",
    "logo": "/logo-confficar.png",
    "areaServed": "Brasil",
    "serviceType": ["Transporte Executivo", "Transfer Aeroporto", "Veículos Blindados", "Vans Executivas"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Confficar",
      "url": "https://grupoconficar.com.br",
      "logo": "/logo-confficar.png",
      "telephone": "+55-22-99918-8888",
      "priceRange": "$$$"
    }
  }, null, 2),
  lastUpdatedDate: '2026-08-04T12:00:00Z',
  lastTitleChangeDate: '2026-02-01T12:00:00Z'
};
