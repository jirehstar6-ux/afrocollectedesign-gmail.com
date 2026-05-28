import { motion } from 'motion/react';
import React, { useState } from 'react';
import { 
  MapPin, 
  Star, 
  Play, 
  Apple, 
  Store, 
  ShoppingBag, 
  ArrowRight, 
  Clock, 
  Truck, 
  ThumbsUp, 
  CheckCircle, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Award, 
  Heart, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShoppingBasket
} from 'lucide-react';
import { getVideo } from '../lib/videoStorage';

interface PortfolioProps {
  currentLangId: string;
}

export function Portfolio({ currentLangId }: PortfolioProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [simulatedProduct, setSimulatedProduct] = useState('manioc');
  const [simulatedWeight, setSimulatedWeight] = useState(10); // in kg
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeAfficheTitle, setActiveAfficheTitle] = useState('');
  const [affiches, setAffiches] = useState<any[]>([]);
  const [campaignVideo, setCampaignVideo] = useState('https://player.vimeo.com/external/370331493.sd.mp4?s=33d52579737cf9a3806be896f643e9fc448b111a&profile_id=139&oauth2_token_id=57447761');
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  const handlePlayVideo = async (a: any) => {
    setActiveAfficheTitle(currentLangId === 'fr' ? a.titleFr : (a.titleEn || a.titleFr));
    if (a.video) {
      if (a.video.startsWith('db:')) {
        try {
          const dbKey = a.video.replace('db:', '');
          const stored = await getVideo(dbKey);
          if (stored) {
            setActiveVideoUrl(stored);
          } else {
            setActiveVideoUrl(campaignVideo);
          }
        } catch (e) {
          console.error("Error loading indexdb video:", e);
          setActiveVideoUrl(campaignVideo);
        }
      } else {
        setActiveVideoUrl(a.video);
      }
    } else {
      setActiveVideoUrl(campaignVideo);
    }
    setIsVideoModalOpen(true);
  };

  React.useEffect(() => {
    const loadAffiches = () => {
      const savedLocal = JSON.parse(localStorage.getItem('djapero_portfolio_affiches') || 'null');
      if (savedLocal && Array.isArray(savedLocal) && savedLocal.length > 0) {
        setAffiches(savedLocal);
      } else {
        fetch('/api/affiches')
          .then(r => r.json())
          .then(data => {
            if (data && data.length > 0) {
              setAffiches(data);
              localStorage.setItem('djapero_portfolio_affiches', JSON.stringify(data));
            } else {
              setAffiches(defaultAffiches);
            }
          })
          .catch(() => setAffiches(defaultAffiches));
      }
    };
    loadAffiches();

    // Load custom campaign video if available
    getVideo('djapero_campaign_video').then((savedVideo) => {
      if (savedVideo) {
        setCampaignVideo(savedVideo);
      }
    }).catch(err => console.error("Error loading campaign video in portfolio:", err));

    const handleStorageChange = () => {
      const saved = JSON.parse(localStorage.getItem('djapero_portfolio_affiches') || '[]');
      if (saved.length > 0) setAffiches(saved);
      getVideo('djapero_campaign_video').then(v => {
        if (v) setCampaignVideo(v);
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const defaultAffiches = [
    {
      id: 'default-1',
      titleFr: "Du Terroir à l'Assiette Directement 🌍",
      titleEn: "From Local Farms Directly to Your Table 🌍",
      descFr: "Profitez des récoltes fraîches de la coopérative de Kpalimé et d'Adawlato, récoltées de manière équitable et livrées chez vous en un temps record.",
      descEn: "Enjoy premium fresh crops from the Kpalimé & Adawlato cooperatives, harvested ethically and shipped directly to your door in record time.",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"
    },
    {
      id: 'default-2',
      titleFr: "Nos Vendeurs et Vendeuses de Confiance 🛍️",
      titleEn: "Empowering Native Women Retail Entrepreneurs 🛍️",
      descFr: "Plus de 82% de votre panier est reversé en circuit court à nos commerçants partenaires. Chaque commande soutient directement le pouvoir d'achat des familles.",
      descEn: "More than 82% of every single purchase directly finances our partner retail heads, immediately increasing local household income.",
      image: "https://images.unsplash.com/photo-1488459711635-0c00289b76c6?auto=format&fit=crop&q=80&w=1200"
    }
  ];

  // Simple copy translator based on currentLangId
  const getCopy = (key: string) => {
    const isFr = currentLangId === 'fr' || currentLangId !== 'en';
    const copy: Record<string, Record<string, string>> = {
      tagline: {
        fr: "5.0 étoiles sur Google (Plus de 1,200 avis vérifiés) ★★★★★",
        en: "5.0-star Google rating (Over 1,200 verified reviews) ★★★★★"
      },
      hero_title: {
        fr: "Parce que manger frais & local ne devrait jamais être compliqué. 🔥",
        en: "Because source local eating shouldn't be overcomplicated. 🔥"
      },
      hero_desc: {
        fr: "Djapero est le premier pont numérique reliant les familles, restaurateurs et gastronomes directement aux marchés traditionnels et coopératives agricoles d'Afrique. Des produits cueillis avec soin, acheminés en circuit court et livrés chez vous.",
        en: "Djapero is the premier digital gateway bridging families, restaurateurs, and food enthusiasts directly with Africa's traditional farm cooperatives. Responsibly sourced, short-circuit transportation, delivered directly to you."
      },
      btn_app: {
        fr: "Télécharger l'App",
        en: "Download the App"
      },
      btn_demo: {
        fr: "Voir la Démo",
        en: "Watch Demo"
      },
      stat_satisfied: {
        fr: "Clients satisfaits",
        en: "Happy Customers"
      },
      stat_partners: {
        fr: "Coopératives & Agriculteurs",
        en: "Partner Farmers"
      },
      stat_delivered: {
        fr: "Marchés d'Afrique connectés",
        en: "Connected Markets"
      },
      why_title: {
        fr: "3 Raisons de choisir Djapero",
        en: "3 Reasons to Choose Djapero"
      },
      why_subtitle: {
        fr: "Garantir un impact de la terre africaine jusqu'à votre assiette.",
        en: "Guaranteeing impact, from authentic African soil straight to your table."
      },
      card1_title: {
        fr: "Marchés 100% Locaux",
        en: "100% African Markets"
      },
      card1_desc: {
        fr: "Accédez en temps réel aux plus grands marchés de Lomé, Cotonou, Abidjan et Dakar. Une immersion olfactive, colorée et gustative à portée de main.",
        en: "Get real-time digital access to West Africa's biggest local markets. A vibrant, colorful culinary experience right at your fingertips."
      },
      card2_title: {
        fr: "Qualité & Terroir",
        en: "Absolute Premium Quality"
      },
      card2_desc: {
        fr: "Aucun produit de synthèse ou d'importation industrielle. Nous sélectionnons des variétés pures, biologiques et cueillies à maturité optimale.",
        en: "No synthetic or industrial bulk imports. We source strictly select, organic crop varieties harvested at their absolute peak of health."
      },
      card3_title: {
        fr: "Transparence Éthique",
        en: "Ethical & Fair Pricing"
      },
      card3_desc: {
        fr: "Nous supprimons l'intermédiation excessive. Plus de 82% du prix payé revient en direct aux mains des femmes commerçantes et agriculteurs.",
        en: "We eliminate retail gouging and unnecessary middle-men. More than 82% of every basket directly empowers women market heads and farmers."
      },
      step_title: {
        fr: "Comment ça marche ?",
        en: "How does it work?"
      },
      step_subtitle: {
        fr: "Votre approvisionnement solidaire en 3 étapes simples",
        en: "Your community-focused local supply in 3 easy steps"
      },
      step1_title: {
        fr: "1. Choisissez votre marché ou ville",
        en: "1. Select your target local market"
      },
      step1_desc: {
        fr: "Sélectionnez votre marché de base (comme Assigamé ou Dandokpa) via notre carte interactive en un clic.",
        en: "Pick your starting market node (like Assigamé, Dantokpa or Adawlato) with our simple high-resolution interactive map."
      },
      step2_title: {
        fr: "2. Composez votre panier frais",
        en: "2. Build your tailored fresh basket"
      },
      step2_desc: {
        fr: "Ajoutez maniocs, épices moulues à la main, avocat de montagne ou piments d'Afrique fraîchement récoltés.",
        en: "Load up on hand-ground spices, cassava, organic mountain avocados, or sun-ripened habaneros."
      },
      step3_title: {
        fr: "3. Livraison éclair & Impact local",
        en: "3. Rapid dispatch & local farm impact"
      },
      step3_desc: {
        fr: "Livreurs certifiés acheminant avec soin. Suivez l'impact social généré instantanément sur votre application.",
        en: "Get fresh delivery by certified local couriers with zero waste. Watch your real-time economic impact."
      },
      calc_title: {
        fr: "Simulateur d'Impact Économique local 🌍",
        en: "Local economic growth calculator 🌍"
      },
      calc_desc: {
        fr: "Estimez comment vos achats avec Djapero stimulent directement l'activité des agriculteurs et des vendeuses traditionnelles de nos marchés.",
        en: "See how your bulk or retail purchases with Djapero directly raise native income or fund farm collectives."
      }
    };

    return copy[key]?.[isFr ? 'fr' : 'en'] || '';
  };

  // Prices and impact calculations
  const productImpacts: Record<string, { nameFr: string, nameEn: string, pricePerKg: number, farmerShare: number, socialHours: number }> = {
    manioc: { nameFr: 'Manioc Bio de Kpalimé', nameEn: 'Organic Kpalimé Cassava', pricePerKg: 350, farmerShare: 0.85, socialHours: 1.5 },
    epices: { nameFr: 'Épices de Dantokpa', nameEn: 'Dantokpa Hand-made Spices', pricePerKg: 1200, farmerShare: 0.82, socialHours: 4.0 },
    plantain: { nameFr: 'Banane Plantain douce', nameEn: 'Sweet Yellow Plantains', pricePerKg: 500, farmerShare: 0.84, socialHours: 2.2 },
    avocat: { nameFr: 'Avocat Beurre Naturel', nameEn: 'Creamy Mountain Avocado', pricePerKg: 800, farmerShare: 0.86, socialHours: 3.0 },
  };

  const selectedProdInfo = productImpacts[simulatedProduct];
  const totalPrice = selectedProdInfo.pricePerKg * simulatedWeight;
  const directFarmerRevenue = Math.round(totalPrice * selectedProdInfo.farmerShare);
  const socialHoursGenerated = Math.ceil((simulatedWeight * selectedProdInfo.socialHours) / 10);

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
      } else {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) videoId = match[2];
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0` : null;
  };

  return (
    <div className="w-full pb-0 px-4 sm:px-6 animate-in fade-in duration-550">
      
      {/* Portfolio Header with a clear title to verify viewing state */}
      <div className="w-full max-w-[1240px] mx-auto pt-4 mb-6 border-b border-slate-100 pb-3">
        <h1 className="text-xl font-bold text-slate-400 uppercase tracking-[0.2em]">{currentLangId === 'fr' ? 'PORTFOLIO' : 'PROJECTS'}</h1>
      </div>

      {/* 1. AFFICHES & CAMPAIGN VISUALS SECTION */}
      <div className="mb-16 pt-4 w-full flex flex-col items-center">
        <div className="w-full max-w-[1240px] text-center mx-auto mb-8">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase text-[#1E8C45] tracking-widest bg-[#1E8C45]/5 px-3 py-1.5 rounded-full w-fit mb-4 mx-auto">
            <Sparkles size={14} className="animate-pulse" />
            <span>{currentLangId === 'fr' ? 'Campagnes & Affiches' : 'Campaigns & Flyers'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
            {currentLangId === 'fr' ? "Notre Galerie d'Affiches" : "Our Visual Posters"}
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            {currentLangId === 'fr' 
              ? "Découvrez l'ensemble de nos campagnes éducatives, affiches publicitaires, et événements solidaires directement gérés depuis notre portail d'administration." 
              : "Discover our latest campaigns, advertisement rollouts, and community announcements directly curated by our cooperative admin team."}
          </p>
        </div>

        <div className="flex flex-col items-center gap-12 w-full max-w-[1200px] mx-auto">
          {(affiches.length > 0 ? affiches : defaultAffiches).map((a, idx) => (
            <div 
              key={a.id || idx}
              className="w-full max-w-[850px] overflow-hidden rounded-[32px] shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 bg-white p-2 sm:p-4 flex justify-center items-center relative group"
            >
              {/* Clean, high-quality, centered poster image with an elegant floating Player button on its side */}
              <div className="relative w-full rounded-[24px] overflow-hidden">
                <img 
                  src={a.image} 
                  alt={currentLangId === 'fr' ? a.titleFr : a.titleEn} 
                  className="w-full h-auto object-contain max-h-[800px] rounded-[24px]" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating "Player" button positioned on the side (bottom-right corner) of the poster - only if video exists */}
                {a.video && (
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
                    <button
                      type="button"
                      onClick={() => handlePlayVideo(a)}
                      className="flex items-center gap-3 px-5 py-3.5 bg-white/95 backdrop-blur-md hover:bg-white text-[#1E8C45] rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-[#1E8C45]/20 group/btn cursor-pointer"
                      title={currentLangId === 'fr' ? 'Cliquez pour visionner la vidéo' : 'Click to watch the video'}
                    >
                      <span className="w-10 h-10 rounded-full bg-[#1E8C45] text-white flex items-center justify-center shadow-md group-hover/btn:bg-[#156e34] transition-colors relative shrink-0">
                        <span className="absolute inset-0 rounded-full bg-[#1E8C45]/30 animate-pulse -z-10" />
                        <Play size={16} className="fill-white stroke-none translate-x-[1px]" />
                      </span>
                      <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider pr-1">
                        {currentLangId === 'fr' ? 'LECTEUR VIDÉO' : 'VIDEO PLAYER'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SUB-CONTAINER FOR DOWNSTREAM SECTIONS */}
      <div className="max-w-[1240px] mx-auto w-full px-4 lg:px-10">

      {/* 2. THREE REASONS SECTION (Matching Screenshot) */}
      <div className="mb-16 text-center">
        <span className="text-[11px] font-black uppercase text-[#1E8C45] tracking-widest bg-[#1E8C45]/5 px-4 py-1.5 rounded-full inline-block mb-3 leading-none">Djapero Core Values</span>
        <h2 className="text-2xl sm:text-3.5xl font-black text-slate-900 tracking-tight leading-none">
          {getCopy('why_title')}
        </h2>
        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-3 mb-10 max-w-lg mx-auto leading-relaxed">
          {getCopy('why_subtitle')}
        </p>

        {/* The 3 Beautiful Border Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8 text-left transition-all duration-300 hover:border-[#1E8C45]/20 hover:shadow-2xl hover:shadow-[#1E8C45]/5 group relative overflow-hidden flex flex-col min-h-[290px]">
            {/* Top-right subtle graphic anchor path (simulates the dark thick corner style in screenshot) */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#1E8C45] rounded-tr-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="w-12 h-12 rounded-2xl bg-[#1E8C45]/10 flex items-center justify-center text-[#1E8C45] mb-6 shrink-0 font-extrabold">
              <Store size={22} className="stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-[#1E8C45] transition-colors">{getCopy('card1_title')}</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-6 flex-grow">{getCopy('card1_desc')}</p>
            
            <button 
              type="button"
              className="mt-auto inline-flex items-center gap-2 text-xs font-black text-slate-800 group-hover:text-[#1E8C45] transition-colors w-fit group"
            >
              <span>{currentLangId === 'fr' ? 'Savoir Plus' : 'Read More'}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8 text-left transition-all duration-300 hover:border-[#1E8C45]/20 hover:shadow-2xl hover:shadow-[#1E8C45]/5 group relative overflow-hidden flex flex-col min-h-[290px]">
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#1E8C45] rounded-tr-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="w-12 h-12 rounded-2xl bg-[#1E8C45]/10 flex items-center justify-center text-[#1E8C45] mb-6 shrink-0">
              <Sparkles size={22} className="stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-[#1E8C45] transition-colors">{getCopy('card2_title')}</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-6 flex-grow">{getCopy('card2_desc')}</p>
            
            <button 
              type="button"
              className="mt-auto inline-flex items-center gap-2 text-xs font-black text-slate-800 group-hover:text-[#1E8C45] transition-colors w-fit group"
            >
              <span>{currentLangId === 'fr' ? 'Savoir Plus' : 'Read More'}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8 text-left transition-all duration-300 hover:border-[#1E8C45]/20 hover:shadow-2xl hover:shadow-[#1E8C45]/5 group relative overflow-hidden flex flex-col min-h-[290px]">
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#1E8C45] rounded-tr-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="w-12 h-12 rounded-2xl bg-[#1E8C45]/10 flex items-center justify-center text-[#1E8C45] mb-6 shrink-0">
              <DollarSign size={22} className="stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-[#1E8C45] transition-colors">{getCopy('card3_title')}</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-6 flex-grow">{getCopy('card3_desc')}</p>
            
            <button 
              type="button"
              className="mt-auto inline-flex items-center gap-2 text-xs font-black text-slate-800 group-hover:text-[#1E8C45] transition-colors w-fit group"
            >
              <span>{currentLangId === 'fr' ? 'Savoir Plus' : 'Read More'}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. SIMULATOR WIDGET (Fascon, Realistic & Dynamic Local Activity Tracker) */}
      <div className="bg-[#F8F9F9] border border-slate-100 rounded-[40px] p-6 sm:p-10 mb-16 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#1E8C45]/5 rounded-bl-[100px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6">
            <div className="flex items-center gap-1.5 text-xs text-[#1E8C45] font-black uppercase mb-3">
              <TrendingUp size={14} className="animate-pulse" />
              <span>{currentLangId === 'fr' ? 'Djapero Impact Engine v2' : 'Djapero Impact Engine v2'}</span>
            </div>
            
            <h3 className="text-xl sm:text-2.5xl font-black text-slate-800 tracking-tight leading-none mb-4">
              {getCopy('calc_title')}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold mb-6">
              {getCopy('calc_desc')}
            </p>

            <div className="space-y-5">
              
              {/* Product Selector */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Choisir un produit frais</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(productImpacts).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSimulatedProduct(key)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                        simulatedProduct === key 
                        ? 'bg-[#1E8C45] text-white border-transparent shadow-md shadow-[#1E8C45]/15' 
                        : 'bg-white text-slate-600 border-slate-200/60 hover:border-[#1E8C45]/20'
                      }`}
                    >
                      {currentLangId === 'fr' ? info.nameFr : info.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider weight */}
              <div>
                <div className="flex items-end justify-between text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  <span>Quantité d'approvisionnement</span>
                  <span className="text-[#1E8C45] font-black text-sm">{simulatedWeight} kg</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="150" 
                  value={simulatedWeight} 
                  onChange={(e) => setSimulatedWeight(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E8C45]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-1">
                  <span>2 kg</span>
                  <span>50 kg</span>
                  <span>100 kg</span>
                  <span>150 kg</span>
                </div>
              </div>

            </div>
          </div>

          {/* Impact Results Panel */}
          <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#1E8C45] uppercase bg-[#1E8C45]/5 px-2.5 py-1 rounded-full">{currentLangId === 'fr' ? 'Calcul en cours...' : 'Live Calculation'}</span>
              <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase">{currentLangId === 'fr' ? 'Produit simulé' : 'Simulated product'}</p>
              <h4 className="text-base sm:text-lg font-black text-slate-800 mt-1 flex items-center gap-2">
                <ShoppingBasket size={18} className="text-[#1E8C45]" />
                {currentLangId === 'fr' ? selectedProdInfo.nameFr : selectedProdInfo.nameEn}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-6 my-6">
              
              <div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-wider">{currentLangId === 'fr' ? "Valeur panier estimé" : "Estimated Value"}</p>
                <div className="text-xl sm:text-2xl font-black text-[#1E8C45] mt-1">
                  {totalPrice.toLocaleString()} <span className="text-xs font-bold text-slate-500">FCFA</span>
                </div>
              </div>

              <div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-wider">{currentLangId === 'fr' ? "Versé aux Producteurs (85%)" : "Paid to Farm Collective"}</p>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                  <span className="text-emerald-600">+{directFarmerRevenue.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">FCFA</span>
                </div>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">Zéro intermédiaire</span>
              </div>

            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4 flex gap-3 items-start">
              <span className="w-8 h-8 rounded-full bg-yellow-400 shrink-0 text-slate-900 flex items-center justify-center font-black text-xs">☀️</span>
              <div>
                <p className="text-xs font-black text-slate-800">{currentLangId === 'fr' ? "Impact de votre panier :" : "Social impact generated :"}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-semibold">
                  {currentLangId === 'fr' 
                    ? `Soutien immédiat à hauteur de ${socialHoursGenerated} jours de travail rémunéré équitablement pour une exploitation locale.` 
                    : `Securely finances ${socialHoursGenerated} complete work-days of fair trade agricultural labor.`}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>

    {/* GRAPHIST.COM-STYLE FULL-WIDTH BOTTOM PROMOTIONAL BANNER */}
    {showPromoBanner && (
      <div className="sticky bottom-[-4px] md:bottom-[-4px] -mx-8 sm:-mx-10 md:-mx-16 mt-16 -mb-4 md:-mb-10 bg-gradient-to-r from-[#FF551F] to-[#FF7527] text-white flex flex-col md:flex-row items-center justify-between shadow-[0_-15px_40px_rgba(255,85,31,0.22)] min-h-[220px] md:min-h-[240px] z-30 overflow-visible">
        
        {/* Subtle Orange grid pattern/accent lines in the background to simulate background graphics */}
        <div className="absolute inset-0 bg-black/5 opacity-10 pointer-events-none select-none"></div>

        <div className="w-full max-w-[1100px] mx-auto px-6 md:px-12 py-12 md:py-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-visible">
          
          {/* Close Button on upper right corner */}
          <button
            type="button"
            onClick={() => setShowPromoBanner(false)}
            className="absolute top-4 right-4 md:right-8 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center font-bold text-xs transition-all focus:outline-none cursor-pointer z-35"
            title={currentLangId === 'fr' ? "Fermer" : "Close"}
          >
            ✕
          </button>

          {/* Left Column with title/subtitle & button exactly like screenshot but respecting language */}
          <div className="w-[62%] sm:w-[65%] md:w-7/12 text-left z-10 flex flex-col justify-center items-start">
            <h3 className="text-lg sm:text-2.5xl md:text-3.5xl font-black tracking-tight leading-tight mb-2 font-sans text-white">
              {currentLangId === 'fr' 
                ? "Vous avez besoin d'un motion designer ?" 
                : "Need a motion designer?"}
            </h3>
            <p className="text-white/95 font-medium text-[11px] sm:text-xs md:text-sm max-w-lg leading-relaxed mb-6 font-sans">
              {currentLangId === 'fr' 
                ? "Trouvez rapidement un graphiste freelance" 
                : "Find a freelance graphic designer quickly"}
            </p>
            
            {/* White pill button on the bottom left corner under text content */}
            <button 
              type="button"
              onClick={() => {
                alert(currentLangId === 'fr' 
                  ? "Service Créateur Djapero : Veuillez contacter l'administration de Djapero pour soumettre un brief de visuel." 
                  : "Djapero Creator Service: Please contact Djapero support to submit your media template design brief.");
              }}
              className="bg-white hover:bg-orange-50 text-[#FF551F] font-black text-[10px] sm:text-xs uppercase tracking-wider px-6 sm:px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-95 text-center w-fit cursor-pointer border border-transparent font-sans whitespace-nowrap"
            >
              {currentLangId === 'fr' ? "Déposer une annonce (gratuit)" : "Post an ad (free)"}
            </button>
          </div>

          {/* Image du professionnel en superposition - positionnée selon le dessin jaune de l'utilisateur */}
          <div className="absolute -top-16 sm:-top-28 md:-top-36 bottom-0 right-[8%] sm:right-[15%] md:right-[18%] h-[calc(100%+64px)] sm:h-[calc(100%+112px)] md:h-[calc(100%+144px)] flex items-end z-20 pointer-events-none overflow-visible">
            <img 
              src="https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L2pvYjcwOC0wMDVhLXQtbHEtcm0ucG5n.png" 
              alt="Expert Créatif" 
              referrerPolicy="no-referrer"
              className="h-[125%] sm:h-[140%] md:h-[155%] w-auto object-contain object-bottom filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)] select-none origin-bottom mb-[-1px]"
              onError={(e) => {
                // Fallback silencieux si l'image principale échoue
                e.currentTarget.src = "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3Y5OTEtbmFubmktMDItcF8xLnBuZw.png";
              }}
            />
          </div>

        </div>

      </div>
    )}

    {/* 5. VIDEO LIGHTBOX POPUP */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] overflow-hidden w-full max-w-2xl shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setIsVideoModalOpen(false);
                setActiveVideoUrl(null);
              }}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors z-10"
            >
              ✕
            </button>
            <div className="p-1 bg-[#1E8C45]"></div>
            <div className="p-6 text-left">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Play size={18} className="text-[#1E8C45] fill-[#1E8C45]" />
                {activeAfficheTitle || "Djapero Commercial & Campaign Video"}
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-4 uppercase">
                {currentLangId === 'fr' ? "Visionneuse de Campagne" : "Campaign Media Viewer"}
              </p>
              
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950">
                {activeVideoUrl ? (
                  getYouTubeEmbedUrl(activeVideoUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(activeVideoUrl)!}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title="YouTube video player"
                    ></iframe>
                  ) : (
                    <video 
                      key={activeVideoUrl}
                      src={activeVideoUrl} 
                      poster="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"
                      controls 
                      autoPlay 
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-sans text-sm">
                    {currentLangId === 'fr' ? "Chargement de la vidéo..." : "Loading video..."}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">
                  {currentLangId === 'fr' ? "Vidéo : Présentation de l'affiche" : "Video: Poster presentation"}
                </span>
                <span className="text-[#1E8C45] font-black">Djapero Media Co.</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
