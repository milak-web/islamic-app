import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { duaCategories } from '../data/duaData';
import { Sun, Moon, BookOpen, Shield, Navigation, ChevronDown, ChevronUp, Search, Share2, Copy, Heart, Home, MapPin, RefreshCw } from 'lucide-react';

const DuaReader = () => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('morning');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDua, setExpandedDua] = useState(null);

  const icons = {
    Sun: Sun,
    Moon: Moon,
    BookOpen: BookOpen,
    Shield: Shield,
    Navigation: Navigation,
    Heart: Heart,
    Home: Home,
    MapPin: MapPin,
    RefreshCw: RefreshCw
  };

  const filteredCategories = duaCategories.map(cat => ({
    ...cat,
    duas: cat.duas.filter(d => 
      d.translation[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.transliteration.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.duas.length > 0);

  const toggleDua = (id) => {
    setExpandedDua(expandedDua === id ? null : id);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-800">{t('dua')}</h1>
        <div className="relative">
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 w-full md:w-64"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-2 overflow-x-auto lg:overflow-visible flex lg:block gap-2 pb-2 lg:pb-0">
          {duaCategories.map((category) => {
            const Icon = icons[category.icon] || BookOpen;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-3 p-3 rounded-lg w-full transition whitespace-nowrap lg:whitespace-normal
                  ${activeCategory === category.id 
                    ? 'bg-emerald-100 text-emerald-800 font-medium' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                  }`}
              >
                <Icon size={20} />
                <span>{language === 'ar' ? category.title.ar : category.title.en}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {(searchTerm ? filteredCategories : duaCategories.filter(c => c.id === activeCategory)).map(category => (
            <div key={category.id} className="space-y-4">
              {searchTerm && (
                <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
                  {language === 'ar' ? category.title.ar : category.title.en}
                </h3>
              )}
              
              {category.duas.map(dua => (
                <div key={dua.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded">
                      {dua.reference}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(dua.arabic)}
                        className="text-slate-400 hover:text-emerald-600 transition"
                        title={t('copy')}
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-right font-arabic text-2xl leading-loose text-emerald-900" dir="rtl">
                      {dua.arabic}
                    </p>
                    
                    <div className="border-t border-slate-50 pt-4">
                      <p className="text-slate-600 italic mb-2 text-sm">{dua.transliteration}</p>
                      <p className="text-slate-800 font-medium">
                        {language === 'ar' ? dua.translation.ar : dua.translation.en}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DuaReader;
