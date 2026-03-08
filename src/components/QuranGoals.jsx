
import React, { useState } from 'react';
import { BookOpen, CheckCircle, Trophy, Settings, ChevronRight, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useReading } from '../context/ReadingContext';

const QuranGoals = () => {
  const { t, language } = useLanguage();
  const { 
    todayLog, 
    goalSettings, 
    updateSettings, 
    getProgress,
    toggleChallenge
  } = useReading();
  
  const [showSettings, setShowSettings] = useState(false);
  const { current, target, percentage } = getProgress();

  const handleSettingsSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateSettings({
      mode: formData.get('mode'),
      pagesPerDay: parseInt(formData.get('pagesPerDay')),
      khatamDays: parseInt(formData.get('khatamDays'))
    });
    setShowSettings(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="text-amber-500" />
          {t('quranGoals')}
        </h2>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="text-slate-400 hover:text-emerald-600 transition"
        >
          <Settings size={20} />
        </button>
      </div>

      {showSettings ? (
        <form onSubmit={handleSettingsSave} className="space-y-4 bg-slate-50 p-4 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('setGoal')}</label>
            <select 
              name="mode" 
              defaultValue={goalSettings.mode}
              className="w-full rounded-lg border-slate-200 text-sm"
            >
              <option value="daily">{t('pagesPerDay')}</option>
              <option value="khatam">{t('finishIn')} (X {t('days')})</option>
            </select>
          </div>
          
          {goalSettings.mode === 'daily' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('pages')}</label>
              <input 
                type="number" 
                name="pagesPerDay"
                defaultValue={goalSettings.pagesPerDay}
                className="w-full rounded-lg border-slate-200 text-sm"
                min="1"
              />
            </div>
          ) : (
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('days')}</label>
              <input 
                type="number" 
                name="khatamDays"
                defaultValue={goalSettings.khatamDays}
                className="w-full rounded-lg border-slate-200 text-sm"
                min="1"
              />
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setShowSettings(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit"
              className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700"
            >
              {t('save')}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-slate-500 mb-1">{t('dailyTarget')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-600">{current}</span>
                  <span className="text-slate-400">/ {target} {t('pages')}</span>
                </div>
              </div>
              <div className="text-right">
                 {percentage >= 100 && (
                    <span className="text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <CheckCircle size={16} /> {t('completed')}
                    </span>
                 )}
              </div>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>


        </>
      )}
    </div>
  );
};

export default QuranGoals;
