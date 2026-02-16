import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sarkarsahay.in";

export const metadata: Metadata = {
  title: {
    default: "SarkarSahay — Step-by-Step Government Service Guides for India",
    template: "%s — SarkarSahay",
  },
  description:
    "Clear, accurate, step-by-step guides for Indian government services — Aadhaar, PAN, Ration Card, Schemes, Jobs, Exams & more. Always updated.",
  keywords: [
    "government services India",
    "aadhaar card apply",
    "pan card online",
    "ration card",
    "sarkari yojana",
    "government schemes",
    "sarkari naukri",
    "government jobs India",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "SarkarSahay — Government Services Made Simple",
    description: "Step-by-step guides for every Indian government service.",
    url: BASE_URL,
    siteName: "SarkarSahay",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-white text-gray-900 antialiased min-h-screen flex flex-col">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-orange-600">
              🏛️ SarkarSahay
            </a>
            <div className="flex gap-6 text-sm font-medium text-gray-600">
              <a href="/" className="hover:text-orange-600 transition">
                Home
              </a>
              <a href="/categories" className="hover:text-orange-600 transition">
                Categories
              </a>
              <a href="/about" className="hover:text-orange-600 transition">
                About
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-500">
          <div className="max-w-5xl mx-auto px-4">
            <p className="mb-2">
              <strong>Disclaimer:</strong> SarkarSahay is an independent
              informational website. We are NOT affiliated with any government
              body. Always verify on official government websites.
            </p>
            <p>© 2026 SarkarSahay. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
