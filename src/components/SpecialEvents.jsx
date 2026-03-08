import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, Trophy, Calendar, Book, Heart, ArrowRight, Moon, Sun, Sunrise, CloudMoon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SpecialEvents = () => {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedChallenges, setCompletedChallenges] = useState(() => {
    const saved = localStorage.getItem('completedChallenges');
    return saved ? JSON.parse(saved) : {};
  });

  // Update clock every minute to refresh time-based events
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const hour = currentTime.getHours();
    
    const currentEvents = [];

    // --- TIME-BASED DAILY EVENTS ---

    // Morning Adhkar (5 AM - 11 AM)
    if (hour >= 5 && hour < 11) {
      currentEvents.push({
        id: 'morning-adhkar',
        title: t('morningAdhkar'),
        description: t('morningAdhkarDesc'),
        icon: <Sunrise className="text-orange-400" />,
        type: 'tasbih-link',
        link: '/tasbih',
        reward: 30
      });
    }

    // Duha Prayer (Sunrise + 20m to Dhuhr - 20m, roughly 7 AM - 11:30 AM)
    if (hour >= 7 && hour < 12) {
        currentEvents.push({
          id: 'duha-prayer',
          title: t('duhaPrayer'),
          description: t('duhaDesc'),
          icon: <Sun className="text-yellow-500" />,
          type: 'event',
          reward: 40
        });
    }

    // Evening Adhkar (Asr to Sunset, roughly 3 PM - 7 PM)
    if (hour >= 15 && hour < 19) {
      currentEvents.push({
        id: 'evening-adhkar',
        title: t('eveningAdhkar'),
        description: t('eveningAdhkarDesc'),
        icon: <CloudMoon className="text-indigo-400" />,
        type: 'tasbih-link',
        link: '/tasbih',
        reward: 30
      });
    }

    // Tahajjud Prayer (1 AM - 4 AM)
    if (hour >= 1 && hour < 5) {
        currentEvents.push({
          id: 'tahajjud-prayer',
          title: t('tahajjudPrayer'),
          description: t('tahajjudDesc'),
          icon: <Moon className="text-slate-600" />,
          type: 'event',
          reward: 50
        });
    }

    // --- DAY-BASED WEEKLY EVENTS ---

    // Friday Sunnahs
    if (dayOfWeek === 5) {
      // Surah Al-Kahf
      currentEvents.push({
        id: 'friday-kahf',
        title: t('fridayKahfChallenge'),
        description: t('surahAlKahfDesc'),
        icon: <Book className="text-blue-500" />,
        type: 'reading-challenge',
        link: '/quran/read/18',
        reward: 100
      });

      // Salawat on Prophet (PBUH)
      currentEvents.push({
        id: 'friday-salawat',
        title: t('fridaySustenance'),
        description: t('fridaySustenanceDesc'),
        icon: <Heart className="text-pink-500" />,
        type: 'tasbih-link',
        link: '/tasbih',
        reward: 50
      });
    }

    // Monday/Thursday Sunnah: Fasting
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      currentEvents.push({
        id: `fasting-${dayOfWeek === 1 ? 'monday' : 'thursday'}`,
        title: dayOfWeek === 1 ? t('mondaySunnah') : t('thursdaySunnah'),
        description: t('fastingSunnahDesc'),
        icon: <Heart className="text-red-500" />,
        type: 'event',
        reward: 50
      });
    }

    // Nightly Sunnah: Surah Al-Mulk (Appears after Maghrib/Isha)
    if (hour >= 18 || hour < 4) {
        currentEvents.push({
            id: 'nightly-mulk',
            title: t('nightlySunnah'),
            description: t('surahAlMulkDesc'),
            icon: <Moon className="text-indigo-500" />,
            type: 'reading-challenge',
            link: '/quran/read/67',
            reward: 50
        });
    }

    setEvents(currentEvents);
  }, [t, currentTime]);

  const getTodayKey = () => {
    return `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
  };

  const toggleChallenge = (id) => {
    const todayKey = getTodayKey();
    const newCompleted = { ...completedChallenges };
    
    if (newCompleted[id] === todayKey) {
      delete newCompleted[id];
    } else {
      newCompleted[id] = todayKey;
    }
    
    setCompletedChallenges(newCompleted);
    localStorage.setItem('completedChallenges', JSON.stringify(newCompleted));
  };

  if (events.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2 uppercase tracking-tighter">
          <Trophy className="text-amber-500" size={22} />
          {t('specialEvents')}
        </h3>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} />
                {currentTime.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-[10px] font-bold text-emerald-600/60">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events.map((event) => {
          const todayKey = getTodayKey();
          const isCompleted = completedChallenges[event.id] === todayKey;
          
          return (
            <div 
              key={event.id}
              className={`group relative p-4 rounded-[2rem] border transition-all duration-500 ${
                isCompleted 
                ? 'bg-emerald-50/50 border-emerald-100 opacity-60' 
                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-100/50 rotate-12' : 'bg-slate-50 group-hover:bg-emerald-50 group-hover:-rotate-6'
                }`}>
                  {React.cloneElement(event.icon, { size: 26 })}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-black truncate text-sm uppercase tracking-tight ${isCompleted ? 'text-emerald-800/60' : 'text-slate-800'}`}>
                      {event.title}
                    </h4>
                    {isCompleted && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-4">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {event.link && (
                      <Link 
                        to={event.link}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                          isCompleted 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {event.type === 'tasbih-link' ? t('openTasbih') : (isCompleted ? t('readAgain') : t('startReading'))}
                      </Link>
                    )}
                    
                    {event.type === 'event' || (isCompleted && event.type !== 'tasbih-link') ? (
                      <button
                        onClick={() => toggleChallenge(event.id)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                          isCompleted 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {isCompleted ? t('completed') : t('markAsDone')}
                      </button>
                    ) : (
                      event.type === 'reading-challenge' && !isCompleted && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {t('autoTracking')}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpecialEvents;
