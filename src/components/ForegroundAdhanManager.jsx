import React, { useEffect, useRef, useState } from 'react';
import * as adhan from 'adhan';
import { useAudio } from '../context/AudioContext';

const ForegroundAdhanManager = () => {
  const { play, isPlaying, stop } = useAudio();
  const [lastTriggered, setLastTriggered] = useState(null);
  const checkInterval = useRef(null);

  useEffect(() => {
    const checkPrayerTimes = () => {
      const savedCoords = localStorage.getItem('prayerCoords');
      if (!savedCoords) return;

      const { latitude, longitude } = JSON.parse(savedCoords);
      const date = new Date();
      const coordinates = new adhan.Coordinates(latitude, longitude);
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

      const now = new Date();
      const prayers = [
        { name: 'Fajr', time: prayerTimes.fajr },
        { name: 'Dhuhr', time: prayerTimes.dhuhr },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isha', time: prayerTimes.isha }
      ];

      const currentMinuteStr = `${now.getHours()}:${now.getMinutes()}`;

      prayers.forEach(prayer => {
        const prayerTime = new Date(prayer.time);
        const prayerMinuteStr = `${prayerTime.getHours()}:${prayerTime.getMinutes()}`;

        if (currentMinuteStr === prayerMinuteStr && lastTriggered !== prayerMinuteStr) {
          console.log(`Triggering Foreground Adhan for ${prayer.name}`);
          const selectedAdhan = localStorage.getItem('selectedAdhan') || 'adhan_makkah';
          
          // Use the public folder path for the adhan mp3 files
          const adhanUrl = `/audio/${selectedAdhan}.mp3`;
          
          play(adhanUrl, { type: 'adhan', prayerName: prayer.name });
          setLastTriggered(prayerMinuteStr);
        }
      });

      // Reset lastTriggered if the minute has passed
      if (lastTriggered && lastTriggered !== currentMinuteStr) {
        setLastTriggered(null);
      }
    };

    // Check every 30 seconds
    checkInterval.current = setInterval(checkPrayerTimes, 30000);
    checkPrayerTimes(); // Initial check

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [lastTriggered, play]);

  return null; // This component doesn't render anything
};

export default ForegroundAdhanManager;
