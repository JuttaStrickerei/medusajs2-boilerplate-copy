'use client';

import { useLanguage } from '../LanguageContext';

export default function Translate({ keyName }: { keyName: string }) {
  const { t } = useLanguage();
  return <>{t(keyName)}</>;
}