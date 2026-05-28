import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Facebook, Chrome as Google, Languages, X, BadgeCheck, ChevronDown } from 'lucide-react';
import characterImage from '../assets/images/djapero_delivery_character_1779104912816.png';
import { LANGUAGES, getTranslation } from '../lib/translations';
import { signInWithGoogle, signInWithFacebook } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('djapero_lang');
    return LANGUAGES.find(l => l.id === saved) || LANGUAGES[0];
  });

  const t = (key: string) => getTranslation(currentLang.id, key);

  useEffect(() => {
    localStorage.setItem('djapero_lang', currentLang.id);
  }, [currentLang]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-4 md:p-6 font-sans overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 0.85, y: 0 }}
        className="bg-white rounded-[40px] shadow-[0_20px_70px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row w-full max-w-4xl origin-center h-auto max-h-[95vh] overflow-y-auto hide-scrollbar"
      >
        {/* Left Side: Illustration */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 md:p-14 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-50 rounded-full blur-3xl opacity-40" />
          </div>
          
          <motion.div
            animate={{ 
              y: [0, -12, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5, 
              ease: "easeInOut"
            }}
            className="relative z-10 w-full max-w-[500px] md:scale-[1.8] lg:scale-[2.1] transition-transform duration-500"
          >
            <img 
              src={characterImage} 
              alt="Djapero Delivery" 
              className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            />
          </motion.div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-7 md:p-14 flex flex-col justify-center bg-white relative">
          {/* Language Selector in Corner */}
          <div className="absolute top-6 right-6 z-[100]">
            <div className="relative">
              <button 
                onClick={() => setIsLangModalOpen(!isLangModalOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 transition-all text-xs font-bold"
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.id.toUpperCase()}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isLangModalOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangModalOpen && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setIsLangModalOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-[220px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[101]"
                    >
                      <div className="p-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <span className="font-black text-slate-800 text-[9px] uppercase tracking-wider">{t('language')}</span>
                        <button onClick={() => setIsLangModalOpen(false)}>
                          <X size={12} className="text-slate-400" />
                        </button>
                      </div>
                      <div className="p-1.5 max-h-[250px] overflow-y-auto hide-scrollbar space-y-0.5">
                        {LANGUAGES.map(lang => (
                          <button 
                            key={lang.id}
                            onClick={() => {
                              setCurrentLang(lang);
                              setIsLangModalOpen(false);
                            }}
                            className={`flex items-center gap-2.5 p-2.5 w-full rounded-xl transition-all relative group ${currentLang.id === lang.id ? 'bg-[#00E600]/10 border border-[#00E600]/20' : 'hover:bg-slate-50 border border-transparent'} `}
                          >
                            <div className="w-8 h-8 flex flex-col items-center justify-center bg-white rounded-lg font-black text-slate-800 text-[8px] shrink-0 leading-none overflow-hidden border border-slate-100 shadow-sm">
                              <img 
                                src={`https://flagcdn.com/w80/${(lang as any).code.toLowerCase()}.png`} 
                                alt={lang.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className={`text-[11px] font-black truncate ${currentLang.id === lang.id ? 'text-[#00B300]' : 'text-slate-700'}`}>{lang.name}</span>
                              <span className="text-[8px] uppercase font-bold text-slate-400">{lang.id}</span>
                            </div>
                            {currentLang.id === lang.id && (
                               <BadgeCheck size={14} className="text-[#00E600] ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mb-6 text-center md:text-left">
            <span className="text-slate-400 font-bold text-[9px] tracking-[0.2em] uppercase block mb-3">
              {t('signin_title')}
            </span>
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/logo.png" alt="Djapero Logo" className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 object-cover rounded-full shadow-lg" />
                <div className="flex flex-col items-start justify-center">
                  <h2 className="text-3xl sm:text-4xl md:text-4xl font-black tracking-tight text-[#00E600] leading-none mb-0">Djapero</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e: any) {
                  const msg = e.message || "";
                  if (msg.includes("popup-blocked") || msg.includes("cancelled")) {
                    setError("Le pop-up a été bloqué ou fermé. Essayez d'ouvrir l'application dans un nouvel onglet.");
                  } else {
                    setError(e.message);
                  }
                }
              }}
              className="flex items-center justify-center gap-3 py-3.5 border border-slate-100 rounded-[20px] hover:bg-slate-50 transition-all active:scale-95 group"
            >
              <Google size={18} className="text-slate-400 group-hover:text-[#DB4437] transition-colors" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">GOOGLE</span>
            </button>
            <button 
              type="button" 
              onClick={async () => {
                try {
                  await signInWithFacebook();
                } catch (e: any) {
                   const msg = e.message || "";
                   if (msg.includes("popup-blocked") || msg.includes("cancelled")) {
                     setError("Le pop-up Facebook a été bloqué. Essayez dans un nouvel onglet.");
                   } else {
                     setError("Facebook login must be enabled in Firebase Console. " + e.message);
                   }
                }
              }}
              className="flex items-center justify-center gap-3 py-3.5 border border-slate-100 rounded-[20px] hover:bg-slate-50 transition-all active:scale-95 group"
            >
              <Facebook size={18} className="text-slate-400 group-hover:text-[#4267B2] transition-colors" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">FACEBOOK</span>
            </button>
          </div>

          <div className="mb-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-white text-slate-400 font-black uppercase tracking-[0.15em]">{t('or_signin_with_email')}</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={async (e) => { 
            e.preventDefault(); 
            setIsLoading(true);
            setError('');
            try {
              if (!email || !/\S+@\S+\.\S+/.test(email)) {
                throw new Error("Veuillez entrer une adresse email valide (doit contenir un '@' et un domaine).");
              }
              if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
              } else {
                await signInWithEmailAndPassword(auth, email, password);
              }
            } catch (err: any) {
              setError(err.message || 'Authentication failed');
            } finally {
              setIsLoading(false);
            }
          }}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold animate-pulse">
                {error}
              </div>
            )}
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00E600] transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="text" 
                placeholder={t('email_placeholder')} 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:border-[#00E600] focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-bold text-sm"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00E600] transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                placeholder={t('password_placeholder')} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4.5 rounded-[20px] bg-slate-50/80 border-2 border-transparent focus:border-[#00E600] focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-bold text-sm"
              />
            </div>

            <div className="flex items-center justify-between px-2 pt-1">
              {!isRegistering && (
                <button type="button" className="text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">
                  {t('forgot_password')}
                </button>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 mt-4 bg-[#00E600] text-white rounded-[20px] font-black text-sm shadow-xl shadow-green-500/30 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-[0.1em] disabled:opacity-50"
            >
              {isLoading ? '...' : (isRegistering ? t('create_account') : t('signin'))}
            </button>
          </form>

          <p className="mt-10 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest leading-loose">
            {isRegistering ? 'Déjà un compte ?' : t('no_account')} <br />
            <button 
              type="button"
              className="text-[#00E600] mt-1 hover:underline underline-offset-4 decoration-2"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Se connecter' : t('create_account')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
