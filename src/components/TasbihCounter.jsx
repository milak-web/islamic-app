import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Minus, Settings, List, ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../context/UserStatsContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adhkarContent, prayerRoutines } from '../data/adhkar';

const TasbihCounter = () => {
  const { t, language } = useLanguage();
  const { recordTasbih } = useUserStats();
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
  const [customPlan, setCustomPlan] = useState(() => {
    const saved = localStorage.getItem('customTasbihPlan');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('customTasbihPlan', JSON.stringify(customPlan));
  }, [customPlan]);

  const toggleInPlan = (id) => {
    setCustomPlan(prev => {
      const exists = prev.find(item => item.id === id);
      if (exists) return prev.filter(item => item.id !== id);
      return [...prev, { id, target: 33 }];
    });
  };

  const startCustomPlan = () => {
    if (customPlan.length === 0) return;
    setRoutineSteps(customPlan);
    setCurrentStepIndex(0);
    setMode('routine');
    setRoutineCompleted(false);
    loadStep(customPlan[0]);
  };

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
      const newCount = count + 1;
      setCount(newCount);
      recordTasbih(currentAdhkarId, 1, newCount);
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
    <div className="max-w-2xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-4">
      {/* Header / Mode Switcher */}
      <div className="flex items-center justify-between px-2 shrink-0 pb-3">
        {mode === 'routine' ? (
           <button onClick={() => navigate('/')} className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-bold">
             <ChevronLeft size={20} /> {t('back')}
           </button>
        ) : (
           <div className="text-center w-full">
             <h1 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">{t('tasbihCounter')}</h1>
           </div>
        )}
      </div>

      {mode === 'routine' && (
        <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden mx-2 shrink-0 mb-3">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${((currentStepIndex) / routineSteps.length) * 100}%` }}
          ></div>
        </div>
      )}

      {/* Main Card - Flex to fill available space */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 relative">
        {/* Progress Bar at top */}
        <div className="h-1.5 bg-slate-50 w-full overflow-hidden shrink-0">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* 1. Header Area (Fixed) */}
        <div className="p-3 border-b border-slate-50 bg-white/80 backdrop-blur-sm z-10 shrink-0 text-center">
          <h2 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
            {language === 'ar' ? currentContent.title.ar : currentContent.title.en}
          </h2>
        </div>

        {/* 2. Content Display (Scrollable - Maximize Space) */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth flex flex-col">
          <div className="w-full text-center space-y-6 my-auto py-4">
            <p className="text-4xl md:text-5xl lg:text-7xl font-quran leading-relaxed text-slate-800 drop-shadow-sm px-2 w-full break-words" dir="rtl">
              {currentContent.arabic}
            </p>

            {language !== 'ar' && currentContent.transliteration && (
               <p className="text-slate-500 italic text-base md:text-xl border-t border-slate-50 pt-6 px-4 max-w-prose mx-auto leading-relaxed">
                 {currentContent.transliteration}
               </p>
            )}
          </div>
        </div>

        {/* 3. Controls (Fixed at Bottom) */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/40 shrink-0 flex flex-col items-center gap-4 z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-slate-900 tabular-nums tracking-tighter drop-shadow-sm">
              {count}
            </span>
            <span className="text-lg font-bold text-slate-300 uppercase tracking-widest">
              / {target}
            </span>
          </div>

          <div className="flex items-center justify-center gap-8 w-full">
            {!isTargetReached && (
              <button 
                onClick={decrement} 
                disabled={count === 0}
                className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-white rounded-2xl transition-all active:scale-90 disabled:opacity-0"
              >
                <Minus size={24} />
              </button>
            )}

            {mode === 'routine' && isTargetReached ? (
              <button 
                onClick={nextStep}
                className="px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest"
              >
                {currentStepIndex < routineSteps.length - 1 ? t('next') : t('finish')} <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                onClick={increment}
                className="w-24 h-24 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xl shadow-emerald-600/30 transition-all transform active:scale-95 flex items-center justify-center focus:outline-none border-8 border-white group"
              >
                <Plus size={40} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            )}

            {!isTargetReached && (
              <button 
                onClick={reset} 
                className="p-3 text-slate-300 hover:text-amber-600 hover:bg-white rounded-2xl transition-all active:scale-90"
              >
                <RotateCcw size={24} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Tabs (Only in Counter Mode) */}
      {mode === 'counter' && (
        <div className="mt-4 shrink-0 px-2 flex flex-col gap-2 max-h-[180px]">
          <div className="flex items-center justify-between">
            <div className="flex overflow-x-auto pb-1 gap-2 border-b border-slate-200 no-scrollbar flex-1">
              {['common', 'salah', 'morning', 'evening', 'my-plan'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-white text-emerald-700 border-x border-t border-slate-200 shadow-sm' 
                      : 'text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  {tab === 'my-plan' ? '★ ' + t('myPlan') : t(tab)}
                </button>
              ))}
            </div>
            
            {activeTab === 'my-plan' && customPlan.length > 0 && (
              <button 
                onClick={startCustomPlan}
                className="ms-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 animate-pulse"
              >
                {t('startRoutine')}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 overflow-y-auto custom-scrollbar pb-2 px-1">
             {activeTab === 'my-plan' ? (
               customPlan.length > 0 ? (
                 customPlan.map(item => (
                   <div key={item.id} className="relative group">
                     <PresetButton id={item.id} defaultTarget={item.target} onSelect={selectPreset} activeId={currentAdhkarId} />
                     <button 
                        onClick={() => toggleInPlan(item.id)}
                        className="absolute -top-1 -right-1 p-1 bg-red-50 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                     >
                        <Minus size={10} />
                     </button>
                   </div>
                 ))
               ) : (
                 <div className="w-full py-4 text-center text-slate-400 text-[10px] font-black uppercase bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   {t('noItemsInPlan')}
                 </div>
               )
             ) : (
               Object.entries(adhkarContent)
                 .filter(([id, content]) => content?.tags?.includes(activeTab))
                 .map(([id, content]) => (
                   <div key={id} className="relative group">
                     <PresetButton id={id} defaultTarget={33} onSelect={selectPreset} activeId={currentAdhkarId} />
                     <button 
                        onClick={(e) => { e.stopPropagation(); toggleInPlan(id); }}
                        className={`absolute -top-1 -right-1 p-1 rounded-full shadow-sm transition-all z-20 ${
                          customPlan.find(p => p.id === id) 
                            ? 'bg-amber-100 text-amber-600 opacity-100' 
                            : 'bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100'
                        }`}
                     >
                        <Plus size={10} />
                     </button>
                   </div>
                 ))
             )}
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
          className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 group whitespace-nowrap ${
            activeId === id
              ? 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/10' 
              : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'
          }`}
        >
          <span className={`font-black uppercase tracking-tighter text-[9px] ${activeId === id ? 'text-white' : 'text-slate-700'}`}>
              {language === 'ar' ? content.title.ar : content.title.en}
          </span>
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${activeId === id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
            {defaultTarget}
          </span>
        </button>
    );
}

export default TasbihCounter;
