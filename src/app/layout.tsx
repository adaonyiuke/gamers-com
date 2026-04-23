import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";
import "@fontsource-variable/inter";

export const metadata: Metadata = {
  title: "Game Night",
  description: "Track your game nights, record wins, and build rivalries",
  metadataBase: new URL("https://gamenight.clubplay.io"),
  manifest: "/manifest.json",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Game Night",
  },
  openGraph: {
    title: "Game Night",
    description: "Track scores, build your leaderboard, and see who really is the best at game night.",
    url: "https://gamenight.clubplay.io",
    siteName: "Game Night",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Game Night — track your game nights",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Game Night",
    description: "Track scores, build your leaderboard, and see who really is the best at game night.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <head>
        {/* Aktiv Grotesk via Adobe Fonts */}
        <link rel="stylesheet" href="https://use.typekit.net/vqc1rlv.css" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              padding: "12px 16px",
            },
          }}
        />
      </body>
    </html>
  );
}
