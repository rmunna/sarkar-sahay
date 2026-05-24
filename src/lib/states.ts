import { getAllGuides, GuideMeta } from "./guides";

export interface StateInfo {
  slug: string;
  name: string;
  nameHi?: string;
}

export const STATES: StateInfo[] = [
  { slug: "karnataka", name: "Karnataka" },
  { slug: "tamil-nadu", name: "Tamil Nadu" },
  { slug: "kerala", name: "Kerala" },
  { slug: "telangana", name: "Telangana" },
  { slug: "maharashtra", name: "Maharashtra" },
  { slug: "rajasthan", name: "Rajasthan" },
  { slug: "bihar", name: "Bihar" },
  { slug: "west-bengal", name: "West Bengal" },
  { slug: "assam", name: "Assam" },
  { slug: "gujarat", name: "Gujarat" },
  { slug: "madhya-pradesh", name: "Madhya Pradesh" },
  { slug: "uttar-pradesh", name: "Uttar Pradesh" },
  { slug: "haryana", name: "Haryana" },
  { slug: "punjab", name: "Punjab" },
  { slug: "jharkhand", name: "Jharkhand" },
  { slug: "chhattisgarh", name: "Chhattisgarh" },
  { slug: "odisha", name: "Odisha" },
  { slug: "andhra-pradesh", name: "Andhra Pradesh" },
  { slug: "himachal-pradesh", name: "Himachal Pradesh" },
  { slug: "uttarakhand", name: "Uttarakhand" },
  { slug: "goa", name: "Goa" },
  { slug: "manipur", name: "Manipur" },
  { slug: "meghalaya", name: "Meghalaya" },
  { slug: "mizoram", name: "Mizoram" },
  { slug: "nagaland", name: "Nagaland" },
  { slug: "sikkim", name: "Sikkim" },
  { slug: "tripura", name: "Tripura" },
  { slug: "arunachal-pradesh", name: "Arunachal Pradesh" },
  { slug: "delhi", name: "Delhi" },
  { slug: "jammu-kashmir", name: "Jammu & Kashmir" },
];

/** Keywords in filenames that map to each state */
const STATE_FILENAME_KEYWORDS: Record<string, string[]> = {
  karnataka: ["karnataka", "bhoomi-land-records-karnataka", "shakti-free-bus-karnataka", "gruha-lakshmi-karnataka", "ration-card-apply-online-karnataka"],
  "tamil-nadu": ["tamil-nadu", "tn-", "patta-chitta", "kalaignar", "tamil-nadu-new-government", "tamil-nadu-government-schemes-services"],
  kerala: ["kerala", "karunya"],
  telangana: ["telangana", "dharani-portal", "rythu-bandhu", "kalyana-lakshmi-shaadi-mubarak"],
  maharashtra: ["maharashtra", "aaple-sarkar", "igrs-maharashtra", "majhi-ladki-bahin"],
  rajasthan: ["rajasthan", "jan-aadhaar-card-rajasthan", "chiranjeevi-yojana-rajasthan", "indira-rasoi", "devnarayan-scooty", "palanhar"],
  bihar: ["bihar", "bhumi-jankari-land-records-bihar", "student-credit-card-bihar", "mukhyamantri-kanya-utthan-yojana-bihar"],
  "west-bengal": ["west-bengal", "wb-", "kanyashree-prakalpa", "lakshmir-bhandar", "swasthya-sathi", "west-bengal-new-government", "west-bengal-government-schemes"],
  assam: ["assam", "assam-new-government", "assam-government-schemes"],
  gujarat: ["gujarat"],
  "madhya-pradesh": ["ladli-bahna-yojana-mp", "seekho-kamao-yojana-mp", "mp-"],
  "uttar-pradesh": ["up-", "kanya-sumangala-yojana-up", "shadi-anudan-yojana-up", "mukhyamantri-yuva-swarozgar-yojana-up", "kisan-samman-nidhi-up", "ration-card-apply-online-uttar-pradesh"],
  haryana: ["haryana"],
  punjab: ["punjab"],
  jharkhand: ["jharkhand"],
  chhattisgarh: ["chhattisgarh"],
  odisha: ["odisha", "kalia-yojana", "madhu-babu-pension"],
  "andhra-pradesh": ["andhra-pradesh", "ap-", "ysr-", "ntr-", "meebhoomi"],
  "himachal-pradesh": ["himachal-pradesh", "hp-"],
  uttarakhand: ["uttarakhand"],
  goa: ["goa"],
  manipur: ["manipur"],
  meghalaya: ["meghalaya"],
  mizoram: ["mizoram"],
  nagaland: ["nagaland"],
  sikkim: ["sikkim"],
  tripura: ["tripura"],
  "arunachal-pradesh": ["arunachal-pradesh"],
  delhi: ["delhi", "e-district-delhi"],
  "jammu-kashmir": ["jammu-kashmir", "jk-"],
};

export function getStateBySlug(slug: string): StateInfo | undefined {
  return STATES.find((s) => s.slug === slug);
}

export function getGuidesForState(stateSlug: string): GuideMeta[] {
  const keywords = STATE_FILENAME_KEYWORDS[stateSlug];
  if (!keywords) return [];
  const allGuides = getAllGuides();
  return allGuides.filter((g) =>
    keywords.some((kw) => g.slug.includes(kw))
  );
}

export function getAllStatesWithCounts(): (StateInfo & { count: number })[] {
  const allGuides = getAllGuides();
  return STATES.map((state) => {
    const keywords = STATE_FILENAME_KEYWORDS[state.slug] || [];
    const count = allGuides.filter((g) =>
      keywords.some((kw) => g.slug.includes(kw))
    ).length;
    return { ...state, count };
  })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}
