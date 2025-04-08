'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define type for translation entries
type TranslationDictionary = {
  [key: string]: string;
};

// Define the translation dictionaries with proper typing
const translations: Record<string, TranslationDictionary> = {
    en: {
      'common.cart': 'Cart',
      'common.search': 'Search',
      'common.menu': 'Menu',
      'common.home': 'Home',
      'common.store': 'Store',
      'common.account': 'Account',
      'common.copyright': 'Medusa Store. All rights reserved.',
      'product.addToCart': 'Add to Cart',
      'product.outOfStock': 'Out of Stock',
      'home.welcome': 'Welcome to our Store',
    },
    de: {
      'common.cart': 'Warenkorb',
      'common.search': 'Suche',
      'common.menu': 'Menü',
      'common.home': 'Startseite',
      'common.store': 'Shop',
      'common.account': 'Mein Konto',
      'common.copyright': 'Medusa Store. Alle Rechte vorbehalten.',
      'product.addToCart': 'In den Warenkorb',
      'product.outOfStock': 'Nicht auf Lager',
      'home.welcome': 'Willkommen in unserem Shop',
    }
  };

type Language = 'en' | 'de';
type LanguageContextType = {
  t: (key: string) => string;
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Function to retrieve browser language on client side
  useEffect(() => {
    // Check localStorage first (for returning users)
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'de')) {
      setCurrentLanguage(savedLang);
      return;
    }
    
    // Otherwise check browser language
    const browserLang = navigator.language.substring(0, 2);
    if (browserLang === 'de') {
      setCurrentLanguage('de');
    }
  }, []);

  // Translation function with fixed typing
  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || key;
  };

  // Function to change language
  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ t, currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use translations
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}