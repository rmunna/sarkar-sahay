import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sarkarsahay.in";

export const metadata: Metadata = {
  title: {
    default: "SarkarSahay — Step-by-Step Government Service Guides for India",
    template: "%s — SarkarSahay",
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
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🏛️</span>
              <span className="text-xl font-extrabold text-gray-900 group-hover:text-orange-600 transition">
                Sarkar<span className="text-orange-600">Sahay</span>
              </span>
            </a>
            <div className="flex gap-1 sm:gap-2">
              <a
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
              >
                Home
              </a>
              <a
                href="/categories"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
              >
                Categories
              </a>
              <a
                href="/about"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
              >
                About
              </a>
            </div>
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
                  <span className="text-xl">🏛️</span>
                  <span className="font-bold text-gray-900">
                    Sarkar<span className="text-orange-600">Sahay</span>
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
                    <a href="/" className="hover:text-orange-600 transition">Home</a>
                    <a href="/categories" className="hover:text-orange-600 transition">Categories</a>
                    <a href="/about" className="hover:text-orange-600 transition">About</a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Popular</h4>
                  <div className="flex flex-col gap-1.5 text-gray-500">
                    <a href="/guide/aadhaar-card-apply-online" className="hover:text-orange-600 transition">Aadhaar Card</a>
                    <a href="/guide/pan-card-apply-online" className="hover:text-orange-600 transition">PAN Card</a>
                    <a href="/guide/passport-apply-online" className="hover:text-orange-600 transition">Passport</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 mb-1">
                <strong>Disclaimer:</strong> SarkarSahay is an independent informational website.
                Not affiliated with any government body.
              </p>
              <p className="text-xs text-gray-400">© 2026 SarkarSahay. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
