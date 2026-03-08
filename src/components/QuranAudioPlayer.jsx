import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import quranData from '../data/quran-uthmani.json';

import { reciters } from '../data/reciters';

const QuranAudioPlayer = () => {
  const { t, language } = useLanguage();
  const [selectedReciter, setSelectedReciter] = useState(() => {
    const saved = localStorage.getItem('selectedReciter');
    return saved ? reciters.find(r => r.id === parseInt(saved)) : reciters[0];
  });
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const saved = localStorage.getItem('selectedSurah');
    return saved ? quranData.data.surahs.find(s => s.number === parseInt(saved)) : quranData.data.surahs[0];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('selectedReciter', selectedReciter.id);
    localStorage.setItem('selectedSurah', selectedSurah.number);
  }, [selectedReciter, selectedSurah]);

  const createAudio = () => {
    try {
      setAudioError(null);
      const surahNumber = String(selectedSurah.number).padStart(3, '0');
      const audioUrl = `${selectedReciter.server}/${surahNumber}.mp3`;
      const newAudio = new Audio(audioUrl);
      newAudio.onerror = () => {
        setAudioError('Audio for this reciter is currently unavailable.');
        setIsPlaying(false);
      };
      audioRef.current = newAudio;
    } catch (error) {
      setAudioError('Failed to load audio. Please try again later.');
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    createAudio();
  }, [selectedSurah, selectedReciter]);

  const togglePlay = () => {
    if (!audioRef.current) {
      createAudio();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setAudioError('Audio for this reciter is currently unavailable.');
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (direction) => {
    const currentIndex = quranData.data.surahs.findIndex(s => s.number === selectedSurah.number);
    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < quranData.data.surahs.length) {
      setSelectedSurah(quranData.data.surahs[nextIndex]);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">{t('listenToQuran')}</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label htmlFor="surah" className="block text-sm font-medium text-slate-700 mb-2">{t('surah')}</label>
          <select 
            id="surah" 
            value={selectedSurah.number} 
            onChange={(e) => setSelectedSurah(quranData.data.surahs.find(s => s.number === parseInt(e.target.value)))}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            {quranData.data.surahs.map(surah => (
              <option key={surah.number} value={surah.number}>{surah.number}. {language === 'en' ? surah.englishName : surah.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="reciter" className="block text-sm font-medium text-slate-700 mb-2">{t('reciter')}</label>
          <select 
            id="reciter" 
            value={selectedReciter.id} 
            onChange={(e) => setSelectedReciter(reciters.find(r => r.id === e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            {reciters.map(reciter => (
              <option key={reciter.id} value={reciter.id}>{reciter.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center space-x-6 my-8">
          <button onClick={() => handleSkip('backward')} className="p-2 rounded-full hover:bg-slate-100 transition"><SkipBack className="text-slate-600" /></button>
          <button 
            onClick={togglePlay}
            className="p-4 bg-emerald-600 text-white rounded-full shadow-md hover:bg-emerald-700 transition"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button onClick={() => handleSkip('forward')} className="p-2 rounded-full hover:bg-slate-100 transition"><SkipForward className="text-slate-600" /></button>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">{language === 'en' ? selectedSurah.englishName : selectedSurah.name}</p>
          <p className="text-sm text-slate-500">{selectedReciter.name}</p>
          {audioError && <p className="text-sm text-red-500 mt-2">{audioError}</p>}
        </div>
      </div>
    </div>
  );
};

export default QuranAudioPlayer;
