import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Script from "next/script"
import "styles/globals.css"
import { ToastProvider } from "@components/ui"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { CartProvider } from "@lib/context/cart-context"
import CookieConsent from "@components/cookie-consent"

const GA_ID = "G-VQG5PFKSXB"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default:
      "Strickerei Jutta | Österreichische Handwerkskunst in 3. Generation",
    template: "%s | Strickerei Jutta",
  },
  description:
    "Entdecken Sie handgefertigte Strickwaren aus feinsten Naturfasern. 60 Jahre Tradition, Qualität und österreichische Handwerkskunst.",
  keywords: [
    "Strickwaren",
    "Kaschmir",
    "Merinowolle",
    "Alpaka",
    "Handarbeit",
    "Österreich",
    "Premium Knitwear",
    "Luxury Fashion",
  ],
  authors: [{ name: "Strickerei Jutta" }],
  creator: "Strickerei Jutta",
  openGraph: {
    type: "website",
    locale: "de_AT",
    siteName: "Strickerei Jutta",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      data-mode="light"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent','default',{
                analytics_storage:'denied',
                ad_storage:'denied',
                ad_user_data:'denied',
                ad_personalization:'denied',
                wait_for_update:500
              });
              gtag('js',new Date());
              gtag('config','${GA_ID}');
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-stone-50 text-stone-800">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <main className="relative min-h-screen">{props.children}</main>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
        <CookieConsent />
      </body>
    </html>
  )
}
