// Affiliate / lead-gen offers — the 10× revenue-per-visitor lever on top of
// AdSense. Offers are matched to high-commercial-intent content categories.
//
// URLs come from env (NEXT_PUBLIC_AFF_*), set once you have affiliate accounts.
// Until a URL is set the offer is hidden (no broken/empty CTA). Pure module —
// no fs — safe to import anywhere.
//
// Recommended programs (Indian market):
//   test-series → Testbook / Adda247 / Oliveboard (direct, or via EarnKaro /
//                 Cuelinks / INRDeals which aggregate many merchants in 1 account)
//   demat       → Zerodha / Upstox / Angel One referral (you already use Zerodha)
//   loan/credit → via Cuelinks / vCommission / BankBazaar / credit-card affiliates

export interface AffiliateOffer {
  id: string;
  heading: string;
  sub: string;
  cta: string;
  url: string;
  accent: "blue" | "green" | "violet";
}

const OFFERS: Record<string, Omit<AffiliateOffer, "url"> & { url: string }> = {
  "test-series": {
    id: "test-series",
    heading: "Preparing for this exam?",
    sub: "Practice with full-length mock tests, previous-year papers and free quizzes — SSC, Banking, Railway, State PSC and more.",
    cta: "Start a free mock test →",
    url: process.env.NEXT_PUBLIC_AFF_TESTSERIES_URL || "",
    accent: "blue",
  },
  demat: {
    id: "demat",
    heading: "Want to start investing?",
    sub: "Open a free demat account in minutes — paperless KYC, ₹0 brokerage on equity delivery. Invest in stocks, mutual funds and IPOs.",
    cta: "Open a free demat account →",
    url: process.env.NEXT_PUBLIC_AFF_DEMAT_URL || "",
    accent: "green",
  },
  loan: {
    id: "loan",
    heading: "Compare loans & credit cards",
    sub: "Check your eligibility and compare personal-loan and credit-card offers from top banks — instant, free, no impact on your credit score.",
    cta: "Compare offers →",
    url: process.env.NEXT_PUBLIC_AFF_LOAN_URL || "",
    accent: "violet",
  },
};

// content category (guide frontmatter) → offer id
const CATEGORY_OFFER: Record<string, string> = {
  "Jobs & Exams": "test-series",
  "Tax & Finance": "demat",
  "Banking & Finance": "demat",
};

export function getOffer(id: string): AffiliateOffer | null {
  const o = OFFERS[id];
  return o && o.url ? o : null;
}

export function getOfferForCategory(category?: string | null): AffiliateOffer | null {
  if (!category) return null;
  const id = CATEGORY_OFFER[category.trim()];
  return id ? getOffer(id) : null;
}
