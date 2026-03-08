import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BookOpen, Moon, Sun, Clock, Home, Info, Globe, Heart, Volume2 } from 'lucide-react';
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
import { useLanguage } from './context/LanguageContext';
import { ReadingProvider } from './context/ReadingContext';

function App() {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <ReadingProvider>
      <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <NetworkStatus />
        {/* Header */}
        <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold flex items-center gap-2">
              <Moon className="h-8 w-8 text-emerald-200" />
              <span>{t('appName')}</span>
            </Link>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex space-x-6 rtl:space-x-reverse">
                <Link to="/quran" className="hover:text-emerald-200 flex items-center gap-1 transition"><BookOpen size={18} /> {t('quran')}</Link>
                <Link to="/hadith" className="hover:text-emerald-200 flex items-center gap-1 transition"><BookOpen size={18} /> {t('hadith')}</Link>
                <Link to="/dua" className="hover:text-emerald-200 flex items-center gap-1 transition"><Heart size={18} /> {t('dua')}</Link>
                <Link to="/prayer-times" className="hover:text-emerald-200 flex items-center gap-1 transition"><Clock size={18} /> {t('prayerTimes')}</Link>
                <Link to="/tasbih" className="hover:text-emerald-200 flex items-center gap-1 transition"><Moon size={18} /> {t('tasbih')}</Link>
                <Link to="/listen" className="hover:text-emerald-200 flex items-center gap-1 transition"><Volume2 size={18} /> {t('listen')}</Link>
                <Link to="/about" className="hover:text-emerald-200 flex items-center gap-1 transition"><Info size={18} /> {t('about')}</Link>
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
        <main className="flex-grow container mx-auto px-4 py-8">
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
        <footer className="bg-slate-800 text-slate-400 py-6 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-2">&copy; {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}</p>
            <Link to="/about" className="text-emerald-400 hover:text-emerald-300 text-sm">{t('disclaimer')}</Link>
          </div>
        </footer>
        
        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 shadow-lg z-50">
          <Link to="/" className="flex flex-col items-center text-slate-600 hover:text-emerald-600">
            <Home size={24} />
            <span className="text-xs">{t('home')}</span>
          </Link>
          <Link to="/quran" className="flex flex-col items-center text-slate-600 hover:text-emerald-600">
            <BookOpen size={24} />
            <span className="text-xs">{t('quran')}</span>
          </Link>
          <Link to="/hadith" className="flex flex-col items-center text-slate-600 hover:text-emerald-600">
            <BookOpen size={24} />
            <span className="text-xs">{t('hadith')}</span>
          </Link>
          <Link to="/dua" className="flex flex-col items-center text-slate-600 hover:text-emerald-600">
            <BookOpen size={24} />
            <span className="text-xs">{t('dua')}</span>
          </Link>
          <Link to="/prayer-times" className="flex flex-col items-center text-slate-600 hover:text-emerald-600">
            <Clock size={24} />
            <span className="text-xs">{t('prayers')}</span>
          </Link>
          <Link to="/tasbih" className="flex flex-col items-center text-slate-600 hover:text-emerald-600">
            <Moon size={24} />
            <span className="text-xs">{t('tasbih')}</span>
          </Link>
        </nav>
      </div>
      </Router>
    </ReadingProvider>
  );
}

export default App;
