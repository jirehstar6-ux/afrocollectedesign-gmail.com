import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, Search, Truck, LayoutDashboard, ShoppingBasket, 
  Store, Briefcase, Users, Menu, ShieldCheck, Sprout, Leaf, 
  Bird, Palette, Video, Megaphone, HeartHandshake, BadgeCheck, 
  User, Heart, X, Plus, ChevronLeft, ChevronRight, MapPin, 
  Map, Navigation, Bell, Settings2, ChevronDown, Star, 
  LogOut, Languages, Mail, Sparkles, Globe, Home, Book, 
  Monitor, Bookmark, Brain, ArrowRight 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getVideo } from '../lib/videoStorage';
import { LANGUAGES, getTranslation } from '../lib/translations';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import TeamSection from './TeamSection';
import { Portfolio } from './Portfolio';
import { downloadAllFromFirestore, subscribeToProducts, subscribeToMarkets, subscribeToNotifications, subscribeToSettings, subscribeToTeam, subscribeToAffiches } from '../lib/firestoreSync';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function MarketMapContent({ query, onSelectMarket }: { query: string, onSelectMarket: (place: google.maps.places.Place) => void }) {
  const [currentLangId] = useState(() => localStorage.getItem('djapero_lang') || 'fr');
  const t = (key: string) => getTranslation(currentLangId, key);
  
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);

  useEffect(() => {
    if (!placesLib || !map) return;

    // Search for markets in Africa based on query or default
    const textQuery = query ? `local markets in ${query}` : 'major traditional markets in West Africa';
    
    placesLib.Place.searchByText({
      textQuery,
      fields: ['displayName', 'location', 'formattedAddress', 'id', 'rating', 'photos', 'types'],
      maxResultCount: 15,
    }).then(({ places }) => {
      setPlaces(places || []);
      if (places && places.length > 0 && query) {
        const bounds = new google.maps.LatLngBounds();
        places.forEach(p => p.location && bounds.extend(p.location));
        map.fitBounds(bounds);
      }
    });
  }, [placesLib, map, query]);

  return (
    <>
      {places.map(place => (
        <AdvancedMarker 
          key={place.id} 
          position={place.location} 
          onClick={() => setSelectedPlace(place)}
        >
          <Pin background={'#1E8C45'} glyphColor={'#fff'} borderColor={'#fff'} />
        </AdvancedMarker>
      ))}

      {selectedPlace && (
        <InfoWindow 
          position={selectedPlace.location} 
          onCloseClick={() => setSelectedPlace(null)}
        >
          <div className="p-3 max-w-[220px]">
            <h4 className="font-bold text-slate-800 text-[15px] mb-1">{selectedPlace.displayName}</h4>
            <p className="text-[11px] text-slate-500 mb-2 leading-tight">{selectedPlace.formattedAddress}</p>
            {selectedPlace.rating && (
              <div className="flex items-center gap-1 mb-3">
                <span className="text-[#1E8C45] text-xs font-bold">★ {selectedPlace.rating}</span>
              </div>
            )}
            <button 
              onClick={() => {
                onSelectMarket(selectedPlace);
                setSelectedPlace(null);
              }}
              className="w-full py-2 bg-[#1E8C45] text-white text-xs font-bold rounded-xl hover:bg-[#007542] transition-colors shadow-lg shadow-[#1E8C45]/20 flex items-center justify-center gap-2"
            >
              <Plus size={14} /> {t('choose_this_market')}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function Dashboard({ onNavigate, userEmail, isAdmin, onLogout }: { onNavigate: (page: string) => void, userEmail: string, isAdmin?: boolean, onLogout?: () => void }) {
  const THEMES = [
    { id: 'green', name: 'Nature', primary: '#1E8C45', dark: '#007542', light: '#3AA346' },
    { id: 'orange', name: 'Épice', primary: '#F97316', dark: '#C2410C', light: '#FB923C' },
    { id: 'rose', name: 'Passion', primary: '#E11D48', dark: '#BE123C', light: '#F43F5E' },
    { id: 'purple', name: 'Royal', primary: '#8B5CF6', dark: '#6D28D9', light: '#A78BFA' },
    { id: 'blue', name: 'Océan', primary: '#3B82F6', dark: '#1D4ED8', light: '#60A5FA' },
  ];

  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('djapero_lang');
    return LANGUAGES.find(l => l.id === saved) || LANGUAGES[0];
  });

  const t = (key: string) => getTranslation(currentLang.id, key);

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState<'sidebar-top' | 'sidebar-bottom' | 'header' | 'market-header' | 'mobile' | 'store' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);

  const [isExpanded, setIsExpanded] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [basket, setBasket] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [adminPhone, setAdminPhone] = useState(localStorage.getItem('djapero_admin_phone') || '22501000000');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [lastAddedProduct, setLastAddedProduct] = useState<any | null>(null);
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [selectedPriceType, setSelectedPriceType] = useState<'detail' | 'gros'>('detail');
  const [welcomeContent, setWelcomeContent] = useState<any>(null);
  const [basketContent, setBasketContent] = useState<any>({});
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<any | null>(null);
  const [campaignVideo, setCampaignVideo] = useState('https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-and-fruits-in-a-market-item-20320-large.mp4');
  const [videoError, setVideoError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [showPromo, setShowPromo] = useState(false);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const [zoomedNotifImage, setZoomedNotifImage] = useState<string | null>(null);
  const [showAutoGreeting, setShowAutoGreeting] = useState(false);
  const [mobileRotation, setMobileRotation] = useState(0);

  useEffect(() => {
    // Show automatic greeting after 2.5 seconds
    const timer = setTimeout(() => {
      const hasSeen = sessionStorage.getItem('djapero_greeting_seen');
      if (!hasSeen) {
        setShowAutoGreeting(true);
        sessionStorage.setItem('djapero_greeting_seen', 'true');
        // Auto-hide after some time
        setTimeout(() => setShowAutoGreeting(false), 12000);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeNotifications.length > 1) {
        setCurrentNotifIndex((prev) => (prev + 1) % activeNotifications.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeNotifications.length]);

  useEffect(() => {
    if (activeNotifications.length > 0) {
      setActiveNotification(activeNotifications[currentNotifIndex]);
    } else {
      setActiveNotification(null);
    }
  }, [activeNotifications, currentNotifIndex]);

  const loadVideos = async () => {
    // Load Campaign Video
    const savedCampaign = await getVideo('djapero_campaign_video');
    if (savedCampaign) {
      if (savedCampaign.startsWith('data:video')) {
        try {
          const response = await fetch(savedCampaign);
          const blob = await response.blob();
          setCampaignVideo(URL.createObjectURL(blob));
        } catch (e) {
          setCampaignVideo(savedCampaign);
        }
      } else {
        setCampaignVideo(savedCampaign);
      }
    }

    // Handle Welcome Video if it's in IDB
    const welcomeData = localStorage.getItem('djapero_welcome_content');
    if (welcomeData) {
      const parsed = JSON.parse(welcomeData);
      if (parsed.video === 'indexeddb:djapero_welcome_video') {
        const videoData = await getVideo('djapero_welcome_video');
        if (videoData) {
          try {
            const response = await fetch(videoData);
            const blob = await response.blob();
            parsed.video = URL.createObjectURL(blob);
          } catch (e) {
            parsed.video = videoData;
          }
        }
      }
      setWelcomeContent(parsed);
    }
  };

  useEffect(() => {
    loadVideos();
    window.addEventListener('storage', loadVideos);
    window.addEventListener('welcome_content_updated', loadVideos);
    return () => {
      window.removeEventListener('storage', loadVideos);
      window.removeEventListener('welcome_content_updated', loadVideos);
    };
  }, []);

  const [showMarketConfirm, setShowMarketConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');

  const getTranslatedCategory = (cat: string) => {
    switch (cat) {
      case 'Produits Frais': return t('cat_fresh');
      case 'Épices': return t('cat_spices');
      case 'Artisanat': return t('cat_crafts');
      case 'Vêtements': return t('cat_clothes');
      case 'Street Food': return t('cat_street_food');
      case 'Fruits & Légumes': return t('cat_fresh');
      case 'Volailles & Élevage': return t('poultry_farming');
      case 'Épicerie & Biscuits': return t('grocery_biscuits');
      case 'Tous': return t('all_categories');
      default: return cat;
    }
  };

  const categories = [
    t('all_categories'), 
    t('cat_fresh'), 
    t('cat_spices'), 
    t('cat_crafts'), 
    t('cat_clothes'), 
    t('cat_street_food')
  ];

  const getWhatsAppNumber = (phone: string) => {
    return phone.replace(/\s+/g, '').replace('+', '').replace(/^00/, '');
  };

  const handleOrderWhatsApp = (product: any, priceType: 'detail' | 'gros' = 'gros') => {
    const price = priceType === 'detail' ? product.priceDetail : product.priceGros;
    const message = t('whatsapp_order_single')
      .replace(/{productName}/g, product.name)
      .replace(/{price}/g, price)
      .replace(/{marketName}/g, selectedMarket?.name || (currentLang.id === 'fr' ? 'Non spécifié' : 'Not specified'));
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = getWhatsAppNumber(adminPhone); 
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const addToBasket = (product: any) => {
    setLastAddedProduct(product);
    setShowAddFeedback(true);
    setTimeout(() => setShowAddFeedback(false), 3000);

    setBasket(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBasket = (id: string) => {
    setBasket(prev => prev.filter(item => item.id !== id));
  };

  const handleOrderBasketWhatsApp = () => {
    if (basket.length === 0) return;
    const itemsText = basket.map(item => `- ${item.name} (x${item.quantity}): ${parseInt(item.priceGros) * item.quantity} FCFA`).join('\n');
    const total = basket.reduce((sum, item) => sum + (parseInt(item.priceGros) * item.quantity), 0);
    const message = t('whatsapp_order_basket')
      .replace(/{itemsText}/g, itemsText)
      .replace(/{total}/g, total.toString())
      .replace(/{marketName}/g, selectedMarket?.name || (currentLang.id === 'fr' ? 'Non spécifié' : 'Not specified'));
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = getWhatsAppNumber(adminPhone);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  useEffect(() => {
    setIsSyncing(true);
    
    // Static initial load check
    const loadFromLocal = () => {
      const prodData = localStorage.getItem('djapero_products');
      if (prodData) {
        const parsed = JSON.parse(prodData);
        if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
      }
      const marketData = localStorage.getItem('djapero_markets');
      if (marketData) {
        const parsed = JSON.parse(marketData);
        if (Array.isArray(parsed) && parsed.length > 0) setMarkets(parsed);
      }
      const welcomeDataStr = localStorage.getItem('djapero_welcome_content');
      if (welcomeDataStr) {
        const parsed = JSON.parse(welcomeDataStr);
        if (parsed.video !== 'indexeddb:djapero_welcome_video') {
          setWelcomeContent(parsed);
        }
      }

      const basketContentData = localStorage.getItem('djapero_basket_content');
      if (basketContentData) setBasketContent(JSON.parse(basketContentData));
      
      const phone = localStorage.getItem('djapero_admin_phone');
      if (phone) setAdminPhone(phone);
      
      const notifData = localStorage.getItem('djapero_notifications');
      if (notifData) {
        const parsed = JSON.parse(notifData);
        if (Array.isArray(parsed)) {
          const actives = parsed.filter((n: any) => n.isActive);
          setActiveNotifications(actives);
          if (actives.length > 0) {
            const firstActive = actives[0];
            const lastSeenId = localStorage.getItem('djapero_last_notif_seen');
            if (lastSeenId !== firstActive.id) {
              setShowPromo(true);
            }
          } else {
            setShowPromo(false);
          }
        }
      }
    };
    loadFromLocal();

    // Subscribe to real-time updates
    const unsubscribeProducts = subscribeToProducts((newProducts) => {
      setProducts(newProducts);
      setIsSyncing(false);
    });

    const unsubscribeMarkets = subscribeToMarkets((newMarkets) => {
      setMarkets(newMarkets);
      setIsSyncing(false);
    });

    const unsubscribeNotifications = subscribeToNotifications((notifs) => {
      const actives = notifs.filter((n: any) => n.isActive);
      setActiveNotifications(actives);
      if (actives.length > 0) {
        const firstActive = actives[0];
        const lastSeenId = localStorage.getItem('djapero_last_notif_seen');
        if (lastSeenId !== firstActive.id) {
          setShowPromo(true);
        }
      } else {
        setShowPromo(false);
      }
    });

    const unsubscribeTeam = subscribeToTeam(() => {
      // Data is saved to localStorage by subscriber, standard storage event handles local state if needed
    });

    const unsubscribeAffiches = subscribeToAffiches(() => {
      // Same as team
    });
    
    const unsubscribeSettings = subscribeToSettings(() => {
       // Callback triggered when settings like video updated
       loadVideos();
       
       const phone = localStorage.getItem('djapero_admin_phone');
       if (phone) setAdminPhone(phone);
       
       const basketData = localStorage.getItem('djapero_basket_content');
       if (basketData) setBasketContent(JSON.parse(basketData));
    });

    // Run initial one-time sync for non-realtime settings (honors 60s throttle)
    downloadAllFromFirestore(false).finally(() => setIsSyncing(false));

    // Listen for storage changes from other components (like Admin)
    const handleStorageChange = () => loadFromLocal();
    const handleSyncComplete = () => {
      setIsSyncing(false);
      setIsOffline(false);
    };
    const handleSyncError = () => {
      setIsSyncing(false);
      setIsOffline(true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('djapero_sync_complete', handleSyncComplete);
    window.addEventListener('djapero_sync_error', handleSyncError);
    
    return () => {
      unsubscribeProducts();
      unsubscribeMarkets();
      unsubscribeNotifications();
      unsubscribeTeam();
      unsubscribeAffiches();
      unsubscribeSettings();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('djapero_sync_complete', handleSyncComplete);
      window.removeEventListener('djapero_sync_error', handleSyncError);
    };
  }, []);

  useEffect(() => {
    // We rely on real-time listeners for data updates.
    // No need to force sync on every page change as it exhausts the Firestore quota.
  }, [activePage]);

  const filteredMarkets = (markets || []).filter(m => 
    (m.name || '').toLowerCase().includes(marketSearchQuery.toLowerCase()) || 
    (m.location || '').toLowerCase().includes(marketSearchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activePage) {
        case 'basket': return (
          <div className="w-full max-w-7xl mx-auto pb-24 px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8 mt-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('mon_panier')}</h2>
              {basket.length > 0 && (
                <button 
                   onClick={() => setBasket([])}
                   className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                >
                  <X size={14} /> {t('clear_basket')}
                </button>
              )}
            </div>
            
            {basket.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {basket.map((item) => (
                    <div key={item.id} className="bg-white rounded-[24px] p-4 flex items-center gap-4 border border-slate-100 shadow-sm relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { 
                             e.currentTarget.onerror = null;
                             e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-tight">{item.category}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-black text-[#1E8C45] text-sm">{item.priceGros?.toLocaleString()} FCFA</p>
                          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full">
                             <button onClick={() => {
                               setBasket(prev => prev.map(p => p.id === item.id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p));
                             }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-[#1E8C45] font-black">-</button>
                             <span className="text-xs font-black text-slate-700 w-4 text-center">{item.quantity}</span>
                             <button onClick={() => {
                               setBasket(prev => prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p));
                             }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-[#1E8C45] font-black">+</button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromBasket(item.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/40 border border-white sticky top-10">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">{t('order_summary')}</h4>
                    <div className="space-y-4 mb-8">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-400">{t('subtotal')}</span>
                          <span className="font-bold text-slate-700">{basket.reduce((sum, item) => sum + (parseInt(item.priceGros) * item.quantity), 0).toLocaleString()} FCFA</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-400">{t('locality')}</span>
                          <span className="font-bold text-[#1E8C45]">{selectedMarket?.name || "Lomé"}</span>
                       </div>
                       <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                          <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{t('total')}</span>
                          <span className="text-2xl font-black text-[#1E8C45]">
                             {basket.reduce((sum, item) => sum + (parseInt(item.priceGros) * item.quantity), 0).toLocaleString()} <span className="text-[10px]">FCFA</span>
                          </span>
                       </div>
                    </div>
                    
                    <button 
                      onClick={handleOrderBasketWhatsApp}
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98] mb-4"
                    >
                       {t('order_whatsapp')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full md:bg-[#F8F9FA] overflow-y-auto">
                {/* PC/Desktop Layout */}
                <div className="hidden md:flex min-h-[calc(100vh-120px)] flex-col items-center justify-center p-6 lg:p-12 font-sans">
                  <div className="max-w-7xl w-full bg-[#E8F5E9] rounded-[48px] overflow-hidden shadow-[0_40px_80px_rgba(30,140,69,0.08)] flex flex-col">
                    {/* Top Hero Section */}
                    <div className="flex flex-1 min-h-[500px]">
                      {/* Left: Content */}
                      <div className="w-1/2 p-20 flex flex-col justify-center space-y-10 relative">
                        <div className="absolute top-12 left-12 w-16 h-16 bg-[#1A1F2B] rounded-2xl flex items-center justify-center text-white shadow-xl">
                          <Brain size={32} strokeWidth={1.5} />
                        </div>
                        
                        <div className="space-y-6">
                           <span className="text-[#1E8C45] font-black uppercase tracking-[0.3em] text-xs">{basketContent?.plateText || "Fresh & Organic"}</span>
                           <h3 className="text-7xl font-black text-slate-800 leading-[1] tracking-tighter">
                             {currentLang.id === 'fr' 
                                ? (basketContent?.titleFr || "Votre Panier est Vide")
                                : (basketContent?.titleEn || "Your Cart is Empty")}
                           </h3>
                           <p className="text-slate-500 text-lg font-medium max-w-sm leading-relaxed">
                             {currentLang.id === 'fr' 
                               ? (basketContent?.descFr || "Découvrez notre sélection de produits frais et authentiques du terroir.")
                               : (basketContent?.descEn || "Discover our selection of fresh and authentic local products.")}
                           </p>
                        </div>

                        <button 
                          onClick={() => setActivePage('store')} 
                          className="w-fit bg-[#FF9800] hover:bg-slate-900 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20"
                        >
                          {t('visit_store')}
                        </button>
                      </div>

                      {/* Right: Visual */}
                      <div className="w-1/2 relative bg-[#A5D6A7]">
                        <img 
                          src={basketContent?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000"} 
                          alt="Vegetables" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#E8F5E9]/10" />
                      </div>
                    </div>

                    {/* Bottom Feature Bar */}
                    <div className="bg-[#FFF9C4] p-10 grid grid-cols-3 gap-12 border-t border-yellow-100/50">
                       <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden p-3 underline underline-offset-4 decoration-yellow-400">
                             <img src="https://cdni.iconscout.com/illustration/premium/thumb/basket-of-vegetables-5353597-4464539.png" alt="Icon" className="w-full h-full object-contain" />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-800 text-sm mb-2">Qualité Premium</h4>
                             <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[180px]">Produits sélectionnés avec soin pour votre santé.</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden p-3">
                             <img src="https://cdni.iconscout.com/illustration/premium/thumb/honey-jar-illustration-download-in-svg-png-gif-formats--bee-pot-sweet-organic-herbs-food-pack-illustrations-3694002.png" alt="Icon" className="w-full h-full object-contain" />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-800 text-sm mb-2">100% Naturel</h4>
                             <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[180px]">Directement des marchés locaux à votre table.</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden p-3">
                             <img src="https://cdni.iconscout.com/illustration/free/thumb/oil-bottle-1888923-1597592.png" alt="Icon" className="w-full h-full object-contain" />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-800 text-sm mb-2">Livraison Rapide</h4>
                             <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[180px]">Nous livrons partout avec le plus grand soin.</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Mobile View - Re-using the fixed inset only for mobile for a seamless overlay experience */}
                <div className="md:hidden fixed inset-0 z-50 flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
                  <div className="flex-[1.2] relative">
                    <img 
                      src={basketContent?.image || "https://images.unsplash.com/photo-1544333323-16785191de40?auto=format&fit=crop&q=80&w=2000"} 
                      alt="Market" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute top-12 left-8">
                       <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Djapero</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-t-[40px] -mt-12 relative z-10 px-10 pt-16 pb-12 flex flex-col items-center text-center">
                    <div className="flex gap-1.5 mb-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1E8C45]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                    </div>

                    <h3 className="text-[32px] font-black text-slate-900 leading-[1.1] tracking-tighter mb-4 text-center">
                      {currentLang.id === 'fr' 
                        ? (basketContent?.titleFr || "Votre panier est vide")
                        : (basketContent?.titleEn || "Your cart is empty")}
                    </h3>

                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mb-auto">
                      {currentLang.id === 'fr'
                        ? (basketContent?.descFr || "Parcourez notre marché pour découvrir les meilleurs produits du terroir.")
                        : (basketContent?.descEn || "Browse our market to discover the best local products.")}
                    </p>

                    <button 
                      onClick={() => setActivePage('store')} 
                      className="w-full bg-[#1E8C45] hover:bg-[#007542] text-white h-16 rounded-[24px] font-bold text-sm transition-all active:scale-95 shadow-lg shadow-[#1E8C45]/20"
                    >
                      VISITER LA BOUTIQUE
                    </button>
                    
                    {/* Add a close button for mobile basket */}
                    <button 
                      onClick={() => setActivePage('dashboard')}
                      className="mt-6 text-slate-300 text-[10px] font-black uppercase tracking-widest"
                    >
                      Retour à l'accueil
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

        case 'market': return (
          <div className="max-w-[980px] mx-auto px-4 lg:px-6">
            {/* Screenshot-Style Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Removed avatar */}
                <div>
                  <div 
                    onClick={() => setLangAnchor(langAnchor === 'market-header' ? null : 'market-header')}
                    className="flex items-center gap-1 text-slate-400 group cursor-pointer hover:text-[#1E8C45] transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('my_position')}</span>
                    <span className="text-sm">{currentLang.flag}</span>
                    <ChevronDown size={12} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#1E8C45]" />
                    <span className="font-bold text-slate-800 text-[15px]">
                      {selectedMarket ? selectedMarket.name : "Lomé, Togo"}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setActivePage('notifications')}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 relative hover:bg-slate-50 transition-colors"
              >
                <Bell size={18} />
                {activeNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isAdmin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="flex flex-col items-center justify-center -mb-1 md:hidden"
                  title="Admin"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm animate-pulse">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">Admin</span>
                </button>
              )}
            </div>

            {/* Modern Search & Filter */}
            <div className="flex gap-3 mb-8">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder={t('search_market_placeholder')} 
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm outline-none focus:border-[#1E8C45] transition-all text-sm font-medium"
                  value={tempSearch || ''}
                  onChange={(e) => setTempSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setMarketSearchQuery(tempSearch)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
              <button 
                onClick={() => setMarketSearchQuery(tempSearch)}
                className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-[#1E8C45] transition-colors"
              >
                <Settings2 size={20} />
              </button>
            </div>

            {/* Quick Country Explorer */}
            <div className="mb-8">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('explore_africa')}</h3>
               <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {['Togo', 'Benin', 'Cote d\'ivoire', 'Ghana', 'Nigeria', 'Sénégal', 'Cameroun'].map(country => (
                    <button 
                      key={country}
                      onClick={() => setMarketSearchQuery(country)}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${marketSearchQuery === country ? 'bg-[#1E8C45] text-white border-transparent shadow-lg shadow-[#1E8C45]/20' : 'bg-white text-slate-600 border-slate-100 hover:border-[#1E8C45]/30'}`}
                    >
                      {country}
                    </button>
                  ))}
               </div>
            </div>

            {/* Featured Markets Grid (Manually added) */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  {t('my_private_markets')} <span className="animate-bounce">🔥</span>
                </h3>
                <button
                  type="button"
                  onClick={() => window.open('https://www.google.com/maps/search/march%C3%A9s+traditionnels+afrique', '_blank')}
                  className="px-4 py-2 bg-[#1E8C45]/10 text-[#1E8C45] hover:bg-[#1E8C45]/20 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-sm shadow-[#1E8C45]/5"
                >
                  <MapPin size={13} className="shrink-0 animate-pulse text-[#1E8C45]" />
                  <span>{currentLang.id === 'fr' ? "Découvrir tous les marchés d'Afrique" : "Explore all African Markets"}</span>
                  <Globe size={16} className="ml-1.5 text-[#1E8C45]/70" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8 pb-8">
                {filteredMarkets.length > 0 ? (
                  filteredMarkets.map((market) => (
                    <motion.div 
                      key={market.id}
                      whileHover={{ y: -5 }}
                      className="w-full aspect-square rounded-[28px] sm:rounded-[36px] overflow-hidden bg-white shadow-xl shadow-slate-200/50 border border-slate-100/50 relative group"
                    >
                      <img 
                        src={market.image} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        alt={market.name}
                        onError={(e) => { 
                           e.currentTarget.onerror = null;
                           e.currentTarget.src = 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-4 sm:p-7 flex flex-col justify-end">
                       
                        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 bg-white/95 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1 shadow-lg transform scale-85 sm:scale-100 origin-top-left">
                            <span className="text-[10px] sm:text-sm font-black text-[#1E8C45]">{market.rating}</span>
                            <Star size={10} className="fill-[#1E8C45] text-[#1E8C45]" />
                        </div>
                          
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/search/${encodeURIComponent(market.name + ' ' + market.location)}`, '_blank');
                          }}
                          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-9 h-9 sm:w-12 sm:h-12 bg-white/95 hover:bg-white text-slate-700 hover:text-[#1E8C45] rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-90 z-10"
                        >
                          <MapPin size={16} className="text-[#1E8C45]" />
                        </button>
 
                        <div className="text-white">
                          <h4 className="font-black text-white text-[13px] sm:text-xl leading-tight line-clamp-1 mb-0.5">{market.name}</h4>
                          <div className="text-[9px] sm:text-[11px] text-white/70 font-bold uppercase tracking-wider truncate mb-4">
                             {market.location}
                          </div>
                      
                        <button 
                          onClick={() => {
                            setSelectedMarket(market);
                            setShowMarketConfirm(true);
                            setActivePage('store');
                          }}
                          className="w-full py-1.5 sm:py-3.5 bg-white text-[#1E8C45] rounded-2xl flex items-center justify-center hover:bg-[#007542] hover:text-white transition-all shadow-xl active:scale-[0.98]"
                        >
                          <span className="hidden sm:block text-[14px] font-black uppercase tracking-[0.1em]">{t('visit')}</span>
                          <ArrowRight size={11} strokeWidth={2.5} className="sm:hidden" />
                        </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="w-full py-16 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Store className="text-slate-300" size={32} />
                    </div>
                    <h4 className="font-bold text-slate-800">Aucun marché privé</h4>
                    <p className="text-sm text-slate-400 mt-1">Gérez vos localités de livraison dans le portail admin.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Google Maps Discovery Section */}
            <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    Radar de Marchés d'Afrique <span className="text-[#3AA8FF]">🌍</span>
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Google Live
                  </span>
               </div>
               
               <div className="w-full h-[380px] rounded-[32px] overflow-hidden shadow-2xl border border-white relative bg-slate-200">
                  {!hasValidKey ? (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                       <Map size={32} className="text-[#3AA8FF] mb-3" />
                       <h3 className="font-black text-slate-800 tracking-tight text-sm">{t('exploration_google_maps')}</h3>
                       <p className="text-[10px] text-slate-500 mt-1.5 max-w-xs">{t('connect_google_key')}</p>
                       <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-[#1E8C45] bg-[#1E8C45]/10 px-3 py-1.5 rounded-full cursor-help">
                          <Settings2 size={11} /> {t('config_secrets')}
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full">
                       <APIProvider apiKey={API_KEY} version="weekly">
                          <GoogleMap
                            defaultCenter={{ lat: 6.1319, lng: 1.2228 }}
                            defaultZoom={5}
                            mapId="MARKET_EXPLORER"
                            className="w-full h-full"
                            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                            gestureHandling={'greedy'}
                          >
                            <MarketMapContent 
                              query={marketSearchQuery} 
                              onSelectMarket={(place) => {
                                setSelectedMarket({
                                  id: place.id,
                                  name: place.displayName,
                                  location: place.formattedAddress,
                                  tags: 'Importé de Google'
                                });
                                setShowMarketConfirm(true);
                                setActivePage('store');
                              }}
                            />
                          </GoogleMap>
                       </APIProvider>
                       
                       <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-xl max-w-[220px]">
                          <div className="flex items-center gap-2 mb-2">
                             <MapPin size={14} className="text-[#3AA8FF]" />
                             <span className="font-bold text-slate-800 text-xs">{t('africa_radar')}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{t('browse_map_desc')}</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Selection Confirmation */}
            <AnimatePresence>
              {showMarketConfirm && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 border border-white/20 whitespace-nowrap"
                >
                  <BadgeCheck size={20} className="text-[#3AA346]" />
                  <span>Bienvenue à {selectedMarket?.name} !</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
        case 'store': return (
          <div className="max-w-[1150px] mx-auto w-full pb-8 -mt-2 px-4 lg:px-6">
            
            {/* Store Top Nav (Replicating mockup header) */}
            <div className="flex items-center justify-between py-3 mb-4 mt-1">
              <div className="flex items-center gap-3">
                 <div className="relative">
                   <img src="/logo.png" alt="Djapero Logo" className="w-12 h-12 object-cover rounded-full shadow-sm" />
                   {isSyncing && (
                     <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#1E8C45] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                     </div>
                    )}
                    {isOffline && (
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white" title="Mode Hors-ligne">
                         <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                 </div>
                 <span className="font-bold text-lg text-slate-800 tracking-normal hidden sm:block pr-1">Djapero</span>
                 {isSyncing && <span className="text-[9px] font-black uppercase text-[#1E8C45] animate-pulse tracking-widest hidden md:block">Synchronisation...</span>}
                 {isOffline && <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest hidden md:block">Mode Hors-ligne</span>}
              </div>
              
              <div className="relative flex-1 max-w-xl mx-4">
                <input type="text" placeholder="Rechercher des produits frais..." className="w-full pl-6 pr-12 py-2.5 rounded-full border border-slate-200 outline-none focus:border-[#3AA346] shadow-sm text-sm" />
                <Search className="absolute right-5 top-3 text-slate-400" size={16} />
              </div>

              <div className="flex items-center gap-1 sm:gap-4">
                <button 
                  onClick={() => setLangAnchor(langAnchor === 'store' ? null : 'store')}
                  className="text-slate-500 hover:text-[#007542] flex transition-colors items-center gap-1 pr-2"
                >
                  <span className="text-xl">{currentLang.flag}</span>
                </button>

                {isAdmin && (
                  <button 
                    onClick={() => onNavigate('admin')}
                    className="flex flex-col items-center justify-center md:hidden mr-2"
                    title="Admin"
                  >
                    <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                      <ShieldCheck size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">Admin</span>
                  </button>
                )}

                <button className="text-slate-500 hover:text-[#007542] hidden sm:flex transition-colors"><User size={20} strokeWidth={1.5} /></button>
                 <button 
                  onClick={() => setActivePage('notifications')}
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 relative hover:bg-slate-50 transition-colors"
                >
                  <Bell size={18} />
                  {activeNotifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                <button onClick={() => setActivePage('basket')} className="bg-[#007542] text-white p-3 rounded-full flex items-center justify-center shadow-lg hover:bg-[#1E8C45] transition-colors shadow-[#007542]/20 relative">
                    <ShoppingBasket size={18} />
                    {basket.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {basket.reduce((sum, i) => sum + i.quantity, 0)}
                      </span>
                    )}
                 </button>
              </div>
            </div>

            {/* In-Store Promotion Slider */}
            {activeNotifications.length > 0 && (
              <div className="mb-8 rounded-[32px] overflow-hidden bg-white/50 h-auto min-h-[140px] sm:min-h-[160px] relative border border-[#1E8C45]/10 shadow-sm group">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeNotifications[currentNotifIndex]?.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="relative p-6 px-8 flex items-center gap-6"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl shadow-[#1E8C45]/10 flex items-center justify-center text-[#1E8C45] shrink-0 border border-[#1E8C45]/20 overflow-hidden">
                      {activeNotifications[currentNotifIndex]?.image ? (
                        <img src={activeNotifications[currentNotifIndex]?.image} className="w-full h-full object-cover" />
                      ) : (
                        <Sparkles size={32} className="animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1E8C45] animate-pulse"></div>
                          <span className="text-[10px] font-black text-[#1E8C45] uppercase tracking-widest">{t('notifications')}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-tight mb-1">{activeNotifications[currentNotifIndex]?.title}</h3>
                        <p className="text-[12px] sm:text-[13px] text-slate-600 font-medium line-clamp-2 leading-relaxed mb-4">{activeNotifications[currentNotifIndex]?.message}</p>
                        
                        <button 
                          onClick={() => setShowPromo(true)}
                          className="px-6 py-2 bg-[#1E8C45] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#007542] transition-all shadow-md shadow-[#1E8C45]/10"
                        >
                          VOIR PLUS MAINTENANT
                        </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Slider dots for store banner */}
                {activeNotifications.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {activeNotifications.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentNotifIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentNotifIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Market Header Widget */}
            <div className="bg-gradient-to-r from-[#1E8C45]/10 to-[#3AA346]/5 rounded-[32px] p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between border border-[#1E8C45]/10 relative overflow-visible">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#1E8C45] shrink-0">
                  <Store size={20} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-[#1E8C45] tracking-wider leading-none">Marché Actuel</span>
                    <span className="bg-[#1E8C45]/10 text-[#1E8C45] text-[8px] font-bold px-1.5 py-0.5 rounded-full">Actif</span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight mt-1 truncate">
                    {selectedMarket ? selectedMarket.name : "Grand Marché d'Assigamé"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    {selectedMarket ? selectedMarket.location : "Lomé, Togo"}
                  </p>
                </div>
              </div>

              {/* Action dropdown button */}
              <div className="relative mt-3 md:mt-0 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                  className="w-full md:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs font-black border border-slate-100 shadow-sm transition-all whitespace-nowrap"
                >
                  <MapPin size={13} className="text-[#1E8C45]" />
                  <span>Visiter un autre marché</span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform ${isMarketDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMarketDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-full md:w-80 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 p-3 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 pt-2 pb-3 border-b border-slate-100">Localités disponibles</p>
                    <div className="space-y-1 mt-2 font-sans text-left">
                      {markets.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMarket(m);
                            setIsMarketDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                            (selectedMarket?.id === m.id || (!selectedMarket && m.id === 'tg-1'))
                              ? 'bg-[#1E8C45]/5 text-[#1E8C45] font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <img
                            src={m.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=100' }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate">{m.name}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.location}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="mt-6">
              <div className="flex items-end justify-between mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('fresh_products')}</h2>
                   <p className="text-[13px] text-slate-500">{t('discover_nature')}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                {products.map((prod) => (
                  <div key={prod.id} onClick={() => setSelectedProduct(prod)} className="group cursor-pointer flex flex-col h-full bg-transparent">
                    <div className="relative w-full aspect-[4/5] md:aspect-square rounded-[32px] sm:rounded-[40px] overflow-hidden mb-4 bg-slate-100 shadow-xl shadow-slate-200/50 group-hover:shadow-2xl group-hover:shadow-[#1E8C45]/10 transition-all duration-500 border border-white/50">
                       <img 
                         src={prod.image} 
                         alt={prod.name} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                         onError={(e) => { 
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                         }}
                         referrerPolicy="no-referrer"
                       />
                       <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black text-slate-800 shadow-sm border border-white/50">
                         {prod.category}
                       </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col px-1">
                       <h3 className="font-black text-[15px] sm:text-lg text-slate-800 mb-0.5 leading-tight group-hover:text-[#1E8C45] transition-colors line-clamp-1">{prod.name}</h3>
                       {prod.measure && (
                         <div className="flex items-center gap-1 mb-1.5 opacity-80">
                           <div className="w-1 h-1 bg-[#1E8C45] rounded-full"></div>
                           <span className="text-[9px] font-black text-[#1E8C45] uppercase tracking-widest">{prod.measure}</span>
                         </div>
                       )}
                       <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium mb-3 line-clamp-2 leading-relaxed opacity-80">{prod.description}</p>
                       
                       <div className="mt-auto pt-2 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                             <div className="flex flex-col gap-0.5">
                                <div className="flex items-baseline gap-2">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Détail:</span>
                                   <span className="text-sm font-bold text-slate-700">{prod.priceDetail} <span className="text-[9px] font-bold opacity-60">FCFA</span></span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                   <span className="text-[9px] font-black text-[#1E8C45] uppercase tracking-tighter">Gros:</span>
                                   <span className="text-lg sm:text-xl font-black text-[#1E8C45] leading-none">{prod.priceGros} <span className="text-[10px] font-black opacity-70">FCFA</span></span>
                                </div>
                             </div>
                             
                             <div className="flex gap-2 justify-end sm:justify-start">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOrderWhatsApp(prod); }} 
                                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-[#25D366] hover:text-white transition-all shadow-sm border border-slate-100"
                                >
                                   <MessageCircle size={18} />
                                </button>
                                
                                {basket.find(p => p.id === prod.id) ? (
                                   <div className="flex items-center bg-[#1E8C45]/10 rounded-full p-1 border border-[#1E8C45]/20" onClick={(e) => e.stopPropagation()}>
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        const pInBasket = basket.find(p => p.id === prod.id);
                                        if (pInBasket && pInBasket.quantity > 1) {
                                          setBasket(prev => prev.map(p => p.id === prod.id ? { ...p, quantity: p.quantity - 1 } : p));
                                        } else {
                                          removeFromBasket(prod.id);
                                        }
                                      }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#1E8C45] font-black hover:bg-[#1E8C45] hover:text-white transition-all">-</button>
                                      <span className="text-xs font-black text-[#1E8C45] w-6 text-center">{basket.find(p => p.id === prod.id)?.quantity}</span>
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        setBasket(prev => prev.map(p => p.id === prod.id ? { ...p, quantity: p.quantity + 1 } : p));
                                      }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#1E8C45] font-black hover:bg-[#1E8C45] hover:text-white transition-all">+</button>
                                   </div>
                                ) : (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); addToBasket(prod); }} 
                                     className="w-10 h-10 rounded-full bg-[#1E8C45] flex items-center justify-center text-white hover:bg-[#007542] transition-all shadow-lg shadow-[#1E8C45]/20"
                                   >
                                      <ShoppingBasket size={18} />
                                   </button>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        );
        case 'portfolio': return <Portfolio currentLangId={currentLang.id} />;
        case 'team': return <TeamSection />;
        case 'delivery': return <div><h2 className="text-3xl font-bold">Livraison</h2></div>;
        case 'notifications': {
          return (
            <div className="max-w-[800px] mx-auto pb-10 px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('notifications')}</h2>
                  <p className="text-xs text-slate-500 font-medium">{t('recent_promotions')}</p>
                </div>
                <div className="w-10 h-10 bg-[#1E8C45]/10 rounded-full flex items-center justify-center text-[#1E8C45]">
                  <Bell size={20} />
                </div>
              </div>

              {activeNotifications.length > 0 ? (
                <div className="space-y-4">
                  {activeNotifications.map((notif) => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm flex gap-4 items-center group cursor-pointer hover:border-[#1E8C45]/30 transition-all hover:shadow-md"
                      onClick={() => {
                        setActiveNotification(notif);
                        setShowPromo(true);
                      }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-[#1E8C45]/20 overflow-hidden transition-all duration-500 shadow-sm">
                        {notif.image ? (
                          <img 
                            src={notif.image} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                        ) : (
                          <Sparkles size={20} className="text-[#1E8C45]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase text-[#1E8C45] tracking-widest bg-[#1E8C45]/10 px-2 py-0.5 rounded-full">Promotion</span>
                          <span className="text-[10px] text-slate-400 font-medium">Aujourd'hui</span>
                        </div>
                        <h4 className="font-bold text-slate-800 truncate leading-tight mb-1">{notif.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{notif.message}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#1E8C45] group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4 scale-110">
                    <Bell size={40} strokeWidth={1} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{t('no_notifications')}</h3>
                  <p className="text-xs text-slate-500 max-w-xs">{t('back_to_market')}</p>
                </div>
              )}
            </div>
          );
        }
        case 'dashboard': return (
          <div className="max-w-[1080px] mx-auto pb-8 transition-all duration-500 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* HERO */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-[#F8F9F9] rounded-[32px] p-5 md:p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[200px]">
                <div className="z-10 relative">
                  <div className="bg-[#007542] text-white w-12 h-12 flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-[#007542]/20">
                     <Sprout size={24} />
                  </div>
                  <p className="text-[#1E8C45] font-bold tracking-wider text-[10px] mb-1 uppercase">{t('welcome')}</p>
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4 z-10 relative tracking-tight text-slate-900 leading-tight">
                    {welcomeContent?.title ? (
                      welcomeContent.title
                    ) : (
                      <>
                        {t('discover_nature').split(' ').slice(0, 2).join(' ')}<br/>
                        <span className="text-[#3AA346]">{t('discover_nature').split(' ').slice(2).join(' ')}</span>
                      </>
                    )}
                  </h1>
                  <button onClick={() => setActivePage('store')} className="bg-[#1E8C45] hover:bg-[#007542] transition-colors text-white px-8 py-3 rounded-full font-bold mt-4 shadow-lg shadow-[#1E8C45]/30">
                    {t('discover_products')}
                  </button>
                </div>
                
                {/* BACKGROUND TEXT */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <h1 className="text-[12vw] md:text-[14rem] font-black text-[#58BB43]/5 select-none text-center">DJAPERO</h1>
                </div>

                <div className="relative z-10 flex-1 flex justify-end items-center mr-4 lg:mr-16 mt-8 md:mt-0">
                  <div className="w-56 h-56 md:w-72 md:h-72 rounded-full border-8 border-white shadow-2xl overflow-hidden relative z-10 transform hover:scale-105 transition-transform duration-500">
                    <img src={welcomeContent?.video || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"} alt="Légumes frais" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 text-right max-w-[220px] z-10 hidden md:block bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white">
                  <h4 className="font-bold mb-1 text-slate-900">{t('our_mission')}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {welcomeContent?.subtitle || t('mission_desc')}
                  </p>
                </div>
              </div>

              {/* ROW 2 */}


              {/* ROW 3 - Campagne Vidéo Djapero */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#099a13] text-center">{t('campaign_title')}</h3>
                  </div>
                  <div className="w-screen -mx-4 md:w-full md:max-w-2xl md:mx-auto aspect-[9/10] md:aspect-video rounded-none md:rounded-3xl overflow-hidden relative bg-slate-900 group">
                      <video 
                        key={campaignVideo}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        <source src={campaignVideo} type="video/mp4" />
                        No description
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8">
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         className="max-w-xl"
                       >
                         <h4 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">{t('campaign_video_title')}</h4>
                         <p className="text-white/90 text-xs sm:text-base font-medium mb-4 drop-shadow-md">{t('campaign_video_desc')}</p>
                         <button 
                           onClick={() => setActivePage('store')}
                           className="px-6 py-2 bg-[#1E8C45] text-white rounded-lg font-bold hover:bg-[#007542] transition-all transform hover:scale-105 shadow-lg shadow-[#1E8C45]/20 flex items-center gap-2 w-fit text-sm"
                         >
                           {t('visit_store')} <ShoppingBasket size={14} />
                         </button>
                       </motion.div>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-widest border border-white/30 animate-pulse">
                      HD EN DIRECT • CAMPAGNE
                    </div>
                 </div>
              </div>

            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 pt-8 border-t border-slate-200">
              <div className="flex gap-4 items-center group cursor-pointer hover:bg-slate-50 p-3 rounded-2xl transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#9BE931]/20 flex items-center justify-center text-[#1E8C45] group-hover:bg-[#3AA346] group-hover:text-white transition-colors shrink-0 shadow-sm">
                  <BadgeCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{t('guaranteed_freshness')}</h4>
                  <p className="text-[11px] text-gray-500">{t('farm_to_table')}</p>
                </div>
              </div>
              <div className="flex gap-4 items-center group cursor-pointer hover:bg-slate-50 p-3 rounded-2xl transition-colors">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-[#1E8C45] group-hover:text-white transition-colors shrink-0 shadow-sm">
                  <HeartHandshake size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{t('local_support')}</h4>
                  <p className="text-[11px] text-gray-500">{t('producer_val')}</p>
                </div>
              </div>
              <div className="flex gap-4 items-center group cursor-pointer hover:bg-slate-50 p-3 rounded-2xl transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-[#1E8C45] group-hover:text-white transition-colors shrink-0 shadow-sm">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{t('services_360')}</h4>
                  <p className="text-[11px] text-gray-500">{t('comm_service')}</p>
                </div>
              </div>
              <div className="flex gap-4 items-center group cursor-pointer hover:bg-slate-50 p-3 rounded-2xl transition-colors">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-[#1E8C45] group-hover:text-white transition-colors shrink-0 shadow-sm">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{t('serene_delivery')}</h4>
                  <p className="text-[11px] text-gray-500">{t('fast_and_stressfree')}</p>
                </div>
              </div>
            </div>
          </div>
        );
        default: return (
            <div className="grid grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-djapero-light border border-gray-100 flex items-center gap-6">
                    <div className="p-4 bg-djapero-bright/20 rounded-2xl text-djapero-dark"><Truck /></div>
                    <div>
                        <h3 className="text-xl font-bold">Active Deliveries</h3>
                        <p className="text-gray-500">12 ongoing</p>
                    </div>
                </div>
            </div>
        );
    }
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'basket', icon: ShoppingBasket, label: 'Panier' },
    { id: 'store', icon: Store, label: 'Boutique' },
    { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
    { id: 'team', icon: Users, label: 'Équipe' },
    { id: 'delivery', icon: Truck, label: 'Livraison' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <div className="flex h-screen bg-[#DDF0F7] overflow-hidden font-sans relative">
      <style>{`
        .bg-\\[\\#1E8C45\\] { background-color: ${currentTheme.primary} !important; }
        .text-\\[\\#1E8C45\\] { color: ${currentTheme.primary} !important; }
        .border-\\[\\#1E8C45\\] { border-color: ${currentTheme.primary} !important; }
        .fill-\\[\\#1E8C45\\] { fill: ${currentTheme.primary} !important; }
        .focus\\:border-\\[\\#1E8C45\\]:focus { border-color: ${currentTheme.primary} !important; }
        .hover\\:bg-\\[\\#1E8C45\\]:hover { background-color: ${currentTheme.primary} !important; }
        .hover\\:text-\\[\\#1E8C45\\]:hover { color: ${currentTheme.primary} !important; }
        .group-hover\\:bg-\\[\\#1E8C45\\]:hover { background-color: ${currentTheme.primary} !important; }
        
        .bg-\\[\\#1E8C45\\]\\/10 { background-color: ${currentTheme.primary}1A !important; }
        .bg-\\[\\#1E8C45\\]\\/5 { background-color: ${currentTheme.primary}0D !important; }
        .shadow-\\[\\#1E8C45\\]\\/20 { box-shadow: 0 10px 15px -3px ${currentTheme.primary}33 !important; }
        .shadow-\\[\\#1E8C45\\]\\/15 { box-shadow: 0 4px 6px -1px ${currentTheme.primary}26 !important; }
        .shadow-\\[\\#1E8C45\\]\\/30 { box-shadow: 0 20px 25px -5px ${currentTheme.primary}4D !important; }
        .hover\\:shadow-\\[\\#1E8C45\\]\\/5:hover { box-shadow: 0 4px 6px -1px ${currentTheme.primary}0D !important; }
        .hover\\:border-\\[\\#1E8C45\\]\\/30:hover { border-color: ${currentTheme.primary}4D !important; }
        .border-\\[\\#1E8C45\\]\\/20 { border-color: ${currentTheme.primary}33 !important; }
        .border-\\[\\#1E8C45\\]\\/10 { border-color: ${currentTheme.primary}1A !important; }
        .from-\\[\\#1E8C45\\] { --tw-gradient-from: ${currentTheme.primary} var(--tw-gradient-from-position) !important; }

        .bg-\\[\\#007542\\] { background-color: ${currentTheme.dark} !important; }
        .text-\\[\\#007542\\] { color: ${currentTheme.dark} !important; }
        .hover\\:bg-\\[\\#007542\\]:hover { background-color: ${currentTheme.dark} !important; }
        .hover\\:text-\\[\\#007542\\]:hover { color: ${currentTheme.dark} !important; }
        .to-\\[\\#007542\\] { --tw-gradient-to: ${currentTheme.dark} var(--tw-gradient-to-position) !important; }
        .shadow-\\[\\#007542\\]\\/20 { box-shadow: 0 10px 15px -3px ${currentTheme.dark}33 !important; }

        .text-\\[\\#3AA346\\] { color: ${currentTheme.light} !important; }
        .bg-\\[\\#3AA346\\] { background-color: ${currentTheme.light} !important; }
        .focus\\:border-\\[\\#3AA346\\]:focus { border-color: ${currentTheme.light} !important; }
        .group-hover\\:bg-\\[\\#3AA346\\]:hover { background-color: ${currentTheme.light} !important; }
      `}</style>
      
      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="hidden md:flex absolute top-1/2 left-0 z-[60] -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-md text-slate-500 hover:text-slate-800 items-center justify-center py-4 px-1 rounded-r-xl transition-colors shrink-0"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar Container */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isExpanded ? 78 : 0,
          opacity: isExpanded ? 1 : 0,
          marginLeft: isExpanded ? 12 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="hidden md:flex my-3 rounded-[35px] bg-gradient-to-b from-[#EBF5FA] to-[#D5EAF4] shadow-[8px_0_30px_rgba(0,100,150,0.06)] border border-white/60 flex-col items-center py-5 z-50 h-[calc(100vh-24px)] overflow-hidden relative shrink-0"
      >
        <div className="w-full h-full flex flex-col items-center overflow-y-auto hide-scrollbar px-1 pb-8">

          {/* Menu Section */}
          {userEmail && (
            <div className="flex items-center justify-center mb-4 bg-white/50 w-9 h-9 rounded-full shrink-0">
              <Mail className="w-4 h-4 text-slate-600" />
            </div>
          )}
          <p className="text-[8px] font-bold text-slate-500 mb-3 tracking-wider uppercase shrink-0">Menu: 5</p>
          
          <div className="flex flex-col gap-2 w-full px-2 mb-4 shrink-0">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
              { id: 'notifications', icon: Bell, label: t('notifications') },
              { id: 'market', icon: Map, label: t('market') },
              { id: 'store', icon: Store, label: t('store') },
              { id: 'basket', icon: ShoppingBasket, label: t('basket') },
              { id: 'delivery', icon: Truck, label: t('delivery') },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setLangAnchor(null);
                }}
                className={`group w-10 h-10 rounded-[14px] flex items-center justify-center mx-auto transition-all duration-300 shrink-0 relative ${activePage === item.id ? 'bg-[#3AA8FF] text-white shadow-lg shadow-blue-400/40' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
              >
                <item.icon size={18} strokeWidth={activePage === item.id ? 2.5 : 2} />
                <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 hover:opacity-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[100]">
                   {item.label}
                </span>
                {item.id === 'basket' && basket.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#DDF0F7] shadow-sm">
                    {basket.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="w-6 h-px bg-slate-300/60 mb-4 rounded-full shrink-0"></div>

          {/* Service Section */}
          <p className="text-[8px] font-bold text-slate-500 mb-3 tracking-wider uppercase shrink-0">Service: 2</p>

          <div className="bg-white/80 backdrop-blur-md rounded-[20px] p-1.5 flex flex-col gap-1.5 mb-4 mx-1.5 shrink-0 shadow-sm border border-white">
            {[
              { id: 'portfolio', icon: Briefcase },
              { id: 'team', icon: Users },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActivePage(item.id)} 
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mx-auto ${activePage === item.id ? 'bg-[#E5F3FF] text-[#3AA8FF]' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <item.icon size={16} strokeWidth={2} />
              </button>
            ))}
          </div>

          {/* Settings/Admin Section */}
          <p className="text-[8px] font-bold text-slate-500 mb-3 tracking-wider uppercase shrink-0">{t('settings')}</p>
          <div className="bg-white/80 backdrop-blur-md rounded-[20px] p-1.5 flex flex-col gap-1.5 mb-5 mx-1.5 shrink-0 shadow-sm border border-white">
            <button 
              onClick={() => setLangAnchor(langAnchor === 'sidebar-bottom' ? null : 'sidebar-bottom')}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mx-auto text-slate-500 hover:bg-slate-100 group relative border border-slate-100/50"
              title={t('language')}
            >
              <span className="text-base">{currentLang.flag}</span>
              <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[100]">
                 {t('language')}: {currentLang.name}
              </span>
            </button>
            {isAdmin && (
               <button 
                 onClick={() => onNavigate('admin')} 
                 className="w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all shrink-0 mx-auto text-rose-500 bg-rose-50 hover:bg-rose-100 group relative"
                 title="Portail Administration"
               >
                 <ShieldCheck size={16} strokeWidth={2} />
                 <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[100]">
                    Admin
                 </span>
               </button>
            )}
            <button 
              onClick={() => setIsThemeModalOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mx-auto text-slate-500 hover:bg-slate-100 group relative"
            >
              <Menu size={16} strokeWidth={2} />
              <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[100]">
                 {t('theme')}
              </span>
            </button>
            {onLogout && (
               <button 
                 onClick={onLogout} 
                 className="w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all shrink-0 mx-auto text-slate-500 hover:text-rose-500 hover:bg-rose-50 group relative"
                 title={t('logout')}
               >
                 <LogOut size={16} strokeWidth={2} />
                 <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[100]">
                    {t('logout')}
                 </span>
               </button>
            )}
          </div>

          <button className="mt-auto mb-1 w-11 h-11 rounded-full bg-[#3AA8FF] text-white flex items-center justify-center shadow-lg shadow-[#3AA8FF]/40 hover:scale-105 transition-transform shrink-0">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        layout
        className="flex-1 bg-slate-50/95 rounded-t-[32px] md:rounded-[40px] p-4 pb-28 sm:pb-28 md:p-7 md:pb-8 m-0 mt-4 md:m-4 md:ml-2 overflow-y-auto shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] relative"
      >
        {!['store', 'market', 'basket'].includes(activePage) && (
          <header className="flex justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold capitalize">
                {activePage === 'dashboard' ? t('dashboard') : t(activePage)}
              </h2>
            </div>
            
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="relative flex-1 max-w-sm hidden sm:block">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input type="text" placeholder={t('search')} className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3AA8FF]/20 shadow-sm transition-shadow text-sm" />
              </div>

              <button 
                onClick={() => setLangAnchor(langAnchor === 'header' ? null : 'header')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:border-[#3AA8FF] transition-all group overflow-hidden"
              >
                <div className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <img 
                    src={`https://flagcdn.com/w40/${currentLang.code.toLowerCase()}.png`} 
                    alt={currentLang.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-black text-slate-700 hidden lg:block uppercase tracking-wider">{currentLang.code}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isAdmin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="flex flex-col items-center justify-center -mb-1 md:hidden"
                  title="Admin"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm animate-pulse">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">Admin</span>
                </button>
              )}

              {/* Removed avatar */}
            </div>
          </header>
        )}

        {renderContent()}
      </motion.main>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="relative z-[101] w-[75vw] max-w-[260px] md:max-w-none md:w-[680px] h-auto bg-slate-900/40 md:bg-white backdrop-blur-2xl rounded-[20px] overflow-hidden flex flex-col text-white md:text-slate-900 shadow-2xl border border-white/20 md:border-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Product Details Section */}
                <div className="relative overflow-hidden">
                  <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                    <motion.div
                      key={selectedProduct.id}
                      custom={slideDirection}
                      variants={{
                        enter: (direction: number) => ({
                          x: direction > 0 ? 30 : direction < 0 ? -30 : 0,
                          opacity: 0
                        }),
                        center: {
                          zIndex: 1,
                          x: 0,
                          opacity: 1
                        },
                        exit: (direction: number) => ({
                          zIndex: 0,
                          x: direction < 0 ? 30 : direction > 0 ? -30 : 0,
                          opacity: 0
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 400, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="flex flex-col md:flex-row"
                    >
                      <div className="w-full md:w-1/2 shrink-0 p-4 md:p-0">
                        <div 
                          className="aspect-square md:aspect-auto md:h-full relative bg-white md:bg-slate-50 flex items-center justify-center overflow-hidden rounded-[24px] md:rounded-l-[20px] md:rounded-tr-none border border-slate-100 md:border-none shadow-sm md:shadow-none group/img"
                          onMouseEnter={() => setIsZoomed(true)}
                          onMouseLeave={() => setIsZoomed(false)}
                          onClick={() => setIsZoomed(!isZoomed)}
                        >
                          <img 
                             src={selectedProduct.image} 
                             alt={selectedProduct.name} 
                             className={`w-full h-full object-contain md:object-cover transition-transform duration-500 ease-out cursor-zoom-in ${isZoomed ? 'scale-150' : 'scale-100'}`} 
                             onError={(e) => { 
                               e.currentTarget.onerror = null;
                               e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
                             }}
                             referrerPolicy="no-referrer"
                          />
                          
                          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); }}
                              className="w-8 h-8 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-all"
                            >
                               <X size={14} />
                            </button>
                            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1">
                               <Sparkles size={10} className="text-[#1E8C45] animate-pulse" />
                               <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{selectedProduct.category}</span>
                            </div>
                          </div>

                          {isZoomed && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                               <div className="bg-black/40 text-white px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                  Mode Zoom Actif
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
        
                      <div className="w-full md:w-1/2 p-5 flex flex-col bg-transparent text-white md:text-slate-900">
                         <div className="flex-1">
                            <div className="mb-4">
                               <h2 className="text-xl sm:text-2xl font-black text-white md:text-slate-900 tracking-tight leading-tight">{selectedProduct.name}</h2>
                               {selectedProduct.measure && (
                                 <div className="mt-1 flex items-center gap-1.5">
                                   <div className="w-1.5 h-1.5 bg-[#1E8C45] rounded-full"></div>
                                   <span className="text-[10px] font-black text-[#1E8C45] uppercase tracking-[0.2em]">{selectedProduct.measure}</span>
                                 </div>
                               )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-4 mb-2 sm:mb-6">
                              <button 
                                type="button"
                                onClick={() => setSelectedPriceType('detail')}
                                className={`p-1.5 rounded-[12px] border-2 transition-all text-left ${selectedPriceType === 'detail' ? 'border-[#25D366] bg-transparent' : 'border-white/10 bg-transparent'}`}>
                                <p className="text-[7px] font-black uppercase tracking-widest mb-0 text-white/50 md:text-slate-400">{getTranslation(currentLang.id, 'price_detail')}</p>
                                <p className="text-sm font-bold text-white md:text-slate-900">{selectedProduct.priceDetail} <span className="text-[8px] font-medium opacity-60">FCFA</span></p>
                              </button>
                              <button 
                                type="button"
                                onClick={() => setSelectedPriceType('gros')}
                                className={`p-1.5 rounded-[12px] border-2 transition-all text-left ${selectedPriceType === 'gros' ? 'border-[#25D366] bg-transparent' : 'border-white/10 bg-transparent'}`}>
                                <p className="text-[7px] font-black uppercase tracking-widest mb-0 text-white/50 md:text-slate-400">{getTranslation(currentLang.id, 'price_gros')}</p>
                                <p className="text-sm font-bold text-white md:text-slate-900">{selectedProduct.priceGros} <span className="text-[8px] font-medium opacity-60">FCFA</span></p>
                              </button>
                            </div>
            
                            <div className="pt-1 sm:pt-5 mb-3 sm:mb-6">
                             <h3 className="hidden font-black text-[10px] uppercase tracking-widest text-white/40 md:text-[#64748B] mb-2">{getTranslation(currentLang.id, 'description')}</h3>
                             <p className="text-white/80 md:text-slate-600 leading-relaxed text-[10px] sm:text-sm line-clamp-2 md:line-clamp-none">
                               {selectedProduct.description || getTranslation(currentLang.id, 'no_desc')}
                             </p>
                            </div>
                         </div>
            
                         <div className="flex gap-2 shrink-0 pt-2 border-t border-white/10 md:border-slate-100 mt-auto">
                           <button 
                             onClick={() => { addToBasket(selectedProduct); setSelectedProduct(null); }}
                             className="flex-1 bg-[#1E8C45] hover:bg-[#007542] text-white h-11 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1E8C45]/20"
                           >
                             <ShoppingBasket size={18} /> {getTranslation(currentLang.id, 'basket')}
                           </button>
                           <button 
                             onClick={() => handleOrderWhatsApp(selectedProduct, selectedPriceType)}
                             className="w-11 h-11 bg-[#25D366] hover:bg-[#1fb355] text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-[#25D366]/20 shrink-0"
                             title={getTranslation(currentLang.id, 'order_whatsapp')}
                           >
                             <MessageCircle size={22} />
                           </button>
                         </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
    
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlideDirection(-1);
                      const idx = products.findIndex(p => p.id === selectedProduct.id);
                      const prevIdx = (idx - 1 + products.length) % products.length;
                      setSelectedProduct(products[prevIdx]);
                    }}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 md:bg-slate-100 hover:bg-[#1E8C45] hover:text-white rounded-full flex items-center justify-center text-slate-400 border border-white/10 md:border-none shadow-lg transition-all z-[110] hidden md:flex"
                  >
                     <ChevronLeft size={16} />
                  </button>
    
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlideDirection(1);
                      const idx = products.findIndex(p => p.id === selectedProduct.id);
                      const nextIdx = (idx + 1) % products.length;
                      setSelectedProduct(products[nextIdx]);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 md:bg-slate-100 hover:bg-[#1E8C45] hover:text-white rounded-full flex items-center justify-center text-slate-400 border border-white/10 md:border-none shadow-lg transition-all z-[110] hidden md:flex"
                  >
                     <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Bar - Screenshot Style */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 z-[100] px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3 pointer-events-auto">
          {/* Main Navigation Pill */}
          <div className="bg-white rounded-full px-6 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-50 flex items-center gap-8 h-14">
            {[
              { id: 'dashboard', icon: Home },
              { id: 'market', icon: Search },
              { id: 'portfolio', icon: Heart },
            ].map((item) => {
              const isActive = activePage === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'text-slate-900' 
                      : 'text-slate-300'
                  }`}
                >
                  <IconComp size={24} strokeWidth={isActive ? 2.5 : 2} />
                </button>
              );
            })}
          </div>

          {/* Cart Circle */}
          <button 
            onClick={() => setActivePage('basket')}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-50 relative transition-all active:scale-95 group"
          >
            <ShoppingBasket size={26} className="text-[#1E8C45]" />
            {basket.length > 0 && (
              <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Profile Circle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-14 h-14 bg-white rounded-full overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-50 flex items-center justify-center text-[#1E8C45] font-black text-sm transition-all active:scale-95"
          >
            {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'JI'}
          </button>
        </div>
      </div>

      {/* Radial Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[200] bg-black/5 pointer-events-auto"
            />
            
            <div className="md:hidden fixed inset-0 z-[201] pointer-events-none flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 40 }}
                className="absolute right-[-150px] w-[380px] h-[380px] pointer-events-auto"
              >
                {/* Curved white arc - Wide and elegant */}
                <div className="absolute inset-0 rounded-full border-[48px] border-white shadow-[0_5px_40px_rgba(0,0,0,0.06)] opacity-[0.98] pointer-events-none" />
                
                {/* Radial Icons - Static */}
                {[
                   { id: 'lang', icon: Languages, action: () => setLangAnchor('mobile'), angle: 105 },
                   { id: 'notifications', icon: Bell, angle: 120 },
                   { id: 'team', icon: Users, angle: 135 },
                   { id: 'store', icon: Store, angle: 150 },
                   { id: 'portfolio', icon: Briefcase, angle: 165 },
                   { id: 'delivery', icon: Truck, angle: 180 },
                   { id: 'admin', icon: ShieldCheck, angle: 195, condition: isAdmin },
                   { id: 'dashboard', icon: LayoutDashboard, angle: 210 },
                   { id: 'settings', icon: Settings2, angle: 225 },
                   { id: 'display', icon: Monitor, angle: 240 },
                   { id: 'bookmark', icon: Bookmark, angle: 255 },
                   { id: 'logout', icon: LogOut, action: onLogout, angle: 270, color: 'text-rose-500' },
                ].filter(item => item.condition !== false).map((item, index) => {
                  const angleRad = (item.angle * Math.PI) / 180;
                  const radius = 172; 
                  const x = Math.cos(angleRad) * radius;
                  const y = Math.sin(angleRad) * radius;
                  
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.action) item.action();
                        else if (item.id === 'admin') onNavigate('admin');
                        else setActivePage(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-50 flex items-center justify-center transition-all active:scale-90 ${item.id === 'logout' ? 'bg-rose-50' : ''} ${item.color || 'text-slate-500'}`}
                    >
                      <item.icon size={15} strokeWidth={2.5} />
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>


      {/* Theme Selection Modal */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsThemeModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{t('theme')}</h3>
                  <p className="text-xs text-slate-500 font-medium">{t('customize_theme')}</p>
                </div>
                <button 
                  onClick={() => setIsThemeModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 gap-3">
                {THEMES.map(theme => (
                  <button 
                    key={theme.id}
                    onClick={() => {
                      setCurrentTheme(theme);
                      setIsThemeModalOpen(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${currentTheme.id === theme.id ? 'border-[#1E8C45] bg-[#1E8C45]/5' : 'border-slate-100 hover:border-slate-200'} `}
                  >
                    <span className="font-bold text-slate-700">{theme.name}</span>
                    <div className="flex -space-x-2">
                       <span className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.primary }} />
                       <span className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.light }} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Selection Popover */}
      <AnimatePresence>
        {langAnchor && (
          <div 
            className="fixed inset-0 z-[100] overflow-hidden pointer-events-none"
            onClick={() => setLangAnchor(null)}
          >
            {/* Transparent click catcher */}
            <div className="absolute inset-0 pointer-events-auto" />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: langAnchor.includes('sidebar') ? 0 : 10, x: langAnchor.includes('sidebar') ? -10 : 0 }}
              animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: langAnchor.includes('sidebar') ? 0 : 10, x: langAnchor.includes('sidebar') ? -10 : 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed z-[101] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-[280px] overflow-hidden border border-slate-100 pointer-events-auto ${
                langAnchor === 'sidebar-top' ? 'left-24 top-[35%]' :
                langAnchor === 'sidebar-bottom' ? 'left-24 bottom-24' :
                langAnchor === 'header' ? 'right-4 top-20' :
                langAnchor === 'market-header' ? 'left-20 top-24' :
                langAnchor === 'store' ? 'right-4 top-24' :
                langAnchor === 'mobile' ? 'right-6 bottom-24' :
                'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              }`}
            >
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{t('language')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t('choose_language')}</p>
                </div>
                <button 
                  onClick={() => setLangAnchor(null)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-2 grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto hide-scrollbar">
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang.id}
                    onClick={() => {
                      setCurrentLang(lang);
                      localStorage.setItem('djapero_lang', lang.id);
                      setLangAnchor(null);
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all relative group ${currentLang.id === lang.id ? 'border-[#1E8C45] bg-[#1E8C45]/5' : 'border-transparent hover:bg-slate-50'} `}
                  >
                    <div className="w-10 h-10 flex flex-col items-center justify-center bg-white rounded-lg font-black text-slate-800 text-[9px] group-hover:scale-105 transition-transform shrink-0 leading-none overflow-hidden border border-slate-100 shadow-sm">
                      <img 
                        src={`https://flagcdn.com/w80/${lang.code.toLowerCase()}.png`} 
                        alt={lang.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className={`text-xs font-black truncate ${currentLang.id === lang.id ? 'text-[#1E8C45]' : 'text-slate-700'}`}>{lang.name}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{lang.code}</span>
                    </div>
                    {currentLang.id === lang.id && (
                       <BadgeCheck size={16} className="text-[#1E8C45] ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Add to Basket Feedback Animation */}
      <AnimatePresence>
        {showAddFeedback && lastAddedProduct && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 30, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-full pl-2 pr-6 py-2 shadow-[0_10px_40px_rgba(30,140,69,0.2)] border border-[#1E8C45]/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm shrink-0">
                <img 
                  src={lastAddedProduct.image} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#1E8C45] uppercase tracking-widest leading-none mb-1">Ajouté au panier !</p>
                <p className="text-xs font-bold text-slate-800 leading-none">{lastAddedProduct.name}</p>
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-2 w-7 h-7 bg-[#1E8C45] rounded-full flex items-center justify-center text-white"
              >
                <ShoppingBasket size={14} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Promotional Notification Popup - Redesigned as Floating Message Bubble */}
      <AnimatePresence>
        {showPromo && activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            className="fixed bottom-24 md:bottom-8 left-1/2 z-[4000] w-[calc(100%-32px)] max-w-md"
          >
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col relative">
              <button 
                onClick={() => {
                  setShowPromo(false);
                  localStorage.setItem('djapero_last_notif_seen', activeNotification.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-all z-20"
              >
                <X size={16} />
              </button>

              <div className="flex gap-4 p-5 items-start">
                <div 
                  className={`w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden ${activeNotification.image ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}`}
                  onClick={() => activeNotification.image && setZoomedNotifImage(activeNotification.image)}
                >
                   {activeNotification.image ? (
                     <img src={activeNotification.image} className="w-full h-full object-cover" />
                   ) : (
                     <Sparkles size={24} className="text-[#1E8C45] animate-pulse" />
                   )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#1E8C45] animate-pulse"></div>
                    <span className="text-[10px] font-black text-[#1E8C45] uppercase tracking-widest">{t('notifications')}</span>
                  </div>
                  <h3 className="font-black text-slate-800 leading-tight mb-1">{activeNotification.title}</h3>
                  <p className="text-[12px] text-slate-500 font-medium leading-tight">
                    {activeNotification.message}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-1 flex gap-3">
                <button 
                  onClick={() => {
                    setShowPromo(false);
                    localStorage.setItem('djapero_last_notif_seen', activeNotification.id);
                  }}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    setShowPromo(false);
                    localStorage.setItem('djapero_last_notif_seen', activeNotification.id);
                    setActivePage('store');
                  }}
                  className="flex-1 py-3 bg-[#1E8C45] hover:bg-[#007542] text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#1E8C45]/20 transition-all active:scale-95"
                >
                  {t('view_more')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automatic Welcome Message (Flooz Style) */}
      <AnimatePresence>
        {showAutoGreeting && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-24 md:bottom-8 left-1/2 z-[3000] w-[calc(100%-32px)] max-w-md"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-start gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-[#1E8C45] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#1E8C45]/20 animate-bounce">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#1E8C45] uppercase tracking-widest">{t('auto_greeting_title')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E8C45] animate-pulse"></span>
                  </div>
                  <span className="text-[9px] text-white/40 font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[13px] font-bold text-white leading-tight mb-3">
                  {t('auto_greeting_msg')}
                </p>
                <div className="flex gap-2.5">
                   <button 
                     onClick={() => {
                        setSelectedProduct(null);
                        setActivePage('store');
                        setShowAutoGreeting(false);
                     }}
                     className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border border-white/5"
                   >
                     {t('visit_store')}
                   </button>
                   <button 
                     onClick={() => {
                        const whatsappNumber = adminPhone.replace(/\s+/g, '').replace('+', '');
                        window.open(`https://wa.me/${whatsappNumber}`, '_blank');
                     }}
                     className="bg-[#25D366] hover:bg-[#1fb355] text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#25D366]/20 transition-all active:scale-95"
                   >
                     <MessageCircle size={10} /> WhatsApp
                   </button>
                </div>
              </div>
              <button 
                onClick={() => setShowAutoGreeting(false)}
                className="text-white/40 hover:text-white transition-colors pt-1"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoomed Notification Image Viewer - Styled Window Modal */}
      <AnimatePresence>
        {zoomedNotifImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedNotifImage(null)}
            className="fixed inset-0 z-[5000] bg-slate-950/80 flex items-center justify-center p-6 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 w-9 h-9 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center text-slate-800 transition-colors z-10"
                onClick={() => setZoomedNotifImage(null)}
              >
                <X size={18} />
              </button>
              <div className="bg-slate-50 p-1">
                <img
                  src={zoomedNotifImage}
                  alt="Promotion"
                  className="w-full h-auto max-h-[60vh] object-contain rounded-2xl"
                />
              </div>
              <div className="p-4 bg-white border-t border-slate-50 flex justify-center">
                 <button 
                  onClick={() => setZoomedNotifImage(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                 >
                   Fermer
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
