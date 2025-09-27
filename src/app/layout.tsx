import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "Location Manager",
  description: "A comprehensive location management PWA for tracking and organizing locations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Location Manager",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Location Manager",
    title: "Location Manager",
    description: "A comprehensive location management PWA for tracking and organizing locations",
  },
  twitter: {
    card: "summary",
    title: "Location Manager",
    description: "A comprehensive location management PWA for tracking and organizing locations",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Location Manager" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Location Manager" />
        <meta name="description" content="A comprehensive location management PWA for tracking and organizing locations" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-192x192.png" color="#000000" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://locationmanager.app" />
        <meta name="twitter:title" content="Location Manager" />
        <meta name="twitter:description" content="A comprehensive location management PWA for tracking and organizing locations" />
        <meta name="twitter:image" content="/icon-192x192.png" />
        <meta name="twitter:creator" content="@locationmanager" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Location Manager" />
        <meta property="og:description" content="A comprehensive location management PWA for tracking and organizing locations" />
        <meta property="og:site_name" content="Location Manager" />
        <meta property="og:url" content="https://locationmanager.app" />
        <meta property="og:image" content="/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
