import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/structured-data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteConfig = {
  name: "Closed Test Pro AAB Signer",
  title: "Free AAB Signer Online — Sign Android App Bundles for Google Play | Closed Test Pro",
  description:
    "Sign an unsigned Android App Bundle (AAB) online for free. Upload your .aab and keystore, run jarsigner securely, and download a Play-ready signed bundle. Open source by Closed Test Pro.",
  url: "https://aab.closedtestpro.com",
  ogImage: "https://aab.closedtestpro.com/opengraph-image",
  author: "Closed Test Pro",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "sign aab online",
    "free aab signer",
    "android aab signer",
    "sign android app bundle",
    "sign unsigned aab",
    "jarsigner online",
    "google play aab signing",
    "android keystore signing",
    "sign aab for play console",
    "online jarsigner",
    "closed test pro aab signer",
    "android app bundle signer free",
  ],
  authors: [{ name: siteConfig.author, url: "https://closedtestpro.com" }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
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
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: "Closed Test Pro",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Closed Test Pro AAB Signer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@ClosedTestPro",
    site: "@ClosedTestPro",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  category: "developer tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
