import React, { useEffect, useRef, useState } from 'react';
import * as adhan from 'adhan';
import { useAudio } from '../context/AudioContext';

const ForegroundAdhanManager = () => {
  const { play } = useAudio();
  const [currentMinute, setCurrentMinute] = useState('');
  const [lastTriggeredMinute, setLastTriggeredMinute] = useState(null);
  const checkInterval = useRef(null);

  useEffect(() => {
    const updateMinute = () => {
      const now = new Date();
      setCurrentMinute(`${now.getHours()}:${now.getMinutes()}`);
    };

    updateMinute();
    checkInterval.current = setInterval(updateMinute, 10000); // Check every 10s

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  useEffect(() => {
    if (!currentMinute) return;

    const savedCoords = localStorage.getItem('prayerCoords');
    if (!savedCoords) return;

    const { latitude, longitude } = JSON.parse(savedCoords);
    const date = new Date();
    const coordinates = new adhan.Coordinates(latitude, longitude);
    const params = adhan.CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    prayers.forEach(prayer => {
      const prayerTime = new Date(prayer.time);
      const prayerMinuteStr = `${prayerTime.getHours()}:${prayerTime.getMinutes()}`;

      // If it's the prayer time and we haven't triggered for this specific minute yet
      if (currentMinute === prayerMinuteStr && lastTriggeredMinute !== prayerMinuteStr) {
        console.log(`Triggering Foreground Adhan for ${prayer.name}`);
        const selectedAdhan = localStorage.getItem('selectedAdhan') || 'adhan_makkah';
        const adhanUrl = `/audio/${selectedAdhan}.mp3`;
        
        play(adhanUrl, { type: 'adhan', prayerName: prayer.name });
        setLastTriggeredMinute(prayerMinuteStr);
      }
    });

    // Reset lastTriggeredMinute if the minute has passed
    if (lastTriggeredMinute && lastTriggeredMinute !== currentMinute) {
      setLastTriggeredMinute(null);
    }
  }, [currentMinute, lastTriggeredMinute, play]);

  return null;
};

export default ForegroundAdhanManager;
