import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

//import { LanguageProvider } from "../i18n/LanguageContext" 
import {NextIntlClientProvider} from 'next-intl';
import {getLocale} from 'next-intl/server';

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
 
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}