import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Settings, Bookmark, Trophy, Home, Maximize2, Minimize2, Volume2, Plus, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import quranData from '../../data/quran-uthmani.json';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';

const ReadingMode = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { surahNumber } = useParams();
  const { play, currentSource, isPlaying } = useAudio();
  const isChallengeMode = !!surahNumber;
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Load flattened ayahs from JSON
  const allAyahs = useMemo(() => {
    const flattened = [];
    quranData.data.surahs.forEach(surah => {
      const totalAyahs = surah.ayahs.length;
      surah.ayahs.forEach(ayah => {
        flattened.push({
          ...ayah,
          surahName: surah.name,
          surahNumber: surah.number,
          englishName: surah.englishName,
          totalAyahs: totalAyahs
        });
      });
    });
    return flattened;
  }, []);

  // State
  const [currentAyahIndex, setCurrentAyahIndex] = useState(() => {
    if (isChallengeMode) {
        const index = allAyahs.findIndex(a => a.surahNumber === parseInt(surahNumber, 10));
        return index !== -1 ? index : 0;
    }
    const saved = localStorage.getItem('quranCurrentAyahIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (!isChallengeMode) {
        localStorage.setItem('quranCurrentAyahIndex', currentAyahIndex);
        const ayah = allAyahs[currentAyahIndex];
        if (ayah) {
            localStorage.setItem('quranCurrentPage', ayah.page);
        }
    } else { 
        const ayah = allAyahs[currentAyahIndex];
        if (ayah) {
            const today = new Date();
            const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '{}');
            const isLastAyah = ayah.numberInSurah === ayah.totalAyahs;
            
            if (isLastAyah && ayah.surahNumber === 18 && today.getDay() === 5) {
              completedChallenges['friday-kahf'] = todayKey;
              setShowCompletion(true);
            }
            if (isLastAyah && ayah.surahNumber === 67) {
              completedChallenges['nightly-mulk'] = todayKey;
              setShowCompletion(true);
            }
            localStorage.setItem('completedChallenges', JSON.stringify(completedChallenges));
        }
    }
  }, [currentAyahIndex, allAyahs, isChallengeMode]);

  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('quranFontSize') || '32', 10);
  });

  const playAyah = (ayah) => {
    const pad = (n, len) => n.toString().padStart(len, '0');
    const sNum = pad(ayah.surahNumber, 3);
    const aNum = pad(ayah.numberInSurah, 3);
    
    // Alafasy Ayah-by-Ayah Audio
    const url = `https://everyayah.com/data/Alafasy_128kbps/${sNum}${aNum}.mp3`;
    
    play(url, { 
      type: 'ayah', 
      surahNumber: ayah.surahNumber, 
      ayahNumber: ayah.numberInSurah,
      id: `${ayah.surahNumber}:${ayah.numberInSurah}` 
    });
  };

  useEffect(() => {
    localStorage.setItem('quranFontSize', fontSize);
  }, [fontSize]);

  const nextAyah = () => {
    const ayah = allAyahs[currentAyahIndex];
    const isLastOfSurah = ayah && ayah.numberInSurah === ayah.totalAyahs;
    if (isChallengeMode && isLastOfSurah) {
        setShowCompletion(true);
        return;
    }
    if (currentAyahIndex < allAyahs.length - 1) {
        setCurrentAyahIndex(prev => prev + 1);
    }
  };

  const prevAyah = () => {
    if (currentAyahIndex > 0) {
        setCurrentAyahIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'ArrowRight') nextAyah();
          else if (e.key === 'ArrowLeft') prevAyah();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentAyahIndex, language]);

  const currentAyah = allAyahs[currentAyahIndex];
  
  const surahAyahs = useMemo(() => {
    if (!currentAyah) return [];
    return allAyahs.filter(a => a.surahNumber === currentAyah.surahNumber);
  }, [currentAyah, allAyahs]);

  const surahEndRef = useRef(null);

  // Auto-scroll to current ayah if needed
  const ayahRefs = useRef({});

  useEffect(() => {
    if (ayahRefs.current[currentAyahIndex]) {
        ayahRefs.current[currentAyahIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentAyahIndex]);

  if (!currentAyah) return <div className="flex items-center justify-center h-screen bg-[#fffcf2] font-black uppercase tracking-widest text-emerald-800">{t('loading')}...</div>;

  const isSurahStart = currentAyah.numberInSurah === 1;
  const showBismillah = isSurahStart && currentAyah.surahNumber !== 1 && currentAyah.surahNumber !== 9;

  let displayText = currentAyah.text;
  if (isSurahStart && currentAyah.surahNumber !== 1) {
      displayText = displayText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
  }

  return (
    <div className="fixed inset-0 bg-[#fffcf2] text-slate-800 font-serif flex flex-col overflow-hidden z-[9999]">
      
      <AnimatePresence>
        {showCompletion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1000] bg-emerald-950/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[4rem] p-10 sm:p-16 max-w-lg w-full text-center shadow-2xl"
            >
              <div className="w-28 h-28 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Trophy className="text-amber-600" size={56} />
              </div>
              <h2 className="text-4xl font-black text-emerald-950 mb-4 uppercase tracking-tighter">
                {t('missionComplete') || 'Mission Complete!'}
              </h2>
              <p className="text-slate-500 font-bold mb-10 text-lg">
                {t('challengeCompletedDesc') || 'MashaAllah! You have completed this reading challenge.'}
              </p>
              <div className="space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                  className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                >
                  <Home size={24} />
                  {t('backToHome')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isFullScreen && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="h-20 flex-shrink-0 bg-emerald-900 text-white px-6 shadow-2xl flex justify-between items-center z-[100] relative border-b border-emerald-800/50"
          >
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(isChallengeMode ? '/' : '/quran')} 
              className="p-3 hover:bg-emerald-800 rounded-2xl transition-all"
            >
              <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
            </motion.button>
            
            <div className="text-center flex-1 min-w-0 px-4">
                <div className="flex flex-col items-center">
                  <h1 className="text-xl sm:text-2xl font-black truncate tracking-tighter uppercase">{currentAyah.surahName}</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-300 font-black uppercase tracking-[0.2em] opacity-60">
                      {t('ayah')} {currentAyah.numberInSurah} • {t('page')} {currentAyah.page}
                    </span>
                    {isChallengeMode && (
                      <span className="bg-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-tighter shadow-lg shadow-amber-500/20">
                        {t('challenge')}
                      </span>
                    )}
                  </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 rounded-2xl p-1 border border-white/5 mr-2">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFontSize(s => Math.max(s - 4, 16))}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                    title="Decrease Font Size"
                  >
                    <Minus size={18} />
                  </motion.button>
                  <span className="px-2 text-xs font-black min-w-[3rem] text-center">{fontSize}px</span>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFontSize(s => Math.min(s + 4, 100))}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                    title="Increase Font Size"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullScreen(true)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                >
                    <Maximize2 size={20} />
                </motion.button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto bg-[#fffcf2] relative touch-pan-y scroll-smooth custom-scrollbar">
        <div className="min-h-full w-full flex flex-col items-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-4xl mx-auto py-12">
              
              {isSurahStart && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                  >
                      <div className="inline-block bg-white px-12 py-8 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-emerald-50 mb-8 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-emerald-50/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left" />
                          <h2 className="font-arabic text-6xl text-emerald-950 mb-3 relative z-10">{currentAyah.surahName}</h2>
                          <div className="flex items-center justify-center gap-3 text-[11px] text-emerald-600 font-black uppercase tracking-[0.3em] relative z-10">
                              <span>{currentAyah.englishName}</span>
                              <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
                              <span>{currentAyah.totalAyahs} {t('ayahs')}</span>
                          </div>
                      </div>
                      {showBismillah && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="font-arabic text-5xl text-emerald-800/80 my-12 drop-shadow-xl" 
                            dir="rtl"
                          >
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </motion.p>
                      )}
                  </motion.div>
              )}

              <div className="bg-white rounded-[4rem] p-10 sm:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-emerald-50/50 group flex flex-col items-center">
                   {isFullScreen && (
                     <button 
                        onClick={() => setIsFullScreen(false)}
                        className="absolute top-8 right-8 p-4 bg-slate-50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                     >
                        <Minimize2 size={24} />
                     </button>
                   )}

                   <div className="flex flex-wrap justify-center gap-x-4 gap-y-12" dir="rtl">
                      {surahAyahs.map((ayah) => {
                          const isCurrent = ayah.number === currentAyah.number;
                          const isPlayingThisAyah = currentSource?.id === `${ayah.surahNumber}:${ayah.numberInSurah}` && isPlaying;
                          const index = allAyahs.findIndex(a => a.number === ayah.number);
                          
                          let ayahText = ayah.text;
                          if (ayah.numberInSurah === 1 && ayah.surahNumber !== 1) {
                              ayahText = ayahText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
                          }

                          return (
                            <div 
                              key={ayah.number}
                              ref={el => ayahRefs.current[index] = el}
                              onClick={() => {
                                setCurrentAyahIndex(index);
                                playAyah(ayah);
                              }}
                              className={`relative transition-all duration-500 cursor-pointer p-4 rounded-3xl ${
                                isCurrent 
                                  ? 'bg-emerald-50/50 ring-1 ring-emerald-100 scale-[1.02]' 
                                  : 'hover:bg-slate-50/50'
                              }`}
                            >
                                {isPlayingThisAyah && (
                                  <motion.div 
                                    layoutId="playing-indicator"
                                    className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white p-1.5 rounded-full shadow-lg z-10"
                                  >
                                    <Volume2 size={12} className="animate-pulse" />
                                  </motion.div>
                                )}
                                <p 
                                   className={`font-quran leading-[2.8] text-center selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-500 ${
                                     isPlayingThisAyah ? 'text-emerald-600 font-bold' : 'text-emerald-950'
                                   }`}
                                   style={{ 
                                     fontSize: `${fontSize}px`
                                   }}
                                 >
                                  {ayahText}
                                  <span className="inline-flex items-center justify-center mx-4">
                                      <span className="relative w-14 h-14 flex items-center justify-center">
                                          <svg viewBox="0 0 100 100" className={`w-full h-full transition-all duration-500 ${isCurrent ? 'text-emerald-600' : 'text-amber-200/40'}`}>
                                              {/* Traditional Rub el Hizb (8-point star) Base */}
                                              <path 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2.5" 
                                                d="M50 5 L63 25 L85 25 L85 47 L105 60 L85 73 L85 95 L63 95 L50 115 L37 95 L15 95 L15 73 L-5 60 L15 47 L15 25 L37 25 Z"
                                                transform="scale(0.8) translate(12, 12)"
                                              />
                                              {/* Inner Circle with Ornate Dots */}
                                              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4" />
                                              <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1" />
                                              
                                              {/* Traditional Side Accents */}
                                              <path fill="currentColor" d="M15 50 L25 45 L25 55 Z" />
                                              <path fill="currentColor" d="M85 50 L75 45 L75 55 Z" />
                                              <path fill="currentColor" d="M50 15 L45 25 L55 25 Z" />
                                              <path fill="currentColor" d="M50 85 L45 75 L55 75 Z" />
                                          </svg>
                                          <span className={`absolute inset-0 flex items-center justify-center text-[12px] font-bold font-sans mt-0.5 ${isCurrent ? 'text-emerald-800' : 'text-amber-900/70'}`}>
                                              {ayah.numberInSurah}
                                          </span>
                                      </span>
                                  </span>
                                </p>
                            </div>
                          );
                      })}
                   </div>
                   
                   <div className="mt-20 h-1 w-32 bg-gradient-to-r from-transparent via-emerald-50 to-transparent rounded-full" />
              </div>

              <div className="mt-16 flex justify-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFontSize(s => Math.min(s + 4, 100))}
                    className="w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-emerald-600 font-black text-xl flex items-center justify-center hover:border-emerald-200 transition-all"
                  >
                    A+
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFontSize(s => Math.max(s - 4, 16))}
                    className="w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-emerald-600 font-black text-xl flex items-center justify-center hover:border-emerald-200 transition-all"
                  >
                    A-
                  </motion.button>
              </div>
          </div>
        </div>
      </main>

      <motion.footer 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="h-28 flex-shrink-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 flex items-center justify-between shadow-2xl z-[100] relative"
      >
        <motion.button 
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevAyah}
            disabled={currentAyahIndex === 0}
            className="w-16 h-16 rounded-[2rem] bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-all duration-300 flex items-center justify-center"
        >
            <ChevronLeft size={36} className={language === 'ar' ? 'rotate-180' : ''} />
        </motion.button>

        <div className="flex flex-col items-center flex-1 px-8 max-w-md">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4 shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentAyah.numberInSurah / currentAyah.totalAyahs) * 100}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.3em] bg-emerald-50 px-4 py-1.5 rounded-full">
                {currentAyah.numberInSurah} / {currentAyah.totalAyahs}
              </span>
            </div>
        </div>

        <motion.button 
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextAyah}
            disabled={currentAyahIndex === allAyahs.length - 1}
            className="w-16 h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 disabled:opacity-20 transition-all duration-300 flex items-center justify-center"
        >
            <ChevronRight size={36} className={language === 'ar' ? 'rotate-180' : ''} />
        </motion.button>
      </motion.footer>
    </div>
  );
};

export default ReadingMode;
