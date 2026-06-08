import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, Moon, Clock, Home, Globe, Heart, Volume2 } from 'lucide-react';
import QuranReader from './components/QuranReader';
import SurahDetail from './components/SurahDetail';
import ReadingMode from './components/QuranReader/ReadingMode';
import HadithReader from './components/HadithReader';
import HadithChapters from './components/HadithChapters';
import HadithList from './components/HadithList';
import PrayerTimes from './components/PrayerTimes';
import TasbihCounter from './components/TasbihCounter';
import DuaReader from './components/DuaReader';
import QuranAudioPlayer from './components/QuranAudioPlayer';
import Dashboard from './components/Dashboard';
import About from './components/About';
import NetworkStatus from './components/NetworkStatus';
import ForegroundAdhanManager from './components/ForegroundAdhanManager';
import { useLanguage } from './context/LanguageContext';
import { ReadingProvider } from './context/ReadingContext';

function AppContent() {
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  const navItems = [
    { to: "/", icon: Home, label: t('home') },
    { to: "/quran", icon: BookOpen, label: t('quran') },
    { to: "/hadith", icon: BookOpen, label: t('hadith') },
    { to: "/dua", icon: Heart, label: t('dua') },
    { to: "/prayer-times", icon: Clock, label: t('prayerTimes') },
    { to: "/tasbih", icon: Moon, label: t('tasbih') },
    { to: "/listen", icon: Volume2, label: t('listen') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <NetworkStatus />
      <ForegroundAdhanManager />
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <Moon className="h-8 w-8 text-emerald-200" />
            <span>{t('appName')}</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex space-x-6 rtl:space-x-reverse">
              {navItems.map((item, idx) => (
                <Link key={idx} to={item.to} className="hover:text-emerald-200 flex items-center gap-1 transition">
                  <item.icon size={18} /> {item.label}
                </Link>
              ))}
              <Link to="/about" className="hover:text-emerald-200 flex items-center gap-1 transition"><Clock size={18} /> {t('about')}</Link>
            </nav>
            
            <button 
              onClick={toggleLanguage}
              className="bg-emerald-700/50 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-emerald-500"
            >
              <Globe size={16} />
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 mb-20 md:mb-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quran" element={<QuranReader />} />
          <Route path="/quran/read" element={<ReadingMode />} />
          <Route path="/quran/read/:surahNumber" element={<ReadingMode />} />
          <Route path="/quran/:id" element={<SurahDetail />} />
          <Route path="/hadith" element={<HadithReader />} />
          <Route path="/hadith/:edition" element={<HadithChapters />} />
          <Route path="/hadith/:edition/:section" element={<HadithList />} />
          <Route path="/dua" element={<DuaReader />} />
          <Route path="/prayer-times" element={<PrayerTimes />} />
          <Route path="/tasbih" element={<TasbihCounter />} />
          <Route path="/listen" element={<QuranAudioPlayer />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-6 mt-auto hidden md:block">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">&copy; {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}</p>
          <Link to="/about" className="text-emerald-400 hover:text-emerald-300 text-sm">{t('disclaimer')}</Link>
        </div>
      </footer>
      
      {/* Mobile Navigation - Squeezed with "Pop-up" active state */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 px-1 py-1 overflow-visible">
        <div className="flex items-end justify-around w-full max-w-full">
          {navItems.map((item, idx) => {
            const active = isCurrent(item.to);
            return (
              <Link 
                key={idx} 
                to={item.to} 
                className={`flex flex-col items-center transition-all duration-300 relative ${active ? '-translate-y-4' : 'translate-y-0'}`}
                style={{ width: `${100 / navItems.length}%` }}
              >
                <div className={`flex flex-col items-center transition-all duration-300 ${active ? 'scale-125' : 'scale-100'}`}>
                  <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-transparent text-slate-400'}`}>
                    <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center ${active ? 'opacity-100 text-emerald-700' : 'opacity-0 h-0'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <ReadingProvider>
      <Router>
        <AppContent />
      </Router>
    </ReadingProvider>
  );
}

export default App;
