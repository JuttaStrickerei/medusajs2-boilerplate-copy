'use client';

import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div className="language-switcher">
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 mx-1 rounded ${currentLanguage === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('de')}
        className={`px-2 py-1 mx-1 rounded ${currentLanguage === 'de' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        DE
      </button>
    </div>
  );
}