
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, PauseCircle, BookOpen, ChevronLeft, ChevronRight, Bookmark, Settings, Minus, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { getSurah } from '../utils/quranData';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { useLanguage } from '../context/LanguageContext';
import { useReading } from '../context/ReadingContext';
import { motion, AnimatePresence } from 'framer-motion';

const toArabicNumerals = (n) => {
    return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
};

const SurahDetail = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { markPageRead } = useReading();
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('mushafFontSize') || '36', 10);
  });
  const [font, setFont] = useState(() => {
    return localStorage.getItem('mushafFont') || 'quran';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const audioRef = useRef(null);
  const isOnline = useOnlineStatus();

  // Bookmark / Stop Here logic
  const [bookmark, setBookmark] = useState(() => {
    const saved = localStorage.getItem('quranBookmark');
    return saved ? JSON.parse(saved) : null;
  });

  const saveBookmark = () => {
    const newBookmark = { surahId: id, pageIndex, surahName: surah?.arabic.englishName };
    setBookmark(newBookmark);
    localStorage.setItem('quranBookmark', JSON.stringify(newBookmark));
  };

  useEffect(() => {
    localStorage.setItem('mushafFontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('mushafFont', font);
  }, [font]);

  useEffect(() => {
    // Fetch from local data
    setLoading(true);
    getSurah(id)
      .then(data => {
        if (data) {
          setSurah(data);
          // If this is the bookmarked surah, jump to that page
          const saved = localStorage.getItem('quranBookmark');
          if (saved) {
            const b = JSON.parse(saved);
            if (b.surahId === id) {
              // We need to wait for bookPages to be calculated
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [id]);

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

  // Jump to bookmark on load if applicable
  useEffect(() => {
    if (bookPages.length > 0 && bookmark && bookmark.surahId === id) {
      // Find index of the bookmarked page
      const idx = bookPages.findIndex(p => p.page === bookmark.pageIndex); // bookmark.pageIndex stored page number or index?
      // Let's assume bookmark.pageIndex stored the array index for simplicity, or fix it
      // Actually bookmark logic above uses pageIndex from state which is array index.
      setPageIndex(bookmark.pageIndex);
    }
  }, [bookPages, id]); // Removing bookmark from dep array to avoid loop

  useEffect(() => {
    if (bookPages[pageIndex]) {
      markPageRead(bookPages[pageIndex].page);
    }
  }, [pageIndex, bookPages, markPageRead]);

  const nextPage = () => {
    if (pageIndex < bookPages.length - 1) setPageIndex(prev => prev + 1);
  };

  const prevPage = () => {
    if (pageIndex > 0) setPageIndex(prev => prev - 1);
  };

  const [activeAyah, setActiveAyah] = useState(null);

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
      const surahPad = String(id).padStart(3, '0'); // id is surah number
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

  const toggleFullSurahAudio = () => {
      // Plays the whole surah logic (existing)
      if (isPlaying && !activeAyah) {
          audioRef.current?.pause();
          setIsPlaying(false);
      } else {
          // Play full surah
          // ... implementation for full surah
          setIsPlaying(true);
      }
  }

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'ArrowLeft') nextPage(); // Left arrow goes to next page in RTL
          else if (e.key === 'ArrowRight') prevPage();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageIndex]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#fffcf2] flex flex-col items-center justify-center space-y-4 z-[9999]">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-emerald-800 font-black uppercase tracking-[0.3em] text-[10px]">{t('loading')}...</p>
      </div>
    );
  }

  if (!surah || bookPages.length === 0) return <div className="text-center py-10">{t('surahNotFound')}</div>;

  const currentPage = bookPages[pageIndex];

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
                <Link to="/quran" className="p-2 hover:bg-[#333] rounded-full transition-all">
                    <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
                </Link>
                <div className="hidden sm:block">
                    <h1 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{surah.arabic.englishName}</h1>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={saveBookmark}
                    className={`p-2 rounded-full transition-all ${bookmark?.surahId === id && bookmark?.pageIndex === pageIndex ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                    title={t('stopHere')}
                >
                    <Bookmark size={18} fill={bookmark?.surahId === id && bookmark?.pageIndex === pageIndex ? "currentColor" : "none"} />
                </button>

                 <div className="flex items-center gap-2 bg-[#333] rounded-lg p-1 mx-2">
                    <button onClick={() => setFontSize(s => Math.max(s - 2, 16))} className="p-1.5 hover:bg-black/20 rounded text-xs font-bold text-gray-300">A-</button>
                    <span className="text-xs w-6 text-center text-gray-300">{fontSize}</span>
                    <button onClick={() => setFontSize(s => Math.min(s + 2, 60))} className="p-1.5 hover:bg-black/20 rounded text-xs font-bold text-gray-300">A+</button>
                 </div>

                 <div className="flex items-center gap-1 bg-[#333] rounded-lg p-1">
                    <button onClick={() => setFont('quran')} className={`p-1.5 px-2 rounded text-xs font-bold ${font === 'quran' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-black/20'}`}>Amiri</button>
                    <button onClick={() => setFont('uthman')} className={`p-1.5 px-2 rounded text-xs font-bold ${font === 'uthman' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-black/20'}`}>Uthman</button>
                 </div>
                
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullScreen(true)}
                    className="p-2 hover:bg-[#333] rounded-full transition-all text-gray-300"
                >
                    <Maximize2 size={18} />
                </motion.button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Book Area */}
      <main className="flex-1 relative flex items-center justify-center p-0 sm:p-8 overflow-hidden bg-[#2f2f2f]">
        
        {/* Page Container */}
        <AnimatePresence mode="wait">
            <motion.div 
                key={pageIndex}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative bg-[#fffcf2] w-full max-w-[500px] h-full max-h-[85vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:rounded-md flex flex-col overflow-hidden border-x-[1px] border-[#e0e0e0]"
                style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Book Spine/Binding Effect */}
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-gradient-to-r from-[#dcdcdc] to-transparent z-10 opacity-60"></div>
                <div className="absolute right-0 top-0 bottom-0 w-[6px] bg-gradient-to-l from-[#dcdcdc] to-transparent z-10 opacity-60"></div>
                
                {/* Decorative Frame */}
                <div className="absolute inset-2 border-[8px] border-double border-[#79907f] z-0 rounded-sm pointer-events-none"></div>
                <div className="absolute inset-3 border border-[#79907f] z-0 rounded-sm pointer-events-none opacity-50"></div>

                {/* Corner Decorations (SVG) */}
                <div className="absolute top-4 left-4 w-16 h-16 pointer-events-none z-0 opacity-80">
                   <svg viewBox="0 0 100 100" className="w-full h-full fill-[#79907f]">
                      <path d="M0 0 L40 0 C20 0 20 20 0 40 Z" />
                      <path d="M5 5 L35 5 C20 5 20 20 5 35 Z" fill="#d4e0d7" />
                   </svg>
                </div>
                <div className="absolute top-4 right-4 w-16 h-16 pointer-events-none z-0 opacity-80 rotate-90">
                   <svg viewBox="0 0 100 100" className="w-full h-full fill-[#79907f]">
                      <path d="M0 0 L40 0 C20 0 20 20 0 40 Z" />
                      <path d="M5 5 L35 5 C20 5 20 20 5 35 Z" fill="#d4e0d7" />
                   </svg>
                </div>
                <div className="absolute bottom-4 left-4 w-16 h-16 pointer-events-none z-0 opacity-80 -rotate-90">
                   <svg viewBox="0 0 100 100" className="w-full h-full fill-[#79907f]">
                      <path d="M0 0 L40 0 C20 0 20 20 0 40 Z" />
                      <path d="M5 5 L35 5 C20 5 20 20 5 35 Z" fill="#d4e0d7" />
                   </svg>
                </div>
                <div className="absolute bottom-4 right-4 w-16 h-16 pointer-events-none z-0 opacity-80 rotate-180">
                   <svg viewBox="0 0 100 100" className="w-full h-full fill-[#79907f]">
                      <path d="M0 0 L40 0 C20 0 20 20 0 40 Z" />
                      <path d="M5 5 L35 5 C20 5 20 20 5 35 Z" fill="#d4e0d7" />
                   </svg>
                </div>

                {/* Page Header - Matches the traditional Mushaf layout */}
                <div className="h-10 flex items-center justify-between px-8 bg-[#fffcf2] mt-4 z-10 relative font-quran text-black border-b border-[#d4d4d4]">
                    <span className="text-sm font-bold tracking-tight">{surah.arabic.name}</span> {/* Right: Current Surah (or previous if mid-page) */}
                    <span className="text-sm font-bold mx-auto tracking-tight">{toArabicNumerals(currentPage.page)}</span> {/* Center: Page Number */}
                    <span className="text-sm font-bold tracking-tight">{t('juz')} {toArabicNumerals(currentPage.ayahs[0].juz)}</span> {/* Left: Juz Number */}
                </div>

                {/* Page Content - The Text */}
                <div className="flex-1 px-8 py-4 overflow-y-auto custom-scrollbar flex flex-col items-center justify-start text-center bg-[#fffcf2] z-10 relative">
                    <div 
                        className={`leading-[2.8] text-justify text-[#1a1a1a] w-full antialiased font-${font}`}
                        style={{ fontSize: `${fontSize}px`, direction: 'rtl', textAlignLast: 'center', fontFeatureSettings: '"calt" 1, "liga" 1' }}
                    >
                        {currentPage.ayahs.map((ayah, idx) => {
                             const isSurahStart = ayah.numberInSurah === 1;
                             let text = ayah.text;
                             if (isSurahStart && surah.arabic.number !== 1 && surah.arabic.number !== 9) {
                                 text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
                             }

                             return (
                                <React.Fragment key={ayah.number}>
                                    {isSurahStart && (
                                        <div className="w-full my-4 flex flex-col items-center">
                                            {/* Surah Header Decoration - Exact Match */}
                                            <div className="w-full max-w-[90%] h-12 relative flex items-center justify-center mb-4">
                                                {/* SVG Decorative Frame */}
                                                <svg viewBox="0 0 400 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                                    <path d="M15 5 L385 5 L395 25 L385 45 L15 45 L5 25 Z" fill="#e6f0e8" stroke="#a0b8a7" strokeWidth="1" />
                                                    <path d="M20 8 L380 8 L388 25 L380 42 L20 42 L12 25 Z" fill="#d4e0d7" />
                                                </svg>
                                                
                                                <h3 className="font-quran text-xl text-[#2d4a33] relative z-20 px-8 pb-1">{surah.arabic.name}</h3>
                                            </div>
                                            
                                            {surah.arabic.number !== 1 && surah.arabic.number !== 9 && (
                                                <p className="font-quran text-xl text-black relative z-10 mb-6 mt-2">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                            )}
                                        </div>
                                    )}
                                    <span 
                                        onClick={() => toggleAudio(ayah)}
                                        className={`inline cursor-pointer hover:bg-[#e0f2f1] rounded px-0.5 transition-colors leading-[2.6] decoration-clone box-decoration-clone ${activeAyah?.number === ayah.number ? 'bg-[#d1fae5]' : ''}`}
                                    >
                                        {text} 
                                        {/* Custom SVG Ayah Marker - Exact Copy */}
                                        <span className="inline-flex items-center justify-center align-middle mx-1.5 relative select-none w-[1.2em] h-[1.2em]" style={{ fontSize: '0.8em', verticalAlign: '-0.15em' }}>
                                            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-emerald-600 fill-transparent stroke-emerald-500 stroke-[4]">
                                               <circle cx="50" cy="50" r="45" />
                                            </svg>
                                            <span className="relative z-10 font-quran text-emerald-800 text-[0.5em] translate-y-[1px]">{toArabicNumerals(ayah.numberInSurah)}</span>
                                        </span>
                                    </span>
                                </React.Fragment>
                             );
                        })}
                    </div>
                </div>

                {/* Page Footer */}
                <div className="h-10 flex items-center justify-center bg-[#fffcf2] mb-6 z-10 relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t('juz')} {currentPage.ayahs[0].juz}</span>
                </div>

            </motion.div>
        </AnimatePresence>

        {/* Navigation Controls Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 sm:px-12">
            <button 
                onClick={nextPage}
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/30 hover:bg-emerald-600 text-white backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={prevPage}
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/30 hover:bg-emerald-600 text-white backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
            >
                <ChevronRight size={20} />
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

export default SurahDetail;
