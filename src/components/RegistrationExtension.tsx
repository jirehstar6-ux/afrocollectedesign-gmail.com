import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Phone, User, Users, ChevronDown, Check } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';                
import { db, auth } from '../lib/firebase';

export function RegistrationExtension({ onFinish }: { onFinish: () => void }) {
  const [identity, setIdentity] = useState<'consommateur' | 'vendeur'>('consommateur');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [source, setSource] = useState('TikTok');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const sources = ['TikTok', 'YouTube', 'Facebook', 'Instagram', 'Autre'];

  const isPhoneValid = phoneNumber.trim().length >= 8;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Minimum check for phone number (at least 8 chars)
    if (!isPhoneValid) {
      alert("Veuillez entrer un numéro de téléphone valide (au moins 8 chiffres).");
      return;
    }

    setIsSubmitting(true);
    
    // 1. Essential: save to localStorage IMMEDIATELY for instant user access
    localStorage.setItem('djapero_identity', identity);
    localStorage.setItem('djapero_phone', phoneNumber);
    localStorage.setItem('djapero_source', source);

    // 2. Fire network requests in background (Don't await them)
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'private', 'profile'), {
        identity, phoneNumber, source, email: auth.currentUser.email, timestamp: new Date().toISOString()
      }).catch(err => console.warn("Background Firestore sync failed:", err));
    }

    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity, 
        phoneNumber, 
        source, 
        email: auth.currentUser?.email || 'N/A',
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.warn("Background API sync failed:", err));

    // 3. Immediate redirection
    onFinish();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] shadow-[0_20px_70px_rgba(0,0,0,0.08)] p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Complétez votre profil</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vous êtes ?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIdentity('consommateur')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${identity === 'consommateur' ? 'border-[#00E600] bg-emerald-50' : 'border-slate-100'}`}
              >
                <User className={identity === 'consommateur' ? 'text-[#00E600]' : 'text-slate-400'} />
                <span className="text-xs font-bold">Consommateur</span>
              </button>
              <button
                type="button"
                onClick={() => setIdentity('vendeur')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${identity === 'vendeur' ? 'border-[#00E600] bg-emerald-50' : 'border-slate-100'}`}
              >
                <Users className={identity === 'vendeur' ? 'text-[#00E600]' : 'text-slate-400'} />
                <span className="text-xs font-bold">Vendeur</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Numéro de téléphone</label>
            <div className="absolute inset-y-0 left-4 top-7 flex items-center pointer-events-none text-slate-400">
              <Phone size={18} />
            </div>
            <input 
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 rounded-[20px] bg-slate-50 border-2 transition-all outline-none font-bold text-sm ${isPhoneValid ? 'border-[#00E600]' : 'border-transparent focus:border-[#00E600]'}`}
              placeholder="+225 XX XX XX XX XX"
            />
            {isPhoneValid && (
              <div className="absolute right-4 top-10 text-[#00E600] animate-in zoom-in duration-300">
                <div className="bg-[#00E600]/10 p-1 rounded-full">
                  <Check size={14} strokeWidth={4} />
                </div>
              </div>
            )}
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comment avez-vous trouvé Djapero ?</label>
             <div className="relative">
               <select 
                 value={source}
                 onChange={(e) => setSource(e.target.value)}
                 className="w-full px-6 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:border-[#00E600] outline-none font-bold text-sm appearance-none"
               >
                 {sources.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                 <ChevronDown size={18} />
               </div>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 text-white rounded-[20px] font-black text-sm shadow-xl transition-all uppercase tracking-[0.1em] flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-[#00E600] shadow-green-500/30 hover:scale-[1.01] active:scale-95'}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Validation en cours...
              </>
            ) : (
              'Valider'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
