import React, { useEffect, useMemo, useState } from 'react';
import { Star, CheckCircle2, Trophy, Calendar, Book, Heart, Moon, Sun, Sunrise, CloudMoon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useReading } from '../context/ReadingContext';
import {
  addMinutes,
  buildHijriPeriodKey,
  getHijriDateInfo,
  getHijriMonthLength,
  getPrayerMoments,
  getStoredPrayerCoords,
  isTimeWithinWindow
} from '../utils/islamicCalendar';

const DAILY_COMPLETIONS_STORAGE_KEY = 'completedChallenges';
const PERIOD_PROGRESS_STORAGE_KEY = 'achievementProgress';

const SpecialEvents = () => {
  const { t, language } = useLanguage();
  const { readingLog } = useReading();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedChallenges, setCompletedChallenges] = useState(() => {
    const saved = localStorage.getItem(DAILY_COMPLETIONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [achievementProgress, setAchievementProgress] = useState(() => {
    const saved = localStorage.getItem(PERIOD_PROGRESS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(PERIOD_PROGRESS_STORAGE_KEY, JSON.stringify(achievementProgress));
  }, [achievementProgress]);

  const todayKey = useMemo(() => (
    `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`
  ), [currentTime]);

  const dayOfWeek = currentTime.getDay();
  const hijriDate = useMemo(() => getHijriDateInfo(currentTime, language), [currentTime, language]);
  const prayerMoments = useMemo(() => getPrayerMoments(currentTime, getStoredPrayerCoords()), [currentTime]);
  const hijriMonthLength = useMemo(() => getHijriMonthLength(currentTime), [currentTime]);
  const currentHijriMonthKey = useMemo(() => buildHijriPeriodKey(hijriDate), [hijriDate]);

  const ramadanReadingProgress = useMemo(() => {
    if (hijriDate.month !== 9) {
      return { count: 0, goal: 604 };
    }

    const uniquePages = new Set();

    Object.entries(readingLog || {}).forEach(([dateKey, log]) => {
      if (!Array.isArray(log?.completedPages) || log.completedPages.length === 0) {
        return;
      }

      const [year, month, day] = dateKey.split('-').map(Number);
      if (!year || !month || !day) {
        return;
      }

      const logDate = new Date(year, month - 1, day, 12);
      const logHijri = getHijriDateInfo(logDate, 'en');

      if (logHijri.year === hijriDate.year && logHijri.month === 9) {
        log.completedPages.forEach((pageNumber) => uniquePages.add(pageNumber));
      }
    });

    return {
      count: uniquePages.size,
      goal: 604
    };
  }, [readingLog, hijriDate.month, hijriDate.year]);

  const events = useMemo(() => {
    const currentEvents = [];
    const addEvent = (event) => currentEvents.push(event);

    const afterSalahWindows = [
      { prayerKey: 'fajr', start: prayerMoments.fajr, end: addMinutes(prayerMoments.fajr, 45) },
      { prayerKey: 'dhuhr', start: prayerMoments.dhuhr, end: addMinutes(prayerMoments.dhuhr, 45) },
      { prayerKey: 'asr', start: prayerMoments.asr, end: addMinutes(prayerMoments.asr, 45) },
      { prayerKey: 'maghrib', start: prayerMoments.maghrib, end: addMinutes(prayerMoments.maghrib, 45) },
      { prayerKey: 'isha', start: prayerMoments.isha, end: addMinutes(prayerMoments.isha, 45) }
    ];

    const activeAfterSalahWindow = afterSalahWindows.find(({ start, end }) => (
      isTimeWithinWindow(currentTime, start, end)
    ));

    if (activeAfterSalahWindow) {
      addEvent({
        id: `after-salah-${activeAfterSalahWindow.prayerKey}`,
        title: `${t('afterSalahAdhkar')} · ${t(activeAfterSalahWindow.prayerKey)}`,
        description: t('afterSalahDesc'),
        icon: <Star className="text-emerald-500" />,
        link: '/tasbih?tab=salah',
        linkKind: 'tasbih',
        priority: 140
      });
    }

    if (isTimeWithinWindow(currentTime, prayerMoments.fajr, prayerMoments.dhuhr)) {
      addEvent({
        id: 'morning-adhkar',
        title: t('morningAdhkar'),
        description: t('morningAdhkarDesc'),
        icon: <Sunrise className="text-orange-400" />,
        link: '/tasbih?tab=morning',
        linkKind: 'tasbih',
        priority: 125
      });
    }

    if (isTimeWithinWindow(currentTime, prayerMoments.duhaStart, addMinutes(prayerMoments.dhuhr, -10))) {
      addEvent({
        id: 'duha-prayer',
        title: t('duhaPrayer'),
        description: t('duhaDesc'),
        icon: <Sun className="text-yellow-500" />,
        manualTracking: true,
        priority: 118
      });
    }

    if (isTimeWithinWindow(currentTime, prayerMoments.asr, prayerMoments.maghrib)) {
      addEvent({
        id: 'evening-adhkar',
        title: t('eveningAdhkar'),
        description: t('eveningAdhkarDesc'),
        icon: <CloudMoon className="text-indigo-400" />,
        link: '/tasbih?tab=evening',
        linkKind: 'tasbih',
        priority: 124
      });
    }

    if (isTimeWithinWindow(currentTime, prayerMoments.isha, prayerMoments.nextFajr)) {
      addEvent({
        id: 'witr-prayer',
        title: t('witrPrayer'),
        description: t('witrDesc'),
        icon: <Moon className="text-slate-700" />,
        manualTracking: true,
        priority: 117
      });

      addEvent({
        id: 'nightly-mulk',
        title: t('nightlySunnah'),
        description: t('surahAlMulkDesc'),
        icon: <Book className="text-indigo-500" />,
        link: '/quran/read/67',
        linkKind: 'reading',
        autoTracked: true,
        priority: 112
      });
    }

    if (isTimeWithinWindow(currentTime, prayerMoments.lastThirdStart, prayerMoments.nextFajr)) {
      addEvent({
        id: 'tahajjud-prayer',
        title: t('tahajjudPrayer'),
        description: t('tahajjudDesc'),
        icon: <Moon className="text-slate-600" />,
        manualTracking: true,
        priority: 130
      });
    }

    if (dayOfWeek === 5) {
      addEvent({
        id: 'friday-kahf',
        title: t('fridayKahfChallenge'),
        description: t('surahAlKahfDesc'),
        icon: <Book className="text-blue-500" />,
        link: '/quran/read/18',
        linkKind: 'reading',
        autoTracked: true,
        priority: 150
      });

      addEvent({
        id: 'friday-salawat',
        title: t('fridaySustenance'),
        description: t('fridaySustenanceDesc'),
        icon: <Heart className="text-pink-500" />,
        link: '/tasbih?tab=common',
        linkKind: 'tasbih',
        priority: 119
      });
    }

    if (dayOfWeek === 1 || dayOfWeek === 4) {
      addEvent({
        id: `fasting-${dayOfWeek === 1 ? 'monday' : 'thursday'}`,
        title: dayOfWeek === 1 ? t('mondaySunnah') : t('thursdaySunnah'),
        description: t('fastingSunnahDesc'),
        icon: <Heart className="text-red-500" />,
        manualTracking: true,
        priority: 116
      });
    }

    if ([13, 14, 15].includes(hijriDate.day)) {
      addEvent({
        id: `white-days-${hijriDate.day}`,
        title: t('whiteDaysFasting'),
        description: t('whiteDaysFastingDesc'),
        icon: <Moon className="text-sky-500" />,
        manualTracking: true,
        priority: 121
      });
    }

    if (hijriDate.month === 1 && hijriDate.day === 1) {
      addEvent({
        id: 'islamic-new-year',
        title: t('islamicNewYear'),
        description: t('islamicNewYearDesc'),
        icon: <Star className="text-amber-500" />,
        priority: 90
      });
    }

    if (hijriDate.month === 1 && hijriDate.day === 9) {
      addEvent({
        id: 'day-of-tasua',
        title: t('tasuaFast'),
        description: t('tasuaFastDesc'),
        icon: <Star className="text-cyan-500" />,
        manualTracking: true,
        priority: 135
      });
    }

    if (hijriDate.month === 1 && hijriDate.day === 10) {
      addEvent({
        id: 'day-of-ashura',
        title: t('dayOfAshura'),
        description: t('dayOfAshuraDesc'),
        icon: <Star className="text-sky-500" />,
        manualTracking: true,
        priority: 136
      });
    }

    if (hijriDate.month === 9) {
      addEvent({
        id: 'ramadan-fast-track',
        title: t('ramadanFastToday'),
        description: t('ramadanFastTodayDesc'),
        icon: <Moon className="text-emerald-500" />,
        manualTracking: true,
        manualPeriod: {
          periodKey: currentHijriMonthKey,
          goal: hijriMonthLength,
          unitKey: 'days'
        },
        priority: 145
      });

      addEvent({
        id: 'ramadan-khatam',
        title: t('ramadanKhatam'),
        description: t('ramadanKhatamDesc'),
        icon: <Book className="text-emerald-600" />,
        link: '/quran/read',
        linkKind: 'reading',
        autoTracked: true,
        autoProgress: {
          count: ramadanReadingProgress.count,
          goal: ramadanReadingProgress.goal,
          unitKey: 'pages'
        },
        priority: 142
      });

      if (hijriDate.day >= 21) {
        addEvent({
          id: 'last-ten-nights',
          title: t('lastTenNights'),
          description: t('lastTenNightsDesc'),
          icon: <Star className="text-violet-500" />,
          manualTracking: true,
          manualPeriod: {
            periodKey: currentHijriMonthKey,
            goal: 10,
            unitKey: 'days'
          },
          priority: 148
        });
      }
    }

    if (hijriDate.month === 10 && hijriDate.day === 1) {
      addEvent({
        id: 'eid-al-fitr',
        title: t('eidAlFitr'),
        description: t('eidAlFitrDesc'),
        icon: <Heart className="text-rose-500" />,
        priority: 108
      });
    }

    if (hijriDate.month === 10 && hijriDate.day > 1) {
      addEvent({
        id: 'six-of-shawwal',
        title: t('sixOfShawwal'),
        description: t('sixOfShawwalDesc'),
        icon: <Heart className="text-fuchsia-500" />,
        manualTracking: true,
        manualPeriod: {
          periodKey: currentHijriMonthKey,
          goal: 6,
          unitKey: 'days'
        },
        priority: 138
      });
    }

    if (hijriDate.month === 12 && hijriDate.day <= 10) {
      addEvent({
        id: 'first-ten-dhul-hijjah',
        title: t('firstTenDhulHijjah'),
        description: t('firstTenDhulHijjahDesc'),
        icon: <Star className="text-amber-600" />,
        manualTracking: true,
        manualPeriod: {
          periodKey: currentHijriMonthKey,
          goal: 10,
          unitKey: 'days'
        },
        priority: 141
      });
    }

    if (hijriDate.month === 12 && hijriDate.day === 9) {
      addEvent({
        id: 'day-of-arafah',
        title: t('dayOfArafah'),
        description: t('dayOfArafahDesc'),
        icon: <Sun className="text-orange-500" />,
        manualTracking: true,
        priority: 143
      });
    }

    if (hijriDate.month === 12 && hijriDate.day === 10) {
      addEvent({
        id: 'eid-al-adha',
        title: t('eidAlAdha'),
        description: t('eidAlAdhaDesc'),
        icon: <Heart className="text-red-500" />,
        priority: 109
      });
    }

    return currentEvents.sort((first, second) => second.priority - first.priority);
  }, [
    currentHijriMonthKey,
    currentTime,
    dayOfWeek,
    hijriDate,
    hijriMonthLength,
    prayerMoments,
    ramadanReadingProgress.count,
    ramadanReadingProgress.goal,
    t
  ]);

  const toggleChallenge = (event) => {
    if (event.manualPeriod) {
      setAchievementProgress((previous) => {
        const eventProgress = previous[event.id] || {};
        const currentEntries = new Set(eventProgress[event.manualPeriod.periodKey] || []);

        if (currentEntries.has(todayKey)) {
          currentEntries.delete(todayKey);
        } else {
          currentEntries.add(todayKey);
        }

        return {
          ...previous,
          [event.id]: {
            ...eventProgress,
            [event.manualPeriod.periodKey]: Array.from(currentEntries).sort()
          }
        };
      });
      return;
    }

    const newCompleted = { ...completedChallenges };

    if (newCompleted[event.id] === todayKey) {
      delete newCompleted[event.id];
    } else {
      newCompleted[event.id] = todayKey;
    }

    setCompletedChallenges(newCompleted);
    localStorage.setItem(DAILY_COMPLETIONS_STORAGE_KEY, JSON.stringify(newCompleted));
  };

  const getEventStatus = (event) => {
    if (event.autoProgress) {
      const isCompleted = event.autoProgress.count >= event.autoProgress.goal;

      return {
        isCompleted,
        progressLabel: `${event.autoProgress.count}/${event.autoProgress.goal} ${t(event.autoProgress.unitKey)}`
      };
    }

    if (event.manualPeriod) {
      const entries = achievementProgress[event.id]?.[event.manualPeriod.periodKey] || [];
      const isTrackedToday = entries.includes(todayKey);
      const goalReached = entries.length >= event.manualPeriod.goal;

      return {
        isCompleted: isTrackedToday || goalReached,
        progressLabel: `${entries.length}/${event.manualPeriod.goal} ${t(event.manualPeriod.unitKey)}`
      };
    }

    if (event.manualTracking || event.autoTracked) {
      return {
        isCompleted: completedChallenges[event.id] === todayKey,
        progressLabel: null
      };
    }

    return {
      isCompleted: false,
      progressLabel: null
    };
  };

  if (events.length === 0) {
    return null;
  }

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
          <span className="text-[10px] font-bold text-slate-500">
            {t('hijriDate')}: {hijriDate.label}
          </span>
          <span className="text-[10px] font-bold text-emerald-600/60">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events.map((event) => {
          const status = getEventStatus(event);

          return (
            <div
              key={event.id}
              className={`group relative p-4 rounded-[2rem] border transition-all duration-500 ${
                status.isCompleted
                  ? 'bg-emerald-50/50 border-emerald-100 opacity-60'
                  : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl transition-all duration-500 ${
                  status.isCompleted ? 'bg-emerald-100/50 rotate-12' : 'bg-slate-50 group-hover:bg-emerald-50 group-hover:-rotate-6'
                }`}>
                  {React.cloneElement(event.icon, { size: 26 })}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-black truncate text-sm uppercase tracking-tight ${status.isCompleted ? 'text-emerald-800/60' : 'text-slate-800'}`}>
                      {event.title}
                    </h4>
                    {status.isCompleted && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                  </div>

                  <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-3">
                    {event.description}
                  </p>

                  {status.progressLabel && (
                    <div className="mb-4 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      <Trophy size={10} />
                      {status.progressLabel}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {event.link && (
                      <Link
                        to={event.link}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                          status.isCompleted
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {event.linkKind === 'tasbih'
                          ? t('openTasbih')
                          : (status.isCompleted ? t('readAgain') : t('startReading'))}
                      </Link>
                    )}

                    {event.manualTracking && (
                      <button
                        onClick={() => toggleChallenge(event)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                          status.isCompleted
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status.isCompleted ? t('completed') : t('markAsDone')}
                      </button>
                    )}

                    {event.autoTracked && !status.isCompleted && (
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          {t('autoTracking')}
                        </span>
                      </div>
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
