import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";

export const metadata: Metadata = {
  title: {
    default: "CitizenNest — Step-by-Step Government Service Guides for India",
    template: "%s — CitizenNest",
  },
  description:
    "Clear, accurate, step-by-step guides for Indian government services — Aadhaar, PAN, Ration Card, Schemes, Jobs, Exams & more.",
  keywords: [
    "government services India",
    "aadhaar card apply",
    "pan card online",
    "ration card",
    "sarkari yojana",
    "government schemes",
    "sarkari naukri",
    "citizennest",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "CitizenNest — Government Services Made Simple",
    description: "Step-by-step guides for every Indian government service.",
    url: BASE_URL,
    siteName: "CitizenNest",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "CitizenNest — Your Guide to Government Services",
      },
    ],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-NNYF0TD9EY"
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NNYF0TD9EY');
        `}
      </Script>
      {/* Google AdSense */}
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7012449506814064"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      {/* Microsoft Clarity */}
      <Script id="clarity-init" strategy="lazyOnload">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","vibzpqadbl");
        `}
      </Script>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col`}>
        {/* WebSite Schema for Google Sitelinks Search Box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CitizenNest",
              url: BASE_URL,
              description: "Step-by-step guides for every Indian government service",
              potentialAction: {
                "@type": "SearchAction",
                target: `${BASE_URL}/categories?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/favicon.svg" alt="CitizenNest" width={32} height={32} className="w-8 h-8" />
              <span className="text-xl font-extrabold text-gray-900 group-hover:text-orange-600 transition">
                Citizen<span className="text-orange-600">Nest</span>
              </span>
            </Link>
            {/* Desktop nav */}
            <div className="hidden md:flex gap-1">
              <Link href="/" prefetch={false} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">Home</Link>
              <Link href="/categories" prefetch={false} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">Categories</Link>
              <Link href="/calculator" prefetch={false} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">Calculators</Link>
              <Link href="/updates" prefetch={false} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">Updates</Link>
              <Link href="/about" prefetch={false} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">About</Link>
              <Link href="/hi" prefetch={false} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">🇮🇳 हिन्दी</Link>
            </div>
            {/* Mobile hamburger */}
            <MobileNav />
          </nav>
        </header>

        {/* Main */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <img src="/favicon.svg" alt="CitizenNest" width={24} height={24} className="w-6 h-6" />
                  <span className="font-bold text-gray-900">
                    Citizen<span className="text-orange-600">Nest</span>
                  </span>
                </div>
                <p className="text-sm text-gray-500 max-w-md">
                  Clear, step-by-step guides for every Indian government service.
                  Always accurate. Always updated.
                </p>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Quick Links</h4>
                  <div className="flex flex-col gap-1.5 text-gray-500">
                    <Link href="/" className="hover:text-orange-600 transition">Home</Link>
                    <Link href="/categories" className="hover:text-orange-600 transition">Categories</Link>
                    <Link href="/states" className="hover:text-orange-600 transition">States</Link>
                    <Link href="/calculator" className="hover:text-orange-600 transition">Calculators</Link>
                    <Link href="/about" className="hover:text-orange-600 transition">About</Link>
                    <Link href="/contact" className="hover:text-orange-600 transition">Contact</Link>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Legal</h4>
                  <div className="flex flex-col gap-1.5 text-gray-500">
                    <Link href="/privacy-policy" className="hover:text-orange-600 transition">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-orange-600 transition">Terms of Service</Link>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Popular</h4>
                  <div className="flex flex-col gap-1.5 text-gray-500">
                    <Link href="/guide/aadhaar-card-apply-online" className="hover:text-orange-600 transition">Aadhaar Card</Link>
                    <Link href="/guide/pan-card-apply-online" className="hover:text-orange-600 transition">PAN Card</Link>
                    <Link href="/guide/passport-apply-online" className="hover:text-orange-600 transition">Passport</Link>
                    <Link href="https://t.me/citizennest" className="hover:text-orange-600 transition" target="_blank" rel="noopener noreferrer">📢 Telegram</Link>
                    <Link href="https://whatsapp.com/channel/0029Vb7Ln7DC6ZvnozBVGU0e" className="hover:text-orange-600 transition" target="_blank" rel="noopener noreferrer">💬 WhatsApp</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <div className="flex justify-center gap-4 mb-3 text-xs text-gray-500">
                <Link href="/privacy-policy" className="hover:text-orange-600 transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-orange-600 transition">Terms of Service</Link>
                <Link href="/contact" className="hover:text-orange-600 transition">Contact</Link>
              </div>
              <p className="text-xs text-gray-400 mb-1">
                <strong>Disclaimer:</strong> CitizenNest is an independent informational website.
                Not affiliated with any government body.
              </p>
              <p className="text-xs text-gray-400">© 2026 CitizenNest. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
