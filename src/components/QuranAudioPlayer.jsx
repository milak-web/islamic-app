import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, SkipBack, SkipForward, Loader2, Volume2, VolumeX } from 'lucide-react';
import quranData from '../data/quran-uthmani.json';
import { reciters } from '../data/reciters';
import { motion } from 'framer-motion';

const QuranAudioPlayer = () => {
  const { t, language } = useLanguage();
  const { isPlaying, currentSource, duration, currentTime, isLoading, error, play, pause, seek, stop } = useAudio();
  
  const [selectedReciter, setSelectedReciter] = useState(() => {
    const saved = localStorage.getItem('selectedReciter');
    return saved ? reciters.find(r => r.id === parseInt(saved)) || reciters[0] : reciters[0];
  });
  
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const saved = localStorage.getItem('selectedSurah');
    return saved ? quranData.data.surahs.find(s => s.number === parseInt(saved)) || quranData.data.surahs[0] : quranData.data.surahs[0];
  });

  useEffect(() => {
    localStorage.setItem('selectedReciter', selectedReciter.id);
    localStorage.setItem('selectedSurah', selectedSurah.number);
  }, [selectedReciter, selectedSurah]);

  const handlePlay = () => {
    const pad = (n) => n.toString().padStart(3, '0');
    const surahNumber = pad(selectedSurah.number);
    
    // Fallback URLs
    const urls = [
      `${selectedReciter.server}/${surahNumber}.mp3`,
      `https://server7.mp3quran.net/afs/${surahNumber}.mp3`,
      `https://server8.mp3quran.net/afs/${surahNumber}.mp3`,
      `https://server11.mp3quran.net/afs/${surahNumber}.mp3`,
      `https://download.quranicaudio.com/quran/mishari_rashid_al_afasy/${surahNumber}.mp3`,
      `https://mirrors.quranicaudio.com/quran/mishari_rashid_al_afasy/${surahNumber}.mp3`
    ];

    play(urls, { type: 'surah', surahNumber: selectedSurah.number, reciterId: selectedReciter.id });
  };

  const handleSkip = (direction) => {
    const currentIndex = quranData.data.surahs.findIndex(s => s.number === selectedSurah.number);
    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < quranData.data.surahs.length) {
      setSelectedSurah(quranData.data.surahs[nextIndex]);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isCurrentSurahPlaying = currentSource?.type === 'surah' && 
                               currentSource?.surahNumber === selectedSurah.number &&
                               currentSource?.reciterId === selectedReciter.id;

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-xl border border-slate-50 p-8 sm:p-12 flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Volume2 size={120} />
        </div>

        <div className="w-full space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">
                {language === 'en' ? selectedSurah.englishName : <span className="font-quran text-4xl">{selectedSurah.name}</span>}
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedReciter.name}</p>
          </div>

          {/* Visualizer / Placeholder */}
          <div className="h-48 flex items-center justify-center bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner relative group">
             {isLoading ? (
               <Loader2 size={48} className="text-emerald-500 animate-spin" />
             ) : (
               <div className="flex items-center gap-1">
                 {[...Array(12)].map((_, i) => (
                   <motion.div
                     key={i}
                     animate={isPlaying && isCurrentSurahPlaying ? { height: [20, 40, 20] } : { height: 20 }}
                     transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                     className="w-1.5 bg-emerald-500 rounded-full"
                   />
                 ))}
               </div>
             )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden group cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seek(percent * duration);
            }}>
              <motion.div 
                className="absolute top-0 left-0 h-full bg-emerald-500"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSkip('backward')} 
              className="p-4 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-3xl transition-all"
            >
              <SkipBack size={24} />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={isCurrentSurahPlaying ? (isPlaying ? pause : handlePlay) : handlePlay}
              className="p-8 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all relative"
            >
              {isLoading && isCurrentSurahPlaying ? (
                <Loader2 size={40} className="animate-spin" />
              ) : (
                (isPlaying && isCurrentSurahPlaying) ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />
              )}
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSkip('forward')} 
              className="p-4 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-3xl transition-all"
            >
              <SkipForward size={24} />
            </motion.button>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 gap-4 pt-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('reciter')}</label>
                <select 
                  value={selectedReciter.id} 
                  onChange={(e) => setSelectedReciter(reciters.find(r => r.id === parseInt(e.target.value)))}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-700 uppercase tracking-tighter focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                >
                  {reciters.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
             </div>
             
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('surah')}</label>
                <select 
                  value={selectedSurah.number} 
                  onChange={(e) => setSelectedSurah(quranData.data.surahs.find(s => s.number === parseInt(e.target.value)))}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-700 uppercase tracking-tighter focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                >
                  {quranData.data.surahs.map(s => (
                    <option key={s.number} value={s.number}>{language === 'en' ? s.englishName : s.name}</option>
                  ))}
                </select>
             </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuranAudioPlayer;
