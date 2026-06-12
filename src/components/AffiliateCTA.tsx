import { getOfferForCategory, getOffer, type AffiliateOffer } from "@/lib/affiliate";

// Renders a disclosed affiliate CTA matched to the page. Returns null when no
// offer is configured for the category (URL env not set), so there's never an
// empty box. Disclosure included for ASCI/advertising compliance.

const ACCENT: Record<AffiliateOffer["accent"], string> = {
  blue: "border-blue-200 bg-blue-50",
  green: "border-emerald-200 bg-emerald-50",
  violet: "border-violet-200 bg-violet-50",
};
const BTN: Record<AffiliateOffer["accent"], string> = {
  blue: "bg-blue-600 hover:bg-blue-700",
  green: "bg-emerald-600 hover:bg-emerald-700",
  violet: "bg-violet-600 hover:bg-violet-700",
};

function Card({ offer, className = "" }: { offer: AffiliateOffer; className?: string }) {
  return (
    <aside className={`my-6 rounded-xl border p-4 ${ACCENT[offer.accent]} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">{offer.heading}</h3>
        <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-300 rounded px-1 py-0.5">Ad</span>
      </div>
      <p className="mt-1 text-sm text-gray-700">{offer.sub}</p>
      <a
        href={offer.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={`mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white ${BTN[offer.accent]}`}
      >
        {offer.cta}
      </a>
      <p className="mt-2 text-[11px] text-gray-400">
        Partner offer — CitizenNest may earn a commission at no extra cost to you.
      </p>
    </aside>
  );
}

/** Place inside content; matched by page category. Renders nothing if unset. */
export function AffiliateCTA({ category, className }: { category?: string | null; className?: string }) {
  const offer = getOfferForCategory(category);
  return offer ? <Card offer={offer} className={className} /> : null;
}

/** Explicit offer by id (e.g. a specific calculator → "demat"/"loan"). */
export function AffiliateOfferCTA({ offerId, className }: { offerId: string; className?: string }) {
  const offer = getOffer(offerId);
  return offer ? <Card offer={offer} className={className} /> : null;
}
