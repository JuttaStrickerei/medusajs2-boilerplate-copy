import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "styles/globals.css"
import { ToastProvider } from "@components/ui"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { CartProvider } from "@lib/context/cart-context"

// Font configurations
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
    default: "Strickerei Jutta | Österreichische Handwerkskunst in 3. Generation",
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
      <body className="font-sans antialiased bg-stone-50 text-stone-800">
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <main className="relative min-h-screen">{props.children}</main>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
