import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HadithChapters = () => {
  const { edition } = useParams();
  const { t, language } = useLanguage();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;
  const ChevronIcon = language === 'ar' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch edition metadata which includes sections
    fetch(`https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/${edition}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metadata');
        return res.json();
      })
      .then(data => {
        setMetadata(data);
        
        // The API returns sections in metadata.sections
        if (data.metadata && data.metadata.sections) {
          const chaptersArray = Object.entries(data.metadata.sections).map(([number, name]) => ({
            number,
            name
          }));
          // Sort by number (numeric sort)
          chaptersArray.sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
          setChapters(chaptersArray);
        } else {
          setChapters([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('networkError');
        setLoading(false);
      });
  }, [edition]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-500">{t(error)}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          {t('reset')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <Link to="/hadith" className="flex items-center text-slate-600 hover:text-emerald-600 transition mb-4 gap-2">
          <ArrowIcon size={20} /> {t('back')}
        </Link>
        <h1 className="text-3xl font-bold text-emerald-800">{metadata?.metadata?.name || edition}</h1>
        <p className="text-slate-600">{t('selectBookChapter')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chapters.map((chapter) => (
          <Link 
            to={`/hadith/${edition}/${chapter.number}`} 
            key={chapter.number}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition border border-slate-100 hover:border-emerald-300 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="bg-emerald-100 text-emerald-800 font-bold min-w-[2rem] h-8 flex items-center justify-center rounded-full text-sm">
                {chapter.number}
              </span>
              <h3 className="font-medium text-slate-800 truncate group-hover:text-emerald-700 transition">
                {chapter.name || `${t('book')} ${chapter.number}`}
              </h3>
            </div>
            <ChevronIcon size={18} className="text-slate-300 group-hover:text-emerald-500 transition flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HadithChapters;
