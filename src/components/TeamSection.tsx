import React, { useState, useEffect } from 'react';
import { Linkedin, Github, X, Phone, Users } from 'lucide-react';
import { getTranslation } from '../lib/translations';

const defaultTeam: any[] = [];

export default function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [team, setTeam] = useState<any[]>(defaultTeam);
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('djapero_lang') || 'fr');

  const t = (key: string) => getTranslation(currentLang, key);

  useEffect(() => {
    const loadTeam = () => {
      // Favor local storage updated by top-level listeners
      const saved = JSON.parse(localStorage.getItem('djapero_team') || 'null');
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setTeam(saved);
      } else {
        // Fallback to API only if local storage is empty
        fetch('/api/team')
          .then(r => r.json())
          .then(data => {
            if (data && data.length > 0) {
              setTeam(data);
              localStorage.setItem('djapero_team', JSON.stringify(data));
            } else {
              setTeam(defaultTeam);
              localStorage.setItem('djapero_team', JSON.stringify(defaultTeam));
            }
          })
          .catch(() => setTeam(defaultTeam));
      }
    };

    loadTeam();

    const handleStorage = () => {
      // When storage event fires (e.g. from Dashboard real-time listener), just reload from local storage
      const saved = JSON.parse(localStorage.getItem('djapero_team') || 'null');
      if (saved) setTeam(saved);
      setCurrentLang(localStorage.getItem('djapero_lang') || 'fr');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="bg-[#EAECE8] min-h-screen p-6 sm:p-8 md:p-12 font-sans text-slate-900 rounded-[2rem] mx-auto my-4 w-full max-w-[1240px] shadow-sm">
      <div className="w-full mx-auto">
        {/* Header Tag */}
        <div className="flex items-center gap-2 border border-slate-900 rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-widest w-fit mb-6 sm:mb-8">
          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45" /> {t('who_we_are')}
        </div>

        {/* Main Title */}
        <div className="text-4xl sm:text-5xl lg:text-7xl font-black mb-10 tracking-tight text-slate-900 uppercase">
          {t('team_title').split(' ').slice(0, 2).join(' ')}<br />
          {t('team_title').split(' ').slice(2).join(' ')}
        </div>

        {/* Description Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 mb-16 border-t border-slate-300 pt-10 mt-6">
          <div className="font-bold text-sm lg:text-base max-w-sm uppercase tracking-tight leading-snug">
            {t('team_desc_1')}
          </div>
          <div className="text-slate-600 space-y-6 max-w-2xl text-sm lg:text-base font-medium leading-relaxed">
            <p>
              {t('team_desc_2')}
            </p>
          </div>
        </div>

        {/* Team Grid */}
        <div className="columns-4 sm:columns-5 md:columns-6 lg:columns-7 xl:columns-8 gap-3 sm:gap-4 lg:gap-5 space-y-3 sm:space-y-4 lg:space-y-5">
          {team.map((member, idx) => (
            <div 
              key={idx} 
              className="break-inside-avoid flex flex-col mb-4 cursor-pointer group"
              onClick={() => setSelectedMember(member)}
            >
              {/* Card Content */}
              {member.special ? (
                <div className="aspect-[3/4] sm:aspect-square md:aspect-[4/5] bg-[#B0F864] rounded-t-2xl rounded-b-lg mb-2 p-3 lg:p-4 flex flex-col justify-between relative shadow-sm border border-black/5 group-hover:shadow-md transition-shadow">
                  <div className="flex justify-end gap-1.5 text-slate-900">
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[#B0F864]">
                      <Linkedin className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[#B0F864]">
                      <Github className="w-2.5 h-2.5 fill-current" />
                    </div>
                  </div>
                  <div className="text-slate-900 font-medium text-[9px] sm:text-[10px] lg:text-xs leading-tight pr-2">
                    {member.quote}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-t-2xl rounded-b-lg mb-2 overflow-hidden border border-black/5 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-0.5 aspect-[3/4] relative flex items-center justify-center">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Users className="text-slate-400" size={32} />
                  )}
                </div>
              )}
              
              {/* Name Tag & Role */}
              <div className="px-1 flex flex-col items-start gap-0.5">
                <div className="inline-flex items-center border-[1.5px] border-slate-900 rounded-full px-2 lg:px-3 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-900 bg-transparent">
                  {member.name}
                </div>
                <div className="text-[8px] sm:text-[9px] text-slate-500 font-medium px-1.5">
                  {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-[300px] sm:max-w-xl max-h-[90vh] md:max-h-[70vh] overflow-y-auto md:overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/85 backdrop-blur-md rounded-full text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
              onClick={() => setSelectedMember(null)}
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Modal Image/Left Side */}
            <div className="w-full md:w-1/2 bg-slate-100 flex-shrink-0 relative h-72 sm:h-96 md:h-auto md:min-h-full">
              {selectedMember.special ? (
                <div className="absolute inset-0 bg-[#B0F864] p-5 md:p-8 flex flex-col justify-center">
                  <div className="text-slate-900 font-bold text-base md:text-xl lg:text-2xl leading-snug">
                    {selectedMember.quote}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {selectedMember.image ? (
                    <img 
                      src={selectedMember.image} 
                      alt={selectedMember.name} 
                      className="w-full h-full object-cover object-top" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Users className="text-slate-400" size={48} />
                  )}
                </div>
              )}
            </div>

            {/* Modal Content/Right Side */}
            <div className="w-full md:w-1/2 p-5 md:p-8 lg:p-10 flex flex-col justify-center">
              <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-1">
                {selectedMember.name}
              </h3>
              <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
                {selectedMember.role}
              </p>
              
              <div className="space-y-3 text-xs md:text-sm text-slate-600 mb-5">
                <p>
                  {t('expertise').replace('Specialiste', `${selectedMember.name}, specialiste`)}
                </p>
                {selectedMember.description && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-800 mb-0.5 text-xs">{t('daily_work')}</p>
                    <p className="text-slate-600 leading-relaxed">{selectedMember.description}</p>
                  </div>
                )}
                {selectedMember.phone && (
                  <div className="mt-2 flex items-center gap-2 text-slate-800 font-medium text-xs">
                    <Phone className="w-3.5 h-3.5 text-[#00E600]" />
                    {selectedMember.phone}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00E600] hover:bg-[#00D600] text-white font-bold rounded-full transition-colors text-sm">
                  {t('view_portfolio')}
                </button>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                    <Github className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
