
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, PauseCircle, BookOpen, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { getSurah } from '../utils/quranData';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { useLanguage } from '../context/LanguageContext';
import { useReading } from '../context/ReadingContext';
import { useUserStats } from '../context/UserStatsContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';

const SurahDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { markPageRead, todayLog } = useReading();
  const { recordQuranReading } = useUserStats();
  const { isPlaying, currentSource, play, pause, stop } = useAudio();
  
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingMode, setReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('quranFontSize') || '32', 10);
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('quranFontSize', fontSize);
  }, [fontSize]);

  const isOnline = useOnlineStatus();
  
  // Intersection Observer for Page Tracking
  const observer = useRef(null);
  const pageRefs = useRef({});

  useEffect(() => {
    // Fetch from local data
    setLoading(true);
    getSurah(id)
      .then(data => {
        if (data) {
          setSurah(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const [pageIndex, setPageIndex] = useState(0);

  // Group ayahs by page for the Book Simulator
  const bookPages = useMemo(() => {
    if (!surah) return [];
    const grouped = {};
    surah.arabic.ayahs.forEach((ayah, index) => {
      const pageNum = ayah.page;
      if (!grouped[pageNum]) grouped[pageNum] = [];
      grouped[pageNum].push({
        ...ayah,
        englishText: surah.english.ayahs[index]?.text
      });
    });
    return Object.entries(grouped).map(([page, ayahs]) => ({
      page: parseInt(page),
      ayahs
    })).sort((a, b) => a.page - b.page);
  }, [surah]);

  useEffect(() => {
    if (bookPages[pageIndex]) {
      markPageRead(bookPages[pageIndex].page);
      // Record hasanat for each ayah on this page
      bookPages[pageIndex].ayahs.forEach(ayah => {
        // Unique ID for each ayah: surahNumber_ayahNumber
        const ayahId = `quran_${surah.number}_${ayah.numberInSurah}`;
        recordQuranReading(ayah.text, ayahId);
      });
    }
  }, [pageIndex, bookPages, markPageRead, recordQuranReading, surah?.number]);

  const nextPage = () => {
    if (pageIndex < bookPages.length - 1) setPageIndex(prev => prev + 1);
  };

  const prevPage = () => {
    if (pageIndex > 0) setPageIndex(prev => prev - 1);
  };

  const playAyah = (ayah) => {
    const pad = (n, len) => n.toString().padStart(len, '0');
    const sNum = pad(parseInt(id), 3);
    const aNum = pad(ayah.numberInSurah, 3);
    
    // Multi-source Ayah-by-Ayah Audio (Alafasy)
    const urls = [
      `https://mirrors.quranicaudio.com/everyayah/Alafasy_128kbps/${sNum}${aNum}.mp3`,
      `https://verses.quran.com/Alafasy/mp3/${sNum}${aNum}.mp3`,
      `https://everyayah.com/data/Alafasy_128kbps/${sNum}${aNum}.mp3`
    ];
    
    play(urls, { 
      type: 'ayah', 
      surahNumber: parseInt(id), 
      ayahNumber: ayah.numberInSurah,
      id: `${id}:${ayah.numberInSurah}` 
    });
  };

  const toggleAudio = () => {
    const isCurrentPlaying = currentSource?.type === 'surah' && currentSource?.surahNumber === parseInt(id);
    const isPlayingThisSurah = isCurrentPlaying && isPlaying;
    
    if (isPlayingThisSurah) {
      pause();
    } else {
      const pad = (n) => n.toString().padStart(3, '0');
      const surahNumber = pad(id);
      
      const urls = [
        `https://download.quranicaudio.com/quran/mishari_rashid_al_afasy/${surahNumber}.mp3`,
        `https://mirrors.quranicaudio.com/quran/mishari_rashid_al_afasy/${surahNumber}.mp3`,
        `https://server7.mp3quran.net/afs/${surahNumber}.mp3`,
        `https://server8.mp3quran.net/afs/${surahNumber}.mp3`,
        `https://server11.mp3quran.net/afs/${surahNumber}.mp3`
      ];

      play(urls, { type: 'surah', surahNumber: parseInt(id) });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('loading')}...</p>
      </div>
    );
  }

  if (!surah || bookPages.length === 0) return <div className="text-center py-10">{t('surahNotFound')}</div>;

  const currentPage = bookPages[pageIndex];

  return (
    <div className="fixed inset-0 bg-[#fbf9f4] z-[9999] flex flex-col overflow-hidden">
      {/* Mushaf Header - Elegant and Traditional */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-[100] bg-white/90 backdrop-blur-md border-b border-amber-200/40 text-emerald-950 shadow-sm">
        <Link to="/quran" className="p-3 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100/50">
          <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </Link>
        
        <div className="text-center flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-quran text-emerald-950 leading-none drop-shadow-sm">{surah.arabic.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="h-px w-4 bg-amber-200/60" />
            <span className="text-[9px] sm:text-[10px] font-black text-amber-800/50 uppercase tracking-[0.3em]">
              {t('page')} {currentPage.page} • {surah.arabic.englishName}
            </span>
            <span className="h-px w-4 bg-amber-200/60" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-emerald-50 rounded-2xl p-1 border border-emerald-100 mr-2">
            <button 
              onClick={() => setFontSize(s => Math.max(s - 4, 16))}
              className="p-2 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all"
              title="Decrease Font Size"
            >
              <Minus size={18} />
            </button>
            <span className="px-2 text-xs font-black min-w-[3rem] text-center text-emerald-900">{fontSize}px</span>
            <button 
              onClick={() => setFontSize(s => Math.min(s + 4, 100))}
              className="p-2 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all"
              title="Increase Font Size"
            >
              <Plus size={18} />
            </button>
          </div>

          <button 
            onClick={toggleAudio}
            disabled={!isOnline}
            className={`p-3 rounded-2xl transition-all border shadow-sm ${
              isOnline 
                ? (currentSource?.type === 'surah' && currentSource?.surahNumber === parseInt(id) && isPlaying)
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20' 
                  : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                : 'opacity-20 bg-slate-100 border-slate-200'
            }`}
          >
            {(currentSource?.type === 'surah' && currentSource?.surahNumber === parseInt(id) && isPlaying) ? <PauseCircle size={24} className="animate-pulse" /> : <PlayCircle size={24} />}
          </button>
        </div>
      </div>

      {/* Mushaf Viewport */}
      <div className="flex-1 relative bg-[#fbf9f4] w-full max-w-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={language === 'ar' ? -1 : 1}>
          <motion.div 
            key={pageIndex}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              const threshold = 50;
              if (swipe < -threshold) {
                language === 'ar' ? prevPage() : nextPage();
              } else if (swipe > threshold) {
                language === 'ar' ? nextPage() : prevPage();
              }
            }}
            initial={{ opacity: 0, x: language === 'ar' ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? -100 : 100 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute inset-0 flex flex-col overflow-hidden w-full"
          >
            {/* Fine Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            
            {/* Book Effect Shadows */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/5 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-amber-900/5 pointer-events-none z-20" />

            {/* Content Area */}
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden pt-32 pb-44 px-6 sm:px-16 md:px-24 custom-scrollbar relative z-10 scroll-smooth w-full"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="max-w-4xl mx-auto w-full">
                {/* Surah Header - Ornate Traditional Frame */}
                {pageIndex === 0 && (
                  <div className="text-center mb-16 relative py-12 px-6 animate-fade-in">
                    <div className="absolute inset-0 border-[1px] border-amber-200/60 rounded-[4rem] scale-[1.05]" />
                    <div className="absolute inset-0 border-[3px] border-double border-amber-200/40 rounded-[3.5rem]" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-200" />
                        <span className="text-amber-800/40 text-[10px] font-black uppercase tracking-[0.4em]">Surah</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-200" />
                      </div>
                      <h2 className="font-quran text-7xl sm:text-8xl md:text-9xl text-emerald-950 mb-4 drop-shadow-sm selection:bg-emerald-100">{surah.arabic.name}</h2>
                      <p className="text-[11px] font-black text-amber-800/30 uppercase tracking-[0.6em] mb-8">{surah.arabic.englishName}</p>
                      {surah.arabic.number !== 1 && surah.arabic.number !== 9 && (
                        <div className="relative inline-block px-10">
                           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-px bg-amber-100" />
                           <p className="font-quran text-3xl sm:text-4xl text-emerald-900/70" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-px bg-amber-100" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Justified Quranic Text Flow */}
                <div 
                  className="font-quran text-slate-900 text-justify leading-[2.5] sm:leading-[3.2] md:leading-[3.8] w-full selection:bg-emerald-50"
                  style={{ 
                    fontSize: `${fontSize}px`, 
                    direction: 'rtl',
                    textAlignLast: 'center'
                  }}
                >
                  {currentPage.ayahs.map((ayah, i) => {
                    let text = ayah.text;
                    const isPlayingThisAyah = currentSource?.id === `${id}:${ayah.numberInSurah}` && isPlaying;

                    if (ayah.numberInSurah === 1 && surah.arabic.number !== 1 && surah.arabic.number !== 9) {
                        text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
                    }
                    return (
                      <span 
                        key={ayah.number} 
                        className="inline group cursor-pointer"
                        onClick={() => playAyah(ayah)}
                      >
                        <span className={`transition-colors duration-300 ${isPlayingThisAyah ? 'text-emerald-600 font-bold' : 'hover:text-emerald-700'}`}>
                          {text}
                        </span>
                        <span className="inline-flex items-center justify-center relative w-14 h-14 sm:w-16 sm:h-16 mx-2 sm:mx-4 align-middle">
                           <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full transition-all duration-500 ${isPlayingThisAyah ? 'text-emerald-600 opacity-100' : 'text-amber-200/40 opacity-60 group-hover:opacity-100 group-hover:text-emerald-200'}`}>
                              <path 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                d="M50 5 L63 25 L85 25 L85 47 L105 60 L85 73 L85 95 L63 95 L50 115 L37 95 L15 95 L15 73 L-5 60 L15 47 L15 25 L37 25 Z"
                                transform="scale(0.8) translate(12, 12)"
                              />
                              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4" />
                              <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1" />
                              <path fill="currentColor" d="M15 50 L25 45 L25 55 Z" />
                              <path fill="currentColor" d="M85 50 L75 45 L75 55 Z" />
                              <path fill="currentColor" d="M50 15 L45 25 L55 25 Z" />
                              <path fill="currentColor" d="M50 85 L45 75 L55 75 Z" />
                           </svg>
                           <span className={`relative text-[11px] sm:text-[12px] font-sans font-black transition-colors duration-500 mt-0.5 ${isPlayingThisAyah ? 'text-emerald-800' : 'text-amber-900/50 group-hover:text-emerald-900'}`}>
                              {ayah.numberInSurah}
                           </span>
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls - Mushaf Aesthetic */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col items-center gap-6 z-[100] bg-gradient-to-t from-[#fbf9f4] via-[#fbf9f4]/95 to-transparent">
        <div className="w-full max-w-lg h-1.5 bg-amber-100/40 rounded-full overflow-hidden shadow-inner border border-amber-200/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((pageIndex + 1) / bookPages.length) * 100}%` }}
            className="h-full bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          />
        </div>
        
        <div className="flex items-center gap-6 sm:gap-12">
           <button 
             onClick={prevPage} 
             disabled={pageIndex === 0}
             className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-amber-100 hover:bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-900 disabled:opacity-0 transition-all shadow-sm active:scale-95"
           >
             <ChevronLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
           </button>
           
           <div className="bg-white px-6 sm:px-10 py-3 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center min-w-[120px]">
              <span className="text-[9px] font-black text-amber-800/30 uppercase tracking-[0.4em] mb-1">
                {t('page')}
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-950 tabular-nums">
                {pageIndex + 1} <span className="text-amber-200/60 mx-1">/</span> {bookPages.length}
              </span>
           </div>

           <button 
             onClick={nextPage} 
             disabled={pageIndex === bookPages.length - 1}
             className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-amber-100 hover:bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-900 disabled:opacity-0 transition-all shadow-sm active:scale-95"
           >
             <ChevronRight size={24} className={language === 'ar' ? 'rotate-180' : ''} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default SurahDetail;
