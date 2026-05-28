import { motion } from 'motion/react';
import { Bike } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTranslation } from '../lib/translations';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [currentLangId] = useState(() => localStorage.getItem('djapero_lang') || 'fr');
  const t = (key: string) => getTranslation(currentLangId, key);

  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-djapero-dark flex flex-col items-center justify-center text-white z-50"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "backOut" }}
        className="mb-6"
      >
        <img src="/logo.png" alt="Djapero Logo" className="w-32 h-32 object-cover rounded-full shadow-xl" />
      </motion.div>
      <h1 className="text-4xl font-black tracking-tighter">DJAPERO</h1>
      <p className="text-base opacity-80 mt-2">{t('food_delivery')}</p>
    </motion.div>
  );
}
