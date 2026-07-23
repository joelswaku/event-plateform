import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";

import AuthProvider from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import UpgradeModal from "@/components/ui/UpgradeModal";
import ThemeInit from "@/components/ThemeInit"; // ✅ added
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
    default: "LiteEvent - Professional Event Management Platform",
    template: "%s | LiteEvent",
  },
  description: "Create, manage, and host unforgettable events with LiteEvent. Powerful event management tools for organizers, featuring ticketing, RSVP, guest management, and more.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  keywords: [
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
    title: "LiteEvent - Professional Event Management Platform",
    description: "Create, manage, and host unforgettable events with LiteEvent. Powerful event management tools for organizers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiteEvent - Professional Event Management Platform",
    description: "Create, manage, and host unforgettable events with LiteEvent.",
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
      <body className="min-h-full flex flex-col">

        {/* ✅ REPLACED script with safe client init */}
        <ThemeInit />

        {/* Google Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />

        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <ThemeProvider>
            <AuthProvider>
              {children}

              <UpgradeModal />

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
        </GoogleOAuthProvider>

      </body>
    </html>
  );
}
