import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Minus, Settings, List, ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adhkarContent, prayerRoutines } from '../data/adhkar';

const TasbihCounter = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'counter' (free/preset) or 'routine' (step-by-step)
  const [mode, setMode] = useState('counter');
  
  // Counter State
  const [count, setCount] = useState(() => parseInt(localStorage.getItem('tasbihCount') || '0', 10));
  const [target, setTarget] = useState(() => parseInt(localStorage.getItem('tasbihTarget') || '33', 10));
  const [currentAdhkarId, setCurrentAdhkarId] = useState(null); // ID from adhkarContent
  const [customLabel, setCustomLabel] = useState(localStorage.getItem('tasbihLabel') || "SubhanAllah");

  // Routine State
  const [routineSteps, setRoutineSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routineCompleted, setRoutineCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('common');

  useEffect(() => {
    const tab = searchParams.get('tab');
    const prayer = searchParams.get('prayer');

    if (tab === 'salah' && prayer) {
      checkRoutineStatus(prayer);
      setActiveTab('salah');
    } else if (tab && ['common', 'morning', 'evening', 'salah'].includes(tab)) {
      setActiveTab(tab);
      setMode('counter');
    }
  }, [searchParams]);

  const checkRoutineStatus = (prayerKey) => {
    const saved = localStorage.getItem('dailyTasbih');
    const today = new Date().toDateString();
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today && parsed.completed && parsed.completed[prayerKey]) {
        setRoutineCompleted(true);
        setMode('routine');
        return;
      }
    }
    startRoutine(prayerKey);
  };

  useEffect(() => {
    localStorage.setItem('tasbihCount', count);
    localStorage.setItem('tasbihTarget', target);
    localStorage.setItem('tasbihLabel', customLabel);
  }, [count, target, customLabel]);

  const markRoutineComplete = () => {
    setRoutineCompleted(true);
    const prayer = searchParams.get('prayer');
    if (prayer) {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('dailyTasbih');
        let data = { date: today, completed: {} };
        
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.date === today) {
                data = parsed;
            }
        }
        
        data.completed[prayer] = true;
        localStorage.setItem('dailyTasbih', JSON.stringify(data));
    }
  };

  const startRoutine = (prayerKey) => {
    const routine = prayerRoutines[prayerKey] || prayerRoutines.common;
    setRoutineSteps(routine);
    setCurrentStepIndex(0);
    setMode('routine');
    setRoutineCompleted(false);
    loadStep(routine[0]);
  };

  const loadStep = (step) => {
    if (!step) return;
    const content = adhkarContent[step.id];
    setCurrentAdhkarId(step.id);
    setCustomLabel(language === 'ar' ? content.title.ar : content.title.en);
    setTarget(step.target);
    setCount(0);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < routineSteps.length) {
      setCurrentStepIndex(nextIndex);
      loadStep(routineSteps[nextIndex]);
    } else {
      markRoutineComplete();
    }
  };

  const increment = () => {
    if (count < target) {
      setCount(prev => prev + 1);
      if (navigator.vibrate) navigator.vibrate(50);
      
      // Auto-advance if in routine mode and target reached
      if (mode === 'routine' && count + 1 >= target) {
         if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
         // Optional: Auto-advance delay or wait for user to click "Next"
         // Current design: Button changes to "Next" or "Done"
      }
    }
  };

  const decrement = () => {
    if (count > 0) setCount(prev => prev - 1);
  };

  const reset = () => {
    setCount(0);
  };

  const selectPreset = (id, defaultTarget) => {
    const content = adhkarContent[id];
    if (content) {
        setCurrentAdhkarId(id);
        setCustomLabel(language === 'ar' ? content.title.ar : content.title.en);
        setTarget(defaultTarget);
        setCount(0);
        setMode('counter');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to get current content object
  const getCurrentContent = () => {
    if (currentAdhkarId && adhkarContent[currentAdhkarId]) {
      return adhkarContent[currentAdhkarId];
    }
    // Fallback for custom or legacy
    return {
      title: { en: customLabel, ar: customLabel },
      arabic: customLabel, // Or empty if custom
      transliteration: "",
      translation: { en: "", ar: "" }
    };
  };

  const currentContent = getCurrentContent();
  const progress = Math.min((count / target) * 100, 100);
  const isTargetReached = count >= target;

  // Render Routine Completion View
  if (mode === 'routine' && routineCompleted) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6 animate-fade-in-up">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">{t('wellDone')}</h2>
        <p className="text-slate-600">{t('completedPrayerAdhkar')}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-full font-medium hover:bg-emerald-700 transition w-full max-w-xs"
        >
          {t('backToHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-200px)]">
      {/* Header / Mode Switcher */}
      <div className="flex items-center justify-between px-2">
        {mode === 'routine' ? (
           <button onClick={() => navigate('/')} className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-bold">
             <ChevronLeft size={20} /> {t('back')}
           </button>
        ) : (
           <div className="text-center w-full">
             <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">{t('tasbihCounter')}</h1>
           </div>
        )}
      </div>

      {mode === 'routine' && (
        <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden mx-2">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${((currentStepIndex) / routineSteps.length) * 100}%` }}
          ></div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px] max-h-[80vh] relative">
        {/* Progress Bar at top */}
        <div className="h-1.5 bg-slate-50 w-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* 1. Header Area (Fixed) */}
        <div className="p-6 border-b border-slate-50 bg-white/80 backdrop-blur-sm z-10 shrink-0 text-center">
          <h2 className="text-sm font-black text-emerald-700 uppercase tracking-[0.2em]">
            {language === 'ar' ? currentContent.title.ar : currentContent.title.en}
          </h2>
        </div>

        {/* 2. Content Display (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-6 custom-scrollbar">
          <div className="w-full text-center space-y-6">
            <p className="text-3xl md:text-4xl lg:text-5xl font-arabic leading-relaxed text-slate-800 drop-shadow-sm" dir="rtl">
              {currentContent.arabic}
            </p>

            {language !== 'ar' && currentContent.transliteration && (
               <p className="text-slate-500 italic text-base md:text-lg border-t border-slate-50 pt-6 px-4">
                 {currentContent.transliteration}
               </p>
            )}
          </div>
        </div>

        {/* 3. Controls (Fixed at Bottom) */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30 shrink-0 flex flex-col items-center gap-6 z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black text-slate-900 tabular-nums tracking-tighter drop-shadow-sm">
              {count}
            </span>
            <span className="text-xl font-bold text-slate-300 uppercase tracking-widest">
              / {target}
            </span>
          </div>

          <div className="flex items-center justify-center gap-8 w-full">
            {!isTargetReached && (
              <button 
                onClick={decrement} 
                disabled={count === 0}
                className="p-4 text-slate-300 hover:text-emerald-600 hover:bg-white rounded-2xl transition-all active:scale-90 disabled:opacity-0"
              >
                <Minus size={28} />
              </button>
            )}

            {mode === 'routine' && isTargetReached ? (
              <button 
                onClick={nextStep}
                className="px-10 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest animate-bounce-subtle"
              >
                {currentStepIndex < routineSteps.length - 1 ? t('next') : t('finish')} <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                onClick={increment}
                className="w-28 h-28 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xl shadow-emerald-600/30 transition-all transform active:scale-95 flex items-center justify-center focus:outline-none border-8 border-white group"
              >
                <Plus size={48} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            )}

            {!isTargetReached && (
              <button 
                onClick={reset} 
                className="p-4 text-slate-300 hover:text-amber-600 hover:bg-white rounded-2xl transition-all active:scale-90"
              >
                <RotateCcw size={28} />
              </button>
            )}
          </div>
      </div>

      {/* Spacer for mobile nav */}
      <div className="flex-grow"></div>
      <div className="h-20 md:h-0"></div>
    </div>

      {/* Preset Tabs (Only in Counter Mode) */}
      {mode === 'counter' && (
        <div className="space-y-4 px-2">
          <div className="flex overflow-x-auto pb-1 gap-2 border-b border-slate-200 no-scrollbar">
            {['common', 'salah', 'morning', 'evening'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-emerald-700 border-x border-t border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]' 
                    : 'text-slate-400 hover:text-emerald-600'
                }`}
              >
                {tab === 'common' ? t('presets') : 
                 tab === 'salah' ? t('afterSalah') :
                 tab === 'morning' ? t('morningAdhkar') : t('eveningAdhkar')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {activeTab === 'common' && ['subhanallah', 'alhamdulillah', 'allahu-akbar', 'astaghfirullah'].map(id => (
                <PresetButton key={id} id={id} defaultTarget={33} onSelect={selectPreset} activeId={currentAdhkarId} />
             ))}
             {activeTab === 'salah' && ['ayatul-kursi', 'subhanallah', 'alhamdulillah', 'allahu-akbar', 'la-ilaha-illallah-wahdahu', 'surah-ikhlas', 'surah-falaq', 'surah-nas'].map(id => (
                <PresetButton key={id} id={id} defaultTarget={id === 'subhanallah' || id === 'alhamdulillah' || id === 'allahu-akbar' ? 33 : 1} onSelect={selectPreset} activeId={currentAdhkarId} />
             ))}
             {activeTab === 'morning' && ['ayatul-kursi', 'surah-ikhlas', 'surah-falaq', 'surah-nas'].map(id => (
                <PresetButton key={id} id={id} defaultTarget={3} onSelect={selectPreset} activeId={currentAdhkarId} />
             ))}
             {activeTab === 'evening' && ['ayatul-kursi', 'surah-ikhlas', 'surah-falaq', 'surah-nas'].map(id => (
                <PresetButton key={id} id={id} defaultTarget={3} onSelect={selectPreset} activeId={currentAdhkarId} />
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PresetButton = ({ id, defaultTarget, onSelect, activeId }) => {
    const { language } = useLanguage();
    const content = adhkarContent[id];
    if (!content) return null;

    return (
        <button
          onClick={() => onSelect(id, defaultTarget)}
          className={`p-5 rounded-3xl border transition-all flex justify-between items-center group ${
            activeId === id
              ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-600/20' 
              : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
          }`}
        >
          <div className="min-w-0 flex-1 text-left">
            <span className={`font-black uppercase tracking-tighter block mb-1 truncate text-base ${activeId === id ? 'text-white' : 'text-slate-800'}`}>
                {language === 'ar' ? content.title.ar : content.title.en}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest truncate block opacity-60 ${activeId === id ? 'text-emerald-100' : 'text-slate-400'}`}>
                {content.arabic}
            </span>
          </div>
          <span className={`text-xs font-black px-4 py-2 rounded-2xl shrink-0 ms-4 transition-colors ${activeId === id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'}`}>
            {defaultTarget}
          </span>
        </button>
    );
}

export default TasbihCounter;
