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
];

/** Keywords in filenames that map to each state */
const STATE_FILENAME_KEYWORDS: Record<string, string[]> = {
  karnataka: ["karnataka", "bhoomi-land-records-karnataka", "shakti-free-bus-karnataka", "gruha-lakshmi-karnataka", "ration-card-apply-online-karnataka"],
  "tamil-nadu": ["tamil-nadu", "tn-", "patta-chitta", "kalaignar"],
  kerala: ["kerala", "karunya"],
  telangana: ["telangana", "dharani-portal", "rythu-bandhu", "kalyana-lakshmi-shaadi-mubarak"],
  maharashtra: ["maharashtra", "aaple-sarkar", "igrs-maharashtra", "majhi-ladki-bahin"],
  rajasthan: ["rajasthan", "jan-aadhaar-card-rajasthan", "chiranjeevi-yojana-rajasthan", "indira-rasoi", "devnarayan-scooty", "palanhar"],
  bihar: ["bihar", "bhumi-jankari-land-records-bihar", "student-credit-card-bihar", "mukhyamantri-kanya-utthan-yojana-bihar"],
  "west-bengal": ["west-bengal", "wb-", "kanyashree-prakalpa", "lakshmir-bhandar", "swasthya-sathi"],
  assam: ["assam"],
  gujarat: ["gujarat"],
  "madhya-pradesh": ["ladli-bahna-yojana-mp", "seekho-kamao-yojana-mp", "mp-"],
  "uttar-pradesh": ["up-", "kanya-sumangala-yojana-up", "shadi-anudan-yojana-up", "mukhyamantri-yuva-swarozgar-yojana-up", "kisan-samman-nidhi-up", "ration-card-apply-online-uttar-pradesh"],
  haryana: ["haryana"],
  punjab: ["punjab"],
  jharkhand: ["jharkhand"],
  chhattisgarh: ["chhattisgarh"],
  odisha: ["odisha", "kalia-yojana", "madhu-babu-pension"],
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
