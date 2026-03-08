import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Share2, Bookmark, Copy, Search, BookOpen, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const HadithList = () => {
  const { edition, section } = useParams();
  const { t, language } = useLanguage();
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionInfo, setSectionInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHadiths = useMemo(() => {
    if (!searchQuery.trim()) return hadiths;
    const query = searchQuery.toLowerCase();
    return hadiths.filter(h => 
      h.text.toLowerCase().includes(query) || 
      (h.hadithnumber && h.hadithnumber.toString().includes(query))
    );
  }, [hadiths, searchQuery]);

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/${edition}/sections/${section}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch hadiths');
        return res.json();
      })
      .then(data => {
        setHadiths(data.hadiths);
        if (data.metadata && data.metadata.section && data.metadata.section[section]) {
          setSectionInfo({ number: section, name: data.metadata.section[section] });
        } else {
           setSectionInfo({ number: section, name: `${t('section')} ${section}` });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('networkError');
        setLoading(false);
      });
  }, [edition, section, language]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full"
        />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">{t('loadingHadiths')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 space-y-6 bg-red-50 rounded-[3rem] border border-red-100 mx-4"
      >
        <p className="text-red-500 font-bold">{t(error)}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
        >
          {t('retry')}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20"
    >
      <div className="space-y-8">
        <Link to={`/hadith/${edition}`} className="inline-flex items-center text-emerald-600 font-black uppercase tracking-widest text-[10px] bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all gap-2 group">
          <ArrowIcon size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('backToBook')}
        </Link>
        
        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <BookOpen className="text-emerald-600" size={20} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tighter uppercase">
                {sectionInfo ? sectionInfo.name : `${t('book')} ${section}`}
              </h1>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] px-1">{hadiths.length} {t('hadithsInThisSection')}</p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-emerald-500">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchHadithText')}
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-xl shadow-slate-200/20 font-bold text-slate-800 placeholder:text-slate-300"
            />
            {searchQuery && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {filteredHadiths.length} {t('found')}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredHadiths.length > 0 ? (
            filteredHadiths.map((hadith, index) => (
              <motion.div 
                layout
                key={hadith.hadithnumber || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white p-8 sm:p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-emerald-100 hover:shadow-[0_30px_60px_rgba(16,185,129,0.05)] transition-all duration-500"
              >
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                      #{hadith.hadithnumber}
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {hadith.grades && hadith.grades.length > 0 ? hadith.grades[0].grade : 'N/A'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(hadith.text)}
                      className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all" 
                    >
                      <Copy size={20} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                    >
                      <Share2 size={20} />
                    </motion.button>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <p 
                    className={`text-slate-800 leading-[2] sm:leading-[2.2] text-xl sm:text-2xl ${language === 'ar' ? 'font-arabic text-right' : 'font-medium'}`} 
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {hadith.text}
                  </p>
                </div>
                
                <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap gap-6 justify-between items-center">
                  <div className="flex flex-wrap gap-4">
                    {hadith.reference && Object.entries(hadith.reference).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{k}</span>
                        <span className="text-xs font-bold text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100"
            >
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em]">{t('noHadithsFoundMatchingYourSearch')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HadithList;
