import React, { createContext, useContext, useState, useEffect } from 'react';

const UserStatsContext = createContext();

export const UserStatsProvider = ({ children }) => {
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('userStats');
    return saved ? JSON.parse(saved) : {
      hasanat: 0,
      todayHasanat: 0,
      streak: 0,
      lastActiveDate: null,
      streakSaved: false,
      dailyActions: {
        ayahsRead: 0,
        tasbihCount: 0,
        prayersCompleted: 0,
        completedPrayers: [], // Track specific prayers to prevent re-rewarding
        completedTasbihs: {}  // Track max counts per tasbih today
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
        todayHasanat: 0,
        streak: newStreak,
        lastActiveDate: today,
        streakSaved: streakSaved,
        dailyActions: { 
          ayahsRead: 0, 
          tasbihCount: 0, 
          prayersCompleted: 0,
          completedPrayers: [],
          completedTasbihs: {}
        }
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(stats));
  }, [stats]);

  const addHasanat = (amount, actionType, metadata = {}) => {
    setStats(prev => {
      const newDailyActions = { ...prev.dailyActions };
      let actualReward = amount;
      
      if (actionType === 'quran') {
        newDailyActions.ayahsRead += metadata.count || 1;
      } else if (actionType === 'tasbih') {
        const id = metadata.id;
        const currentMax = prev.dailyActions.completedTasbihs?.[id] || 0;
        const newTotal = metadata.totalCount;
        
        // Only reward for the "new" counts above the previous daily record
        if (newTotal > currentMax) {
          const rewardableCount = newTotal - currentMax;
          const baseRewardPerCount = amount / metadata.increment; // calculate per-unit reward
          actualReward = rewardableCount * baseRewardPerCount;
          
          newDailyActions.completedTasbihs = {
            ...(prev.dailyActions.completedTasbihs || {}),
            [id]: newTotal
          };
          newDailyActions.tasbihCount += rewardableCount;
        } else {
          actualReward = 0; // No new hasanat if they are just repeating old counts
        }
      } else if (actionType === 'prayer') {
        const prayerKey = metadata.prayerKey;
        if (prev.dailyActions.completedPrayers?.includes(prayerKey)) {
          actualReward = 0; // Already rewarded for this prayer today
        } else {
          newDailyActions.completedPrayers = [...(prev.dailyActions.completedPrayers || []), prayerKey];
          newDailyActions.prayersCompleted += 1;
        }
      }

      if (actualReward === 0) return prev;

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
        hasanat: prev.hasanat + actualReward,
        todayHasanat: prev.todayHasanat + actualReward,
        streak: newStreak,
        streakSaved: newStreakSaved,
        dailyActions: newDailyActions
      };
    });
  };

  // Backup stats whenever streak is > 0 to allow rebuilding
  useEffect(() => {
    if (stats.streak > 0) {
      localStorage.setItem('userStats_backup', JSON.stringify(stats));
    }
  }, [stats.streak]);

  const recordQuranReading = (text, ayahCount = 1) => {
    // 10 Hasanat per letter (Sunan al-Tirmidhi 2910)
    const letters = text.replace(/[\s\d\p{P}]/gu, '');
    const count = letters.length;
    const reward = count * 10;
    addHasanat(reward, 'quran', { count: ayahCount });
  };

  const recordTasbih = (id, count = 1, totalCount = 0) => {
    // Base 10 hasanat per tasbih (Sahih Muslim 2097)
    let baseReward = 10;
    if (id === 'la-ilaha-illallah-wahdahu') baseReward = 100;
    
    addHasanat(baseReward * count, 'tasbih', { id, increment: count, totalCount });
  };

  const recordPrayer = (prayerKey) => {
    addHasanat(1000, 'prayer', { prayerKey });
  };

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
