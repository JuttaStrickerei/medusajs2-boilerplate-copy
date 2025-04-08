// server-translate.ts
import { translations, Language, TranslationKey } from '../translations/index';

export function serverTranslate(key: string, locale: Language): string {
  return translations[locale]?.[key as TranslationKey] || key;
}