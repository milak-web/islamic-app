import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSurahs } from '../utils/quranData';
import QuranGoals from './QuranGoals';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const QuranReader = () => {
  const { t, language } = useLanguage();
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSurahs()
      .then(data => {
        setSurahs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">{t('quran')}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('exploreTheHolyBook')}</p>
        </div>
        
        <Link to="/quran/read" className="group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-3 transition-all"
          >
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Sparkles size={18} />
            </div>
            <span className="font-black uppercase tracking-widest text-[10px]">{t('enterReadingMode')}</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Surah List */}
        <div className="lg:col-span-2 space-y-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('loadingSurahs')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {surahs.map((surah, idx) => (
                    <motion.div
                      key={surah.number}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.01 }}
                    >
                      <Link to={`/quran/${surah.number}`} className="bg-white p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-emerald-200 block group">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                            <span className="bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors font-black w-10 h-10 flex items-center justify-center rounded-2xl text-xs">
                                {surah.number}
                            </span>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm group-hover:text-emerald-700 transition-colors">
                                    {surah.englishName}
                                </h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {t(surah.revelationType.toLowerCase())} • {surah.numberOfAyahs} {t('ayahs')}
                                </p>
                            </div>
                            </div>
                            <div className="text-right">
                              <h3 className="font-arabic text-2xl text-emerald-800 drop-shadow-sm">{surah.name}</h3>
                            </div>
                        </div>
                      </Link>
                    </motion.div>
                ))}
                </div>
            )}
        </div>

        {/* Sidebar - Goals */}
        <div className="lg:col-span-1">
            <div className="sticky top-24">
                <QuranGoals />
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuranReader;
