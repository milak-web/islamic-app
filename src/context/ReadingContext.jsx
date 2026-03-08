
import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const ReadingContext = createContext();

export const useReading = () => useContext(ReadingContext);

export const ReadingProvider = ({ children }) => {
  // Reading Log State
  const [readingLog, setReadingLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quranReadingLog')) || {};
    } catch (e) {
      return {};
    }
  });

  // Goal Settings State
  const [goalSettings, setGoalSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quranGoalSettings')) || {
        pagesPerDay: 20,
        khatamDays: 30,
        mode: 'khatam' // 'khatam' or 'daily'
      };
    } catch (e) {
      return { pagesPerDay: 20, khatamDays: 30, mode: 'khatam' };
    }
  });

  // Persist State
  useEffect(() => {
    localStorage.setItem('quranReadingLog', JSON.stringify(readingLog));
  }, [readingLog]);

  useEffect(() => {
    localStorage.setItem('quranGoalSettings', JSON.stringify(goalSettings));
  }, [goalSettings]);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Helper to get today's log safely
  const getTodayLog = useCallback(() => {
    const today = getTodayDate();
    return readingLog[today] || { pages: 0, completedChallenges: [], completedPages: [] };
  }, [readingLog]);

  // Mark a specific page as read
  const markPageRead = useCallback((pageNumber) => {
    const today = new Date().toISOString().split('T')[0];
    
    setReadingLog(prev => {
      const currentLog = prev[today] || { pages: 0, completedChallenges: [], completedPages: [] };
      const completedPages = currentLog.completedPages || [];
      
      if (!completedPages.includes(pageNumber)) {
        const newCompletedPages = [...completedPages, pageNumber];
        return {
          ...prev,
          [today]: {
            ...currentLog,
            completedPages: newCompletedPages,
            pages: newCompletedPages.length
          }
        };
      }
      return prev;
    });
  }, []);

  // Toggle a challenge
  const toggleChallenge = useCallback((challengeId) => {
    const today = new Date().toISOString().split('T')[0];
    
    setReadingLog(prev => {
      const currentLog = prev[today] || { pages: 0, completedChallenges: [], completedPages: [] };
      const currentChallenges = currentLog.completedChallenges || [];
      
      const newChallenges = currentChallenges.includes(challengeId)
        ? currentChallenges.filter(c => c !== challengeId)
        : [...currentChallenges, challengeId];
        
      return {
        ...prev,
        [today]: { ...currentLog, completedChallenges: newChallenges }
      };
    });
  }, []);

  // Update goal settings
  const updateSettings = useCallback((newSettings) => {
    setGoalSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Calculate target based on settings
  const calculateTarget = useCallback(() => {
    if (goalSettings.mode === 'khatam') {
      return Math.ceil(604 / (parseInt(goalSettings.khatamDays) || 30));
    }
    return parseInt(goalSettings.pagesPerDay) || 20;
  }, [goalSettings]);

  // Get progress for today
  const getProgress = useCallback(() => {
    const target = calculateTarget();
    const current = getTodayLog().pages || 0;
    const percentage = Math.min((current / target) * 100, 100);
    return { current, target, percentage };
  }, [calculateTarget, getTodayLog]);

  return (
    <ReadingContext.Provider value={{
      readingLog,
      goalSettings,
      markPageRead,
      toggleChallenge,
      updateSettings,
      getProgress,
      todayLog: getTodayLog()
    }}>
      {children}
    </ReadingContext.Provider>
  );
};
