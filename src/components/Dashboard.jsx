import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Heart, Moon, Star, Quote, ChevronRight } from 'lucide-react';
import SalahTracker from './SalahTracker';
import SpecialEvents from './SpecialEvents';
import { useLanguage } from '../context/LanguageContext';
import quranData from '../data/quran-uthmani.json';
import quranEnData from '../data/quran-en.json';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const [dailyVerse, setDailyVerse] = useState(null);

  useEffect(() => {
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      
      const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seededRandom = (max) => {
          const x = Math.sin(seed) * 10000;
          return Math.floor((x - Math.floor(x)) * max);
      };

      const randomSurahIndex = seededRandom(114);
      const surah = quranData.data.surahs[randomSurahIndex];
      const enSurah = quranEnData.data.surahs[randomSurahIndex];
      
      const randomAyahIndex = seededRandom(surah.ayahs.length);
      const arabicAyah = surah.ayahs[randomAyahIndex];
      const englishAyah = enSurah?.ayahs[randomAyahIndex];

      setDailyVerse({
        arabic: {
          text: arabicAyah.text,
          surah: { name: surah.name, number: surah.number }
        },
        english: {
          text: englishAyah?.text || 'Translation not available',
          surah: { name: surah.englishName, number: surah.number }
        },
        number: arabicAyah.numberInSurah
      });
    } catch (error) {
      console.error("Error setting daily verse:", error);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-20"
    >
      {/* Salah Tracker Section */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SalahTracker />
          
          {/* Continue Reading Card */}
          <Link to="/quran/read" className="group h-full">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] shadow-lg shadow-emerald-900/10 text-white flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 rotate-12">
                <BookOpen size={200} />
              </div>
              
              <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t('continueReading')}</h3>
                <p className="text-emerald-100 text-sm font-medium opacity-80">{t('resumeYourLastSession')}</p>
              </div>
              
              <div className="relative z-10 mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                {t('openReadingMode')}
                <ChevronRight size={14} />
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.section>

      {/* Special Events & Challenges */}
      <motion.section variants={itemVariants}>
        <SpecialEvents />
      </motion.section>

      {/* Daily Verse Section */}
      <motion.section variants={itemVariants} className="relative">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tighter">{t('ayahOfTheDay')}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {dailyVerse ? (
            <motion.div 
              key="verse-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden group transition-all duration-500"
            >
              <div className="p-6 sm:p-10 space-y-8">
                <div className="relative">
                  <Quote className="absolute -top-4 -left-4 text-emerald-50 w-16 h-16 -z-0 rotate-180" />
                  <p className="font-quran text-2xl sm:text-3xl text-emerald-900 text-center leading-[2] relative z-10" dir="rtl">
                    {dailyVerse.arabic.text}
                  </p>
                </div>

                <div className="space-y-4 text-center border-t border-slate-50 pt-8">
                  <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed italic px-2">
                    "{dailyVerse.english.text}"
                  </p>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.2em]">
                      {dailyVerse.english.surah.name} • {dailyVerse.number}
                    </span>
                  </div>
                </div>
              </div>

              <Link 
                to={`/quran/read/${dailyVerse.english.surah.number}`}
                className="block bg-emerald-50 hover:bg-emerald-600 group-hover:bg-emerald-600 py-4 text-center transition-all duration-500"
              >
                <span className="text-emerald-700 group-hover:text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                  {t('readFullSurah')}
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-50 border-t-emerald-500" />
            </div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Quick Navigation Cards */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4 sm:gap-6">
        {[
          { to: "/quran", icon: BookOpen, label: t('quran'), color: "bg-blue-500", shadow: "shadow-blue-500/20" },
          { to: "/prayer-times", icon: Clock, label: t('prayerTimes'), color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
          { to: "/tasbih", icon: Moon, label: t('tasbih'), color: "bg-amber-500", shadow: "shadow-amber-500/20" },
          { to: "/dua", icon: Heart, label: t('dua'), color: "bg-rose-500", shadow: "shadow-rose-500/20" }
        ].map((link, idx) => (
          <Link key={idx} to={link.to} className="group">
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex flex-col items-center text-center gap-3 transition-all duration-500 group-hover:shadow-md group-hover:border-emerald-100`}
            >
              <div className={`${link.color} p-3 rounded-xl text-white shadow-md group-hover:rotate-6 transition-transform duration-500`}>
                <link.icon size={24} />
              </div>
              <span className="font-black text-slate-700 uppercase tracking-tighter text-xs group-hover:text-emerald-600 transition-colors">
                {link.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.section>
    </motion.div>
  );
};

export default Dashboard;
