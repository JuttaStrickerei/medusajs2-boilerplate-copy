import enTranslations from './en.json';
import deTranslations from './de.json';

export const translations = {
  en: enTranslations,
  de: deTranslations
};

export type Language = 'en' | 'de';
export type TranslationKey = keyof typeof enTranslations;