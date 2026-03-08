import React from 'react';
import { ShieldCheck, Server, BookOpen, AlertTriangle, WifiOff } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-emerald-800">About Our Data Sources</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          We understand the critical importance of authenticity in Islamic texts. 
          Here is exactly where our data comes from to ensure transparency and trust.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4 items-start">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
        <div>
          <h3 className="font-bold text-amber-800 text-lg mb-2">Important Disclaimer</h3>
          <p className="text-amber-900 leading-relaxed">
            While we use reputable digital sources, no software is free from potential bugs or display errors. 
            If you encounter any discrepancy, please cross-reference with a physical Mushaf or certified scholars.
            This app is an open-source project intended for educational and daily use purposes.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">The Holy Quran</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600">
              <strong>Source API:</strong> AlQuran Cloud (api.alquran.cloud)
            </p>
            <p className="text-slate-600">
              <strong>Data Origin:</strong> <a href="http://tanzil.net" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Tanzil.net</a>
            </p>
            <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
              The Quranic text is sourced from the Tanzil project, which is a highly verified and widely used digital Quran text project launched to produce a standard Unicode Quran text. It is used by millions of apps and websites globally.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <Server size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Hadith Collections</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600">
              <strong>Source API:</strong> FawazAhmed0 Hadith API
            </p>
            <p className="text-slate-600">
              <strong>Data Origin:</strong> <a href="https://sunnah.com" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Sunnah.com</a> (Primary source for many digital Hadith collections)
            </p>
            <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
              The Hadith data is aggregated from various open-source Islamic databases. While striving for accuracy, Hadith grading and text can vary slightly between different prints and numbering systems (e.g., Dar-us-Salam vs. others).
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Prayer Times</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600">
              <strong>Source API:</strong> AlAdhan.com
            </p>
            <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
              AlAdhan is a trusted API for prayer times calculation, used by thousands of applications. It uses standard calculation methods (MWL, ISNA, Umm al-Qura, etc.) based on geographical coordinates.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <WifiOff size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Offline Capability</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600">
              <strong>Quran Text:</strong> Fully available offline.
            </p>
            <p className="text-slate-600">
              <strong>Hadith & Prayer Times:</strong> Requires internet connection initially, but cached for subsequent visits.
            </p>
            <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
              The entire Quran text (Arabic & English) is bundled with the app, so you can read it anywhere without internet. Audio recitation requires an active connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
