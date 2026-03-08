import React from 'react';
import { Link } from 'react-router-dom';
import { Book, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HadithReader = () => {
  const { t, language } = useLanguage();

  // Curated list of collections with their API identifiers for both languages
  const collections = [
    { 
      name: { en: "Sahih al-Bukhari", ar: "صحيح البخاري" }, 
      id: { en: "eng-bukhari", ar: "ara-bukhari" }, 
      author: { en: "Imam Bukhari", ar: "الإمام البخاري" }, 
      count: "7,563" 
    },
    { 
      name: { en: "Sahih Muslim", ar: "صحيح مسلم" }, 
      id: { en: "eng-muslim", ar: "ara-muslim" }, 
      author: { en: "Imam Muslim", ar: "الإمام مسلم" }, 
      count: "7,500+" 
    },
    { 
      name: { en: "Sunan an-Nasa'i", ar: "سنن النسائي" }, 
      id: { en: "eng-nasai", ar: "ara-nasai" }, 
      author: { en: "Imam An-Nasa'i", ar: "الإمام النسائي" }, 
      count: "5,758" 
    },
    { 
      name: { en: "Sunan Abu Dawood", ar: "سنن أبي داود" }, 
      id: { en: "eng-abudawud", ar: "ara-abudawud" }, 
      author: { en: "Imam Abu Dawood", ar: "الإمام أبي داود" }, 
      count: "5,274" 
    },
    { 
      name: { en: "Jami' at-Tirmidhi", ar: "جامع الترمذي" }, 
      id: { en: "eng-tirmidhi", ar: "ara-tirmidhi" }, 
      author: { en: "Imam Tirmidhi", ar: "الإمام الترمذي" }, 
      count: "3,956" 
    },
    { 
      name: { en: "Sunan Ibn Majah", ar: "سنن ابن ماجه" }, 
      id: { en: "eng-ibnmajah", ar: "ara-ibnmajah" }, 
      author: { en: "Imam Ibn Majah", ar: "الإمام ابن ماجه" }, 
      count: "4,341" 
    },
    { 
      name: { en: "Muwatta Malik", ar: "موطأ مالك" }, 
      id: { en: "eng-malik", ar: "ara-malik" }, 
      author: { en: "Imam Malik", ar: "الإمام مالك" }, 
      count: "1,720" 
    },
    { 
      name: { en: "Riyad as-Salihin", ar: "رياض الصالحين" }, 
      id: { en: "eng-riyadussalihin", ar: "ara-riyadussalihin" }, 
      author: { en: "Imam An-Nawawi", ar: "الإمام النووي" }, 
      count: "1,896" 
    },
    { 
      name: { en: "40 Hadith Nawawi", ar: "الأربعون النووية" }, 
      id: { en: "eng-nawawi", ar: "ara-nawawi1" }, // Note: ara-nawawi1 is often used for 40 hadith
      author: { en: "Imam An-Nawawi", ar: "الإمام النووي" }, 
      count: "42" 
    },
  ];

  const ChevronIcon = language === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Book className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-bold text-emerald-800">{t('hadith')}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Link 
            to={`/hadith/${collection.id[language]}`} 
            key={collection.id.en} 
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100 hover:border-emerald-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition">
                  {collection.name[language]}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {t('by')} {collection.author[language]}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-500">
                    {collection.count} {t('hadithsCount')}
                  </span>
                  <ChevronIcon size={18} className="text-slate-300 group-hover:text-emerald-500 transition" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HadithReader;
