import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Settings, Bookmark, Trophy, Home, Maximize2, Minimize2, PlayCircle, PauseCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import quranData from '../../data/quran-uthmani.json';
import { motion, AnimatePresence } from 'framer-motion';

const ReadingMode = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { surahNumber } = useParams();
  const isChallengeMode = !!surahNumber;
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

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

  // Group ayahs by page
  const pages = useMemo(() => {
    const grouped = {};
    allAyahs.forEach(ayah => {
      if (!grouped[ayah.page]) {
        grouped[ayah.page] = [];
      }
      grouped[ayah.page].push(ayah);
    });
    return Object.entries(grouped)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([pageNumber, ayahs]) => ({
        pageNumber: parseInt(pageNumber),
        ayahs
      }));
  }, [allAyahs]);

  // State
  const [currentPage, setCurrentPage] = useState(() => {
    if (isChallengeMode) {
        const index = allAyahs.findIndex(a => a.surahNumber === parseInt(surahNumber, 10));
        return index !== -1 ? allAyahs[index].page : 1;
    }
    const saved = localStorage.getItem('quranCurrentPage');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [currentAyahIndex, setCurrentAyahIndex] = useState(() => {
    const saved = localStorage.getItem('quranCurrentAyahIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [activeAyah, setActiveAyah] = useState(null);

  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (!isChallengeMode) {
        localStorage.setItem('quranCurrentPage', currentPage);
        localStorage.setItem('quranCurrentAyahIndex', currentAyahIndex);
    }
  }, [currentPage, currentAyahIndex, isChallengeMode]);

  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('quranFontSize') || '24', 10);
  });

  useEffect(() => {
    localStorage.setItem('quranFontSize', fontSize);
  }, [fontSize]);

  const nextPage = () => {
    // In RTL book, next page means decreasing page number (going left)?
    // Actually, usually digital Qurans: Right Arrow -> Next Page (Higher Number)
    // But physically, next page is to the left.
    // Let's stick to logical Next: Higher Page Number
    if (currentPage < 604) {
        setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
    }
  };



  const toggleAudio = (ayah) => {
    if (activeAyah?.number === ayah.number && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setActiveAyah(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Format: 001001.mp3 (Surah 3 digits, Ayah 3 digits)
      const surahPad = String(ayah.surahNumber).padStart(3, '0');
      const ayahPad = String(ayah.numberInSurah).padStart(3, '0');
      const url = `https://everyayah.com/data/Alafasy_128kbps/${surahPad}${ayahPad}.mp3`;
      
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setActiveAyah(null);
      };
      audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
      setActiveAyah(ayah);
    }
  };

  const pageData = pages.find(p => p.pageNumber === currentPage);
  const currentAyah = pageData?.ayahs[currentAyahIndex];

  const goToNextAyah = () => {
    if (pageData && currentAyahIndex < pageData.ayahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else if (currentPage < 604) {
      setCurrentPage(prev => prev + 1);
      setCurrentAyahIndex(0);
    }
  };

  const goToPrevAyah = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
    } else if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // This needs to be smarter, to go to the *last* ayah of the previous page
      const prevPageData = pages.find(p => p.pageNumber === currentPage - 1);
      setCurrentAyahIndex(prevPageData?.ayahs.length - 1 || 0);
    }
  };

  // Get current page data
  // Logic to show 2 pages on large screens
  // For simplicity in this version, we will center the single page beautifully like a real Mushaf
  
  if (!pageData || !currentAyah) return <div className="flex items-center justify-center h-screen bg-[#fffcf2] text-emerald-800">{t('loading')}...</div>;

  return (
    <div className="fixed inset-0 bg-[#2f2f2f] flex flex-col overflow-hidden z-[9999]">
      
      {/* Header */}
      <AnimatePresence>
        {!isFullScreen && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="h-16 flex-shrink-0 bg-[#1a1a1a] text-white px-4 shadow-md flex justify-between items-center z-[100] relative border-b border-[#333]"
          >
            <div className="flex items-center gap-4">
                <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(isChallengeMode ? '/' : '/quran')} 
                className="p-2 hover:bg-[#333] rounded-full transition-all"
                >
                <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
                </motion.button>
                <span className="font-bold text-sm text-gray-300 uppercase tracking-widest">{t('readingMode')}</span>
            </div>
            
            <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 bg-[#333] rounded-lg p-1">
                    <button onClick={() => setFontSize(s => Math.max(s - 2, 16))} className="p-1.5 hover:bg-black/20 rounded text-xs font-bold">A-</button>
                    <span className="text-xs w-6 text-center">{fontSize}</span>
                    <button onClick={() => setFontSize(s => Math.min(s + 2, 60))} className="p-1.5 hover:bg-black/20 rounded text-xs font-bold">A+</button>
                 </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullScreen(true)}
                    className="p-2 hover:bg-[#333] rounded-full transition-all"
                >
                    <Maximize2 size={18} />
                </motion.button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Book Area */}
      <main className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        
        {/* Page Container */}
        <motion.div 
            key={currentPage}
            onDragEnd={(event, info) => {
              const offset = info.offset.x;
              if (offset > 50) {
                goToPrevAyah();
              } else if (offset < -50) {
                goToNextAyah();
              }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            className="relative bg-[#fffcf2] w-full max-w-[600px] h-full max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-l-md sm:rounded-md flex flex-col overflow-hidden border-l-[12px] border-[#e0e0e0] sm:border-l-0"
        >
                {/* Book Spine/Binding Effect (Left side for single page view usually implies right page of a spread) */}
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-gray-400 to-transparent z-10 opacity-50"></div>
                
                {/* Page Header */}
                <div className="h-12 border-b-2 border-emerald-900/10 flex items-center justify-between px-6 bg-[#fffcf2]">
                    <span className="font-quran text-emerald-800 text-lg">{pageData.ayahs[0].surahName}</span>
                    <span className="font-sans text-xs font-bold text-emerald-800/60 uppercase tracking-widest">{t('page')} {currentPage}</span>
                </div>

                {/* Page Content - The Text */}
                <div className="flex-1 p-6 sm:p-10 flex flex-col items-center justify-center text-center relative">
                    {/* Ayah Content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentAyah.number}
                        initial={{ opacity: 0, rotateY: 90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: -90 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="font-quran leading-[2.2] text-justify text-emerald-950 w-full"
                        style={{ fontSize: `${fontSize}px`, direction: 'rtl', textAlignLast: 'center' }}
                      >
                          {currentAyah.numberInSurah === 1 && (
                              <div className="w-full my-6 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-emerald-50 border border-emerald-200 py-3 rounded-lg relative overflow-hidden">
                                  <div className="absolute inset-0 opacity-10 bg-emerald-500"></div>
                                  <h3 className="font-arabic text-3xl text-emerald-800 relative z-10">{currentAyah.surahName}</h3>
                                  {currentAyah.surahNumber !== 1 && currentAyah.surahNumber !== 9 && (
                                      <p className="font-quran text-xl mt-2 text-emerald-700 relative z-10">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                  )}
                              </div>
                          )}
                           <span 
                               onClick={() => toggleAudio(currentAyah)}
                               className={`inline cursor-pointer hover:bg-emerald-100/50 rounded transition-colors p-2 ${activeAyah?.number === currentAyah.number ? 'bg-emerald-200 text-emerald-900' : ''}`}
                           >
                               {currentAyah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim()} 
                               <span className="font-sans text-[0.6em] mx-1 inline-flex items-center justify-center w-8 h-8 bg-no-repeat bg-center bg-contain text-emerald-700 select-none" 
                                     style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiMwNDc4NTciIHN0cm9rZS13aWR0aD0iMiIgZD0iTTUwIDUgTDY1IDM1IEw5NSA1MCBMNjUgNjUgTDUwIDk1IEwzNSA2NSBMNSA1MCBMMzUgMzUgWiIgLz48L3N2Zz4=')" }}>
                                   {currentAyah.numberInSurah}
                               </span>
                           </span>
                      </motion.div>
                    </AnimatePresence>

                    {/* Ayah Navigation Buttons */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                      <button onClick={goToNextAyah} className="p-2 bg-black/10 hover:bg-emerald-600/80 text-emerald-800 hover:text-white rounded-full transition-all"><ChevronLeft /></button>
                      <button onClick={goToPrevAyah} className="p-2 bg-black/10 hover:bg-emerald-600/80 text-emerald-800 hover:text-white rounded-full transition-all"><ChevronRight /></button>
                    </div>
                </div>

                {/* Page Footer */}
                <div className="h-8 border-t border-emerald-900/10 flex items-center justify-center bg-[#fffcf2]">
                    <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.2em]">{t('juz')} {pageData.ayahs[0].juz}</span>
                </div>

            </motion.div>

        {/* Navigation Controls Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 sm:px-8">
            <button 
                onClick={nextPage}
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/20 hover:bg-emerald-600 text-white backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={prevPage}
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/20 hover:bg-emerald-600 text-white backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
            >
                <ChevronRight size={24} />
            </button>
        </div>

        {isFullScreen && (
             <button 
                onClick={() => setIsFullScreen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-emerald-600 transition-all"
             >
                <Minimize2 size={20} />
             </button>
        )}

      </main>
    </div>
  );
};

export default ReadingMode;
