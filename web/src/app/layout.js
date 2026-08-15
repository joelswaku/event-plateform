import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";

import AuthProvider from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import UpgradeModal from "@/components/ui/UpgradeModal";
import BillingModal from "@/components/layout/BillingModal";
import ThemeInit from "@/components/ThemeInit"; // ✅ added
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ConnectionStatusBanner from "@/components/ui/ConnectionStatusBanner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "LiteEvent - Event Management Software | Online Event Ticketing Platform",
    template: "%s | LiteEvent",
  },
  description: "Best event management software for weddings, conferences & festivals. Online event ticket sales, RSVP management, QR code check-in, and wedding invitation website. Free event ticketing platform to sell event tickets online.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  keywords: [
    "event management software",
    "event ticketing platform",
    "online event ticket sales",
    "RSVP management software",
    "wedding RSVP website",
    "wedding invitation website",
    "wedding ticketing platform",
    "conference registration software",
    "festival ticketing software",
    "QR code event check-in",
    "event check-in app",
    "sell event tickets online",
    "free event management software",
    "event management",
    "event planning",
    "event ticketing",
    "RSVP management",
    "event organizer",
    "event platform",
    "ticket sales",
    "event registration",
    "guest management",
    "event hosting",
  ],
  authors: [{ name: "LiteEvent" }],
  creator: "LiteEvent",
  publisher: "LiteEvent",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://liteevent.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "LiteEvent",
    title: "LiteEvent - Event Management Software | Event Ticketing Platform",
    description: "Professional event management software with online ticketing, RSVP management, QR code check-in for weddings, conferences & festivals. Sell event tickets online.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiteEvent - Event Management Software | Event Ticketing Platform",
    description: "Event management software with ticketing, RSVP, and QR code check-in. Perfect for weddings, conferences & festivals.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when ready
    // google: 'your-google-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>

        {/* ✅ REPLACED script with safe client init */}
        <ThemeInit />

        {/* Google Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />

        <ThemeProvider>
          <AuthProvider>
            <ConnectionStatusBanner />
            {children}

            <UpgradeModal />
            <BillingModal />

            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: "12px",
                  background: "#111827",
                  color: "#fff",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}
