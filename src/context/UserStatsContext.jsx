import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserStatsContext = createContext();

export const UserStatsProvider = ({ children }) => {
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('userStats');
    return saved ? JSON.parse(saved) : {
      streak: 0,
      lastActiveDate: null,
      streakSaved: false,
      dailyActions: {
        ayahsRead: 0,
        tasbihCount: 0,
        prayersCompleted: 0,
        completedPrayers: [], // Track specific prayers to prevent re-rewarding
        completedTasbihs: {},  // Track max counts per tasbih today
        completedAyahs: [] // NEW: Track specific ayahs to prevent re-rewarding
      }
    };
  });

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Reset daily hasanat if new day
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let newStreak = stats.streak;
      let streakSaved = stats.streakSaved;

      if (stats.lastActiveDate === yesterdayStr) {
        // Active yesterday, continue streak
        newStreak += 1;
      } else if (stats.lastActiveDate !== null) {
        // Missed a day or more
        newStreak = 0;
        streakSaved = false; // Reset the save chance
      } else {
        // First time
        newStreak = 1;
      }

      setStats(prev => ({
        ...prev,
        streak: newStreak,
        lastActiveDate: today,
        streakSaved: streakSaved,
        dailyActions: { 
          ayahsRead: 0, 
          tasbihCount: 0, 
          prayersCompleted: 0,
          completedPrayers: [],
          completedTasbihs: {},
          completedAyahs: []
        }
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(stats));
  }, [stats]);

  const addHasanat = useCallback((amount, actionType, metadata = {}) => {
    setStats(prev => {
      const newDailyActions = { ...prev.dailyActions };
      
      if (actionType === 'quran') {
        const ayahId = metadata.ayahId;
        if (ayahId) {
          if (!prev.dailyActions.completedAyahs?.includes(ayahId)) {
            newDailyActions.completedAyahs = [...(prev.dailyActions.completedAyahs || []), ayahId];
            newDailyActions.ayahsRead += 1;
          }
        } else {
          newDailyActions.ayahsRead += metadata.count || 1;
        }
      } else if (actionType === 'tasbih') {
        const id = metadata.id;
        const currentMax = prev.dailyActions.completedTasbihs?.[id] || 0;
        const newTotal = metadata.totalCount;
        
        if (newTotal > currentMax) {
          const rewardableCount = newTotal - currentMax;
          newDailyActions.completedTasbihs = {
            ...(prev.dailyActions.completedTasbihs || {}),
            [id]: newTotal
          };
          newDailyActions.tasbihCount += rewardableCount;
        }
      } else if (actionType === 'prayer') {
        const prayerKey = metadata.prayerKey;
        if (!prev.dailyActions.completedPrayers?.includes(prayerKey)) {
          newDailyActions.completedPrayers = [...(prev.dailyActions.completedPrayers || []), prayerKey];
          newDailyActions.prayersCompleted += 1;
        }
      }

      // Check for streak rebuild
      let newStreak = prev.streak;
      let newStreakSaved = prev.streakSaved;
      
      if (prev.streak === 0 && actionType === 'quran' && newDailyActions.ayahsRead >= 30 && !prev.streakSaved) {
        const savedStats = JSON.parse(localStorage.getItem('userStats_backup') || '{}');
        if (savedStats.streak > 0) {
          newStreak = savedStats.streak + 1;
          newStreakSaved = true;
        }
      }

      return {
        ...prev,
        streak: newStreak,
        streakSaved: newStreakSaved,
        dailyActions: newDailyActions
      };
    });
  }, []);

  // Backup stats whenever streak is > 0 to allow rebuilding
  useEffect(() => {
    if (stats.streak > 0) {
      localStorage.setItem('userStats_backup', JSON.stringify(stats));
    }
  }, [stats.streak]);

  const recordQuranReading = useCallback((text, ayahId) => {
    addHasanat(0, 'quran', { ayahId });
  }, [addHasanat]);

  const recordTasbih = useCallback((id, count = 1, totalCount = 0) => {
    addHasanat(0, 'tasbih', { id, increment: count, totalCount });
  }, [addHasanat]);

  const recordPrayer = useCallback((prayerKey) => {
    addHasanat(0, 'prayer', { prayerKey });
  }, [addHasanat]);

  return (
    <UserStatsContext.Provider value={{
      ...stats,
      recordQuranReading,
      recordTasbih,
      recordPrayer
    }}>
      {children}
    </UserStatsContext.Provider>
  );
};

export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) throw new Error("useUserStats must be used within UserStatsProvider");
  return context;
};
