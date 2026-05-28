import { motion, AnimatePresence, useAnimation } from 'motion/react';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { getTranslation } from '../lib/translations';

import { getVideo } from '../lib/videoStorage';

export function WelcomeScreen({ onContinue, isAdmin, onGoToAdmin }: { onContinue: () => void, isAdmin?: boolean, onGoToAdmin?: () => void }) {
  const [currentLangId, setCurrentLangId] = useState(() => localStorage.getItem('djapero_lang') || 'fr');
  const t = (key: string) => getTranslation(currentLangId, key);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStorage = () => {
      setCurrentLangId(localStorage.getItem('djapero_lang') || 'fr');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const defaultCards = useMemo(() => [
    { id: 'market', title: t('welcome_card_market_title'), text: t('welcome_card_market_text'), image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
    { id: 'delivery', title: t('welcome_card_delivery_title'), text: t('welcome_card_delivery_text'), image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' },
    { id: 'team', title: t('welcome_card_team_title'), text: t('welcome_card_team_text'), image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80' },
    { id: 'consumer', title: t('welcome_card_consumer_title'), text: t('welcome_card_consumer_text'), image: 'https://images.unsplash.com/photo-1526779259127-1f9531130863?auto=format&fit=crop&w=400&q=80' },
    { id: 'seller', title: t('welcome_card_seller_title'), text: t('welcome_card_seller_text'), image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=80' },
    { id: 'others', title: t('welcome_card_others_title'), text: t('welcome_card_others_text'), image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80' },
  ], [currentLangId]);

  const [savedContent, setSavedContent] = useState<any>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const savedJson = localStorage.getItem('djapero_welcome_content');
        if (!savedJson) {
          setSavedContent(null);
          return;
        }
        
        const saved = JSON.parse(savedJson);
        if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
          // If video is stored in IndexedDB, fetch it
          if (saved.video === 'indexeddb:djapero_welcome_video') {
            setIsVideoLoading(true);
            const videoData = await getVideo('djapero_welcome_video');
            if (videoData) {
              // Convert base64 to Blob for better performance
              try {
                const response = await fetch(videoData);
                const blob = await response.blob();
                if (videoBlobUrlRef.current) URL.revokeObjectURL(videoBlobUrlRef.current);
                const url = URL.createObjectURL(blob);
                videoBlobUrlRef.current = url;
                saved.video = url;
              } catch (e) {
                console.error("Error creating blob URL:", e);
                saved.video = videoData;
              }
            }
            setIsVideoLoading(false);
          }
          setSavedContent(saved);
        } else {
          setSavedContent(null);
        }
      } catch (e) {
        console.error("Error loading welcome content:", e);
      }
    };
    
    loadContent();
    window.addEventListener('storage', loadContent);
    window.addEventListener('welcome_content_updated', loadContent);
    return () => {
      window.removeEventListener('storage', loadContent);
      window.removeEventListener('welcome_content_updated', loadContent);
      if (videoBlobUrlRef.current) {
        URL.revokeObjectURL(videoBlobUrlRef.current);
      }
    };
  }, []);

  const displayTitle = savedContent?.title || t('signin_title');
  const displaySubtitle = savedContent?.subtitle || t('discover_nature');
  const cards = savedContent?.cards || defaultCards;

  const [campaignVideo, setCampaignVideo] = useState('https://www.youtube.com/watch?v=tVxqyc2SFxs');
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const controls = useAnimation();

  useEffect(() => {
    controls.start(i => ({
      opacity: 1,
      y: 0,
      rotate: [i % 2 === 0 ? 15 : -15, i % 2 === 0 ? -6 : 6, i % 2 === 0 ? 3 : -3, 0],
      transition: { 
        duration: 1.5,
        ease: 'easeOut',
        delay: 0.1 + i * 0.1 
      }
    }));
  }, [controls]);

  /* 
    Calculate offsets for the arc hanging effect
    Path: M 0,0 Q 825,140 1650,0
  */
  const getOffset = (i: number) => {
    const count = cards.length;
    if (count === 0) return 0;
    // Simple parabola for offset: y = -a(x - h)^2 + k
    // Let's just use some logic to make it look curved regardless of count
    const center = (count - 1) / 2;
    const maxOffset = 45;
    const minOffset = 5;
    
    // Normalized distance from center (0 to 1)
    const normalizedDist = Math.abs(i - center) / (center || 1);
    // Parabolic interpolation
    return minOffset + (maxOffset - minOffset) * (1 - normalizedDist * normalizedDist);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth * 0.5;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      
      const dir = direction === 'right' ? 1 : -1;
      
      controls.start(i => ({
        rotate: [0, dir * 8, -dir * 4, dir * 2, 0],
        transition: { 
          duration: 1.2, 
          ease: "easeInOut",
          delay: i * 0.05
        }
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = 120; // Fixed pixel threshold for better control
    if (x < threshold) {
      setHoverSide('left');
    } else if (x > rect.width - threshold) {
      setHoverSide('right');
    } else {
      setHoverSide(null);
    }
  };

  const handleMouseLeave = () => setHoverSide(null);

  const cardWidth = 160;
  const cardGap = 20;
  const totalWidth = cards.length * cardWidth + (cards.length - 1) * cardGap;
  const viewportWidth = 4 * cardWidth + 3 * cardGap + 64; // 4 cards + gaps + px-8 padding

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) return url;
    
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1].split('?')[0];
    }
    
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playlist=${videoId}&loop=1`;
    return url;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    return url.startsWith('data:video') || url.startsWith('blob:') || url.match(/\.(mp4|webm|ogg|mov)$/i) || (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('indexeddb:'));
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-start pt-12 pb-16 font-sans text-slate-900 overflow-x-hidden">
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-12"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X size={24} />
              </button>
              
              {!savedContent?.video ? (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {t('no_video')}
                </div>
              ) : isDirectVideo(savedContent.video) ? (
                <video 
                  src={savedContent.video} 
                  className="w-full h-full object-contain" 
                  controls 
                  autoPlay 
                  muted
                  playsInline
                />
              ) : (
                <iframe 
                  src={getEmbedUrl(savedContent.video).replace('mute=1', 'mute=0')}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </motion.div>
          </motion.div>
        )}

        {selectedCard && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full aspect-video relative">
                <img src={selectedCard.image} alt={selectedCard.title} className="w-full h-full object-cover" onError={(e) => { 
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                }} />
                <button 
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 flex flex-col gap-4 text-center items-center">
                <h3 className="text-2xl font-black tracking-tight text-slate-900">{selectedCard.title}</h3>
                <p className="text-slate-600 text-base leading-relaxed">{selectedCard.text}</p>
                <button 
                  className="w-full mt-4 bg-[#00e600] py-4 rounded-2xl font-black text-white shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
                  onClick={() => setSelectedCard(null)}
                >
                  {t('btn_discover')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-6 flex flex-col items-center z-20 relative w-full"
      >
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          src="/logo.png" 
          alt="Djapero Logo" 
          className="w-24 h-24 object-cover rounded-full shadow-lg mb-8 origin-bottom"
        />
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200/60 mb-6">
          <span className="text-lg">🚀</span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest text-[#00e600] mix-blend-multiply">{t('best_app_for')}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.8rem] xl:text-[3.4rem] font-black tracking-tighter text-slate-950 uppercase leading-[0.95] max-w-2xl whitespace-pre-line">
          {displayTitle}
        </h1>
        <p className="text-sm md:text-base text-slate-600 mt-4 max-w-lg font-medium">
          {displaySubtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="px-8 py-3.5 bg-[#00e600] text-white rounded-full font-bold text-base hover:bg-[#00cc00] transition-colors shadow-xl shadow-green-500/40"
          >
            {t('access_dashboard')}
          </motion.button>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoToAdmin}
              className="px-8 py-3.5 bg-rose-500 text-white rounded-full font-bold text-base hover:bg-rose-600 transition-colors shadow-xl shadow-rose-500/40 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              {t('go_to_admin')}
            </motion.button>
          )}
        </div>
      </motion.div>

      <div 
        className="relative w-full mx-auto mt-6 group/carousel"
        style={{ maxWidth: `${viewportWidth}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')} 
          className={`hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-40 p-4 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-2xl border border-slate-200 transition-all duration-500 ease-out transform ${hoverSide === 'left' ? 'opacity-100 translate-x-0 scale-110' : 'opacity-0 -translate-x-4 scale-90 pointer-events-none'}`}
        >
          <ChevronLeft size={32} />
        </button>
        <button 
          onClick={() => scroll('right')} 
          className={`hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-40 p-4 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-2xl border border-slate-200 transition-all duration-500 ease-out transform ${hoverSide === 'right' ? 'opacity-100 translate-x-0 scale-110' : 'opacity-0 translate-x-4 scale-90 pointer-events-none'}`}
        >
          <ChevronRight size={32} />
        </button>

        <div 
          className="w-full overflow-x-auto hide-scrollbar scroll-smooth cursor-grab active:cursor-grabbing pb-12 px-8" 
          ref={scrollRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="relative pt-10" style={{ width: `${totalWidth}px`, minWidth: 'min-content' }}>
            {/* Curved String Background */}
            <svg 
              className="absolute top-10 left-0 w-full h-[80px] overflow-visible pointer-events-none z-0" 
              viewBox={`0 0 ${totalWidth} 80`} 
              preserveAspectRatio="none"
            >
              {/* Shadow for the rope */}
              <path 
                d={`M 0,10 Q ${totalWidth / 2},100 ${totalWidth},10`} 
                fill="none" 
                stroke="rgba(0,0,0,0.15)" 
                strokeWidth="4" 
                strokeLinecap="round"
                className="blur-[2px] translate-y-1"
              />
              {/* The Rope itself */}
              <path 
                d={`M 0,10 Q ${totalWidth / 2},100 ${totalWidth},10`} 
                fill="none" 
                stroke="#3d2b1f" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeDasharray="1,2"
              />
              <path 
                d={`M 0,10 Q ${totalWidth / 2},100 ${totalWidth},10`} 
                fill="none" 
                stroke="#5d4037" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>

            <div className="flex items-start gap-6 relative z-10" style={{ width: `${totalWidth}px` }}>
              {cards.map((card, i) => (
                  <motion.div
                    key={card.id || i}
                    custom={i}
                    initial={{ opacity: 0, y: 40 }}
                    animate={controls}
                    whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 1 : -1 }}
                    className="w-[160px] bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/50 group flex flex-col relative shrink-0 cursor-pointer transition-all duration-300"
                    style={{ 
                      marginTop: `${getOffset(i)}px`,
                      transform: `rotate(${(i - (cards.length-1)/2) * 1.2}deg)`,
                      transformOrigin: '50% -20px'
                    }}
                    onClick={() => setSelectedCard(card)}
                  >
                    {/* Clip */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#00e600] rounded-b-lg shadow-lg flex items-center justify-center z-20 group-hover:scale-110 transition-transform">
                      <div className="w-1 h-1 bg-white rounded-full opacity-50 shadow-inner" />
                    </div>
                    
                    <div className="w-full aspect-[4/5] p-3 overflow-hidden relative bg-slate-50/50">
                      <img 
                        src={card.image} 
                        alt={card.title} 
                        className="w-full h-full object-cover rounded-[16px] group-hover:scale-110 transition-transform duration-1000" 
                        onError={(e) => { 
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
                        }} 
                      />
                      <div className="absolute inset-3 rounded-[16px] bg-transparent group-hover:bg-black/5 transition-colors pointer-events-none" />
                    </div>
                    
                    <div className="px-4 py-3 text-center bg-white">
                      <h3 className="text-sm font-black text-slate-950 group-hover:text-[#00e600] transition-colors leading-tight mb-0.5">{card.title}</h3>
                      <p className="text-slate-500 text-[8px] font-bold uppercase tracking-wider">{card.text}</p>
                    </div>
                  </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-4 w-full max-w-xl px-6 text-center z-20">
        <h3 className="text-xl font-black mb-4 text-slate-900 tracking-tight">{t('discover_video')}</h3>
          <div 
            className="aspect-video bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100/80 overflow-hidden cursor-pointer group/video-container relative"
          >
            {/* Transparent Overlay for Clicking */}
            <div 
              className="absolute inset-0 z-40" 
              onClick={() => setIsVideoModalOpen(true)}
            />

            {/* Play Overlay Button UI */}
            <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover/video-container:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                <div className="w-14 h-14 bg-[#00e600] rounded-full flex items-center justify-center pl-1 shadow-lg shadow-green-500/40">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-transparent group-hover/video-container:bg-slate-900/5 transition-colors z-20 pointer-events-none" />

            {isVideoLoading ? (
              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-12 h-12 border-4 border-[#00e600] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-bold animate-pulse">Chargement de la vidéo...</p>
              </div>
            ) : savedContent?.video ? (
              isDirectVideo(savedContent.video) ? (
                <video 
                  key={savedContent.video}
                  src={savedContent.video} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                />
              ) : (
                <iframe 
                  key={savedContent.video}
                  src={getEmbedUrl(savedContent.video).replace('autoplay=1', 'autoplay=0')}
                  className="w-full h-full border-0"
                />
              )
            ) : (
              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-16 h-16 bg-[#00e600] rounded-full flex items-center justify-center pl-1.5 shadow-lg shadow-green-500/30 mb-3 z-10">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-medium z-10">{t('discover_video')}</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
