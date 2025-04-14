
'use client';

import { useLanguage } from '../LanguageContext';

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div className="language-switcher flex items-center bg-[rgba(255,255,255,0.15)] rounded-full p-1">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-full transition-colors ${
          currentLanguage === 'en' 
            ? 'bg-blue-500 text-white font-medium' 
            : 'bg-transparent text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.1)]'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('de')}
        className={`px-3 py-1 rounded-full transition-colors ${
          currentLanguage === 'de' 
            ? 'bg-blue-500 text-white font-medium' 
            : 'bg-transparent text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.1)]'
        }`}
        aria-label="Switch to German"
      >
        DE
      </button>
    </div>
  );
}