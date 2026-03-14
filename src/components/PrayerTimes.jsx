import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Navigation, Moon, Search, ChevronDown, WifiOff, Volume2, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { countries } from '../data/countries';
import * as adhan from 'adhan';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { NotificationService } from '../services/NotificationService';
import { motion, AnimatePresence } from 'framer-motion';

const PrayerTimes = () => {
  const { t, language } = useLanguage();
  const [times, setTimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem('prayerCity') || "Mecca");
  const [country, setCountry] = useState(() => localStorage.getItem('prayerCountry') || "Saudi Arabia");
  const [showCountryList, setShowCountryList] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedAdhan, setSelectedAdhan] = useState(() => localStorage.getItem('selectedAdhan') || 'adhan_makkah');
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem('prayerCoords');
    return saved ? JSON.parse(saved) : { latitude: 21.4225, longitude: 39.8262 };
  });
  const [nextPrayer, setNextPrayer] = useState(null);

  const adhanVoices = [
    { id: 'adhan_makkah', name: t('makkah') },
    { id: 'adhan_madinah', name: t('madinah') },
    { id: 'adhan_alaqsa', name: t('alaqsa') },
    { id: 'adhan_egypt', name: t('egypt') },
    { id: 'adhan_mishary', name: t('mishary') }
  ];

  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);

  const handleAdhanChange = (voiceId) => {
    setSelectedAdhan(voiceId);
    localStorage.setItem('selectedAdhan', voiceId);
    if (times) {
      const date = new Date();
      const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      NotificationService.scheduleAdhanNotifications(times.timings, dateStr);
    }
    setIsVoiceMenuOpen(false);
  };

  useEffect(() => {
    NotificationService.requestPermissions();
    NotificationService.scheduleDailyReminders();
    
    // Ensure selectedAdhan is loaded from storage
    const savedVoice = localStorage.getItem('selectedAdhan');
    if (savedVoice) setSelectedAdhan(savedVoice);
  }, []);

  useEffect(() => {
    if (city && city !== "Current Location") localStorage.setItem('prayerCity', city);
    if (country) localStorage.setItem('prayerCountry', country);
    if (coords) {
      localStorage.setItem('prayerCoords', JSON.stringify(coords));
    }
  }, [city, country, coords]);

  const filteredCountries = countries.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const calculateNextPrayer = (timings) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers = Object.entries(timings)
      .filter(([name]) => !['Sunset', 'Imsak', 'Midnight', 'Firstthird', 'Lastthird', 'Sunrise'].includes(name))
      .map(([name, time]) => {
        if (!time || typeof time !== 'string') return null;
        const [hours, minutes] = time.split(':').map(Number);
        return { name, totalMinutes: hours * 60 + minutes };
      })
      .filter(p => p !== null)
      .sort((a, b) => a.totalMinutes - b.totalMinutes);

    const next = prayers.find(p => p.totalMinutes > currentMinutes) || prayers[0];
    if (next) setNextPrayer(next.name);
  };

  const calculateOfflineTimes = (lat, lng) => {
    const date = new Date();
    const coordinates = new adhan.Coordinates(lat, lng);
    const params = adhan.CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    };

    const offlineData = {
      timings: {
        Fajr: formatTime(prayerTimes.fajr),
        Sunrise: formatTime(prayerTimes.sunrise),
        Dhuhr: formatTime(prayerTimes.dhuhr),
        Asr: formatTime(prayerTimes.asr),
        Maghrib: formatTime(prayerTimes.maghrib),
        Isha: formatTime(prayerTimes.isha),
        Imsak: formatTime(new Date(prayerTimes.fajr.getTime() - 10 * 60000)),
        Midnight: formatTime(new Date(prayerTimes.maghrib.getTime() + (prayerTimes.fajr.getTime() - prayerTimes.maghrib.getTime()) / 2))
      },
      date: {
        readable: date.toDateString(),
        hijri: {
          day: 'N/A',
          month: { ar: 'N/A', en: 'N/A' },
          year: 'N/A'
        }
      }
    };

    setTimes(offlineData);
    setIsOfflineMode(true);
    calculateNextPrayer(offlineData.timings);
    
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    NotificationService.scheduleAdhanNotifications(offlineData.timings, dateStr);
  };

  const getPrayerTimes = async () => {
    setLoading(true);
    setError(null);
    
    // Always calculate offline times first as a fallback/immediate view
    if (coords) {
      calculateOfflineTimes(coords.latitude, coords.longitude);
    }

    try {
      if (navigator.onLine) {
        const date = new Date();
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        
        let url = '';
        if (city && city !== "Current Location" && country) {
            url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=${country}&method=3`;
        } else if (coords) {
            url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=3`;
        }

        if (url) {
          const response = await fetch(url);
          const data = await response.json();
          if (data.code === 200) {
            setTimes(data.data);
            calculateNextPrayer(data.data.timings);
            NotificationService.scheduleAdhanNotifications(data.data.timings, dateStr);
            setIsOfflineMode(false);
          }
        }
      } else {
        setIsOfflineMode(true);
      }
    } catch (err) {
      console.error("API Error, using offline calculation:", err);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPrayerTimes();

    // Refresh every minute to update countdown/next prayer
    const interval = setInterval(() => {
      if (times) calculateNextPrayer(times.timings);
    }, 60000);

    return () => clearInterval(interval);
  }, [city, country, coords, times]);

  const testAdhanNotification = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        alert("Please enable notifications to test the Adhan sound.");
        return;
      }
      
      const now = new Date();
      const scheduleTime = new Date(now.getTime() + 3000); // 3 seconds later
      
      const selectedVoice = localStorage.getItem('selectedAdhan') || 'adhan_makkah';
      
      await LocalNotifications.schedule({
        notifications: [
          { 
            id: 999,
            title: "Adhan Test (Sound)",
            body: "This is a test of the Adhan notification sound.",
            schedule: { at: scheduleTime },
            sound: Capacitor.getPlatform() === 'android' ? selectedVoice : `${selectedVoice}.mp3`,
            extra: { type: 'test' }
          }
        ]
      });
      
      alert("Test scheduled for 3 seconds from now. If you don't hear sound, ensure your phone is not on silent and you are using the native app.");
    } catch (err) {
      console.error("Test notification failed:", err);
      alert("Failed to schedule test notification.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city && country) {
      // Clear coords when searching for a city manually
      setCoords(null);
      localStorage.removeItem('prayerCoords');
      getPrayerTimes();
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCoords(newCoords);
          localStorage.setItem('prayerCoords', JSON.stringify(newCoords));
          setCity("Current Location");
          setCountry("");
          // No need to call getPrayerTimes manually, we'll call it now
          // or rely on a state change. Let's call it to be sure.
          getPrayerTimes();
        },
        (err) => {
          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            setError('locationSecurityError');
          } else {
            setError('locationAccessError');
          }
          setLoading(false);
        }
      );
    } else {
      setError('geolocationNotSupported');
    }
  };

  const getPrayerName = (name) => t(name.toLowerCase());

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6 pb-12"
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex flex-col items-center gap-2"
        >
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 uppercase tracking-tighter">
            {t('prayerTimes')}
          </h1>
        </motion.div>
        
        <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('city')}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300 text-sm"
                />
              </div>
            </div>
            
            <div className="md:col-span-5 relative">
              <div 
                onClick={() => setShowCountryList(!showCountryList)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-all"
              >
                <span className={`font-bold text-sm ${country ? 'text-slate-800' : 'text-slate-300'}`}>
                  {country || t('country')}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCountryList ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {showCountryList && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-[100] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-2"
                  >
                    <div className="p-2">
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder={t('search')}
                        className="w-full px-4 py-2 text-xs bg-slate-50 border-none rounded-xl font-bold"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 space-y-1 custom-scrollbar">
                      {filteredCountries.map((c) => (
                        <div
                          key={c}
                          onClick={() => {
                            setCountry(c);
                            setShowCountryList(false);
                            setCountrySearch("");
                          }}
                          className={`px-4 py-2.5 text-xs rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                            country === c ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-emerald-50'
                          }`}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-full bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all font-black uppercase tracking-widest text-xs py-3 md:py-0"
              >
                {t('search')}
              </button>
            </div>
          </form>
          
          <div className="pt-4 border-t border-slate-50 flex flex-col items-center gap-4">
            <button
              onClick={getLocation}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-black uppercase tracking-tighter text-xs transition-all"
            >
              <Navigation size={14} className={loading && !times ? 'animate-spin' : ''} />
              {t('useMyLocation')}
            </button>

            <div className="w-full">
              <button 
                onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl group hover:bg-emerald-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Volume2 size={16} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {t('selectedAdhanVoice')}: <span className="text-emerald-600">{adhanVoices.find(v => v.id === selectedAdhan)?.name}</span>
                  </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isVoiceMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isVoiceMenuOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                      {adhanVoices.map(voice => (
                        <button
                          key={voice.id}
                          onClick={() => handleAdhanChange(voice.id)}
                          className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                            selectedAdhan === voice.id 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200'
                          }`}
                        >
                          {voice.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button
                onClick={testAdhanNotification}
                className="mt-4 w-full py-2 px-4 border border-dashed border-emerald-200 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                <Volume2 size={12} />
                {t('testAdhanNotification')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && !times ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-4"
          >
            <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('loading')}</p>
          </motion.div>
        ) : times ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 sm:p-8 text-white text-center relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                    <MapPin size={14} className="text-emerald-300" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest">
                      {city}{country ? `, ${country}` : ''}
                    </h2>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tighter flex items-center justify-center gap-3">
                      {times.date.readable}
                      {isOfflineMode && <WifiOff size={18} className="text-amber-300" />}
                    </h3>
                    <div className="text-emerald-200/60 font-arabic text-lg sm:text-xl tracking-widest">
                      {times.date.hijri.day} {times.date.hijri.month.ar} {times.date.hijri.year}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(times.timings).map(([name, time], index) => {
                  if (['Sunset', 'Imsak', 'Midnight', 'Firstthird', 'Lastthird'].includes(name)) return null;
                  const isNext = nextPrayer === name;
                  return (
                    <motion.div 
                      key={name} 
                      className={`flex justify-between items-center p-5 rounded-3xl border transition-all ${
                        isNext 
                        ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-600/20' 
                        : 'bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isNext ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {name}
                        </span>
                        <span className={`font-black text-lg tracking-tighter ${isNext ? 'text-white' : 'text-slate-800'}`}>
                          {getPrayerName(name)}
                        </span>
                      </div>
                      <span className={`text-xl font-black tracking-tighter ${isNext ? 'text-white' : 'text-emerald-600'}`}>
                        {time}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-center gap-8">
                 <div className="flex items-center gap-3">
                    <Clock size={16} className="text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('imsak')}</span>
                      <span className="text-sm font-black text-slate-800 tracking-tighter">{times.timings.Imsak}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Moon size={16} className="text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('midnight')}</span>
                      <span className="text-sm font-black text-slate-800 tracking-tighter">{times.timings.Midnight}</span>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrayerTimes;
