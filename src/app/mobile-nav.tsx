"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "🏠 Home" },
  { href: "/categories", label: "📂 Categories" },
  { href: "/calculator", label: "🧮 Calculators" },
  { href: "/states", label: "📍 States" },
  { href: "/updates", label: "📢 Updates" },
  { href: "/stories", label: "📖 Stories" },
  { href: "/about", label: "ℹ️ About" },
  { href: "/hi", label: "🇮🇳 हिन्दी" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 top-[65px] z-40 bg-black/20" onClick={() => setOpen(false)} />
      )}

      {/* Slide-down menu */}
      <div
        className={`fixed left-0 right-0 top-[65px] z-50 bg-white border-b border-gray-200 shadow-lg transition-all duration-200 ease-in-out ${
          open ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 text-base font-medium rounded-lg transition ${
                pathname === link.href
                  ? "text-orange-600 bg-orange-50"
                  : "text-gray-700 hover:text-orange-600 hover:bg-orange-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
