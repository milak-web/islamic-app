
import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Award, Star, Moon, ExternalLink, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../context/UserStatsContext';
import { useNavigate } from 'react-router-dom';

const SalahTracker = () => {
  const { t } = useLanguage();
  const { recordPrayer } = useUserStats();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem('dailySalah');
    const today = new Date().toDateString();
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed.prayers;
    }
    return {
      fajr: false,
      duha: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      tahajjud: false
    };
  });

  const prayers = [
    { key: 'fajr', label: t('fajr'), mandatory: true },
    { key: 'duha', label: t('duha'), mandatory: false }, // Sunnah Muakkadah
    { key: 'dhuhr', label: t('dhuhr'), mandatory: true },
    { key: 'asr', label: t('asr'), mandatory: true },
    { key: 'maghrib', label: t('maghrib'), mandatory: true },
    { key: 'isha', label: t('isha'), mandatory: true },
    { key: 'tahajjud', label: t('tahajjud'), mandatory: false } // Nafil
  ];

  const [tasbihStatus, setTasbihStatus] = useState({});

  useEffect(() => {
    const loadTasbihStatus = () => {
      const saved = localStorage.getItem('dailyTasbih');
      const today = new Date().toDateString();
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          setTasbihStatus(parsed.completed || {});
        } else {
          setTasbihStatus({});
        }
      }
    };
    
    loadTasbihStatus();
    // Add event listener for storage changes in case of multi-tab usage
    window.addEventListener('storage', loadTasbihStatus);
    return () => window.removeEventListener('storage', loadTasbihStatus);
  }, []);

  useEffect(() => {
    localStorage.setItem('dailySalah', JSON.stringify({
      date: new Date().toDateString(),
      prayers: completed
    }));
  }, [completed]);

  const togglePrayer = (key) => {
    const isNowCompleted = !completed[key];
    setCompleted(prev => ({ ...prev, [key]: isNowCompleted }));
    if (isNowCompleted) {
      recordPrayer(key);
    }
  };

  const openTasbih = () => {
    navigate('/tasbih?tab=salah');
  };

  const progress = Object.values(completed).filter(Boolean).length;
  const total = prayers.length;
  const percentage = (progress / total) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-emerald-600" />
          {t('dailyTracker')}
        </h2>
        <span className="text-sm font-medium text-slate-500">
          {progress}/{total} {t('completed')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prayers.map((prayer) => (
          <div 
            key={prayer.key}
            onClick={() => togglePrayer(prayer.key)}
            className={`
              cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
              ${completed[prayer.key] 
                ? 'bg-emerald-50 border-emerald-200 shadow-inner' 
                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-colors
                ${completed[prayer.key] ? 'text-emerald-600' : 'text-slate-300 group-hover:text-emerald-400'}
              `}>
                {completed[prayer.key] ? <CheckCircle size={24} /> : <Circle size={24} />}
              </div>
              <div>
                <span className={`font-semibold ${completed[prayer.key] ? 'text-emerald-800' : 'text-slate-700'}`}>
                  {prayer.label}
                </span>
                {!prayer.mandatory && <span className="text-xs text-slate-400 block">{t('sunnah')}</span>}
              </div>
            </div>
            {completed[prayer.key] && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasbih?tab=salah&prayer=${prayer.key}`);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-1.5 ${
                  tasbihStatus[prayer.key] 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm'
                }`}
              >
                {tasbihStatus[prayer.key] ? (
                  <>
                    <CheckCircle size={14} fill="currentColor" />
                    {t('completed')}
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    {t('adhkar')}
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      
      {percentage === 100 && (
        <div className="mt-6 text-center bg-emerald-100 text-emerald-800 p-4 rounded-xl animate-pulse">
          <Star className="inline-block mb-1 mr-2" size={20} />
          {t('wellDone')}
        </div>
      )}
    </div>
  );
};

export default SalahTracker;
