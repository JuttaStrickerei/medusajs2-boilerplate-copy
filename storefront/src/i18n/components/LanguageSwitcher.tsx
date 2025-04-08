'use client';

import { useLanguage } from '../LanguageContext';

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div className="language-switcher flex items-center bg-gray-100 rounded-full p-1">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-full transition-colors ${
          currentLanguage === 'en' 
            ? 'bg-blue-500 text-white font-medium' 
            : 'bg-transparent text-gray-700 hover:bg-gray-200'
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
            : 'bg-transparent text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Switch to German"
      >
        DE
      </button>
    </div>
  );
}