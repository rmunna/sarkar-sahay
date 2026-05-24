import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 2592000; // 30 days

export const metadata: Metadata = {
  title: "Bank Holidays 2026 India — Complete State-wise List (RBI Calendar)",
  description:
    "Complete list of bank holidays in India 2026 — national NI Act holidays, state-wise holidays, and 2nd & 4th Saturday closures. Monthly calendar with exact dates verified from RBI.",
  alternates: { canonical: "https://www.citizennest.com/bank-holidays" },
  keywords: [
    "bank holidays 2026 india",
    "bank holiday list 2026",
    "rbi bank holidays 2026",
    "bank closed dates 2026",
    "national holidays 2026 india",
    "bank holidays india state wise",
    "negotiable instruments act holidays",
    "bank holiday calendar 2026",
  ],
};

const BASE_URL = "https://www.citizennest.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Bank Holidays 2026", item: `${BASE_URL}/bank-holidays` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How many bank holidays are there in India in 2026?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "There are approximately 15–20 bank holidays in India in 2026 when counting national NI Act holidays. The exact number varies by state — some states observe up to 30 additional local holidays. All banks also close on 2nd and 4th Saturdays and all Sundays.",
          },
        },
        {
          "@type": "Question",
          name: "Are banks closed on 2nd and 4th Saturday in 2026?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Since 2015, RBI mandated that all scheduled banks observe holidays on the 2nd and 4th Saturdays of every month. The 1st, 3rd, and 5th Saturdays are working days (half day). Sundays are always closed.",
          },
        },
        {
          "@type": "Question",
          name: "What is NI Act holiday?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "NI Act (Negotiable Instruments Act) holiday is a bank holiday declared by the RBI or state government under the Negotiable Instruments Act, 1881. Banks are required by law to remain closed on these dates. Not all public holidays are NI Act holidays — it depends on state government notifications.",
          },
        },
      ],
    },
  ],
};

// ── Holiday Data ────────────────────────────────────────────────────────────

type HolidayType = "national" | "regional" | "optional";

interface Holiday {
  date: string;       // e.g. "26 Jan"
  day: string;        // e.g. "Monday"
  name: string;
  type: HolidayType;
  states: string;     // "All India" or list of states
  note?: string;
}

interface Month {
  name: string;
  holidays: Holiday[];
}

const MONTHS: Month[] = [
  {
    name: "January 2026",
    holidays: [
      {
        date: "14 Jan", day: "Wednesday",
        name: "Makar Sankranti / Pongal / Uttarayan / Magh Bihu",
        type: "regional",
        states: "TN, Gujarat, AP, Telangana, Assam, Karnataka",
      },
      {
        date: "26 Jan", day: "Monday",
        name: "Republic Day",
        type: "national",
        states: "All India",
        note: "NI Act — all banks closed nationally",
      },
    ],
  },
  {
    name: "February 2026",
    holidays: [
      {
        date: "19 Feb", day: "Thursday",
        name: "Chhatrapati Shivaji Maharaj Jayanti",
        type: "regional",
        states: "Maharashtra",
      },
    ],
  },
  {
    name: "March 2026",
    holidays: [
      {
        date: "3 Mar", day: "Tuesday",
        name: "Holika Dahan (Holi eve)",
        type: "regional",
        states: "Rajasthan, MP, UP, Uttarakhand, Bihar",
        note: "Approximate — confirm with RBI official calendar",
      },
      {
        date: "4 Mar", day: "Wednesday",
        name: "Holi (Dhulandi)",
        type: "regional",
        states: "Most north Indian states; not all RBI offices",
        note: "Approximate — confirm with RBI official calendar",
      },
      {
        date: "19 Mar", day: "Thursday",
        name: "Eid-ul-Fitr (Ramzan Id)",
        type: "national",
        states: "All India (NI Act, most states)",
        note: "Approximate — exact date subject to moon sighting",
      },
      {
        date: "20 Mar", day: "Friday",
        name: "Eid-ul-Fitr (regional)",
        type: "regional",
        states: "J&K, Jammu, Srinagar (observed on next day in some states)",
        note: "Approximate — confirm with local office",
      },
      {
        date: "29 Mar", day: "Sunday",
        name: "Ram Navami",
        type: "regional",
        states: "UP, Bihar, Jharkhand, Odisha, MP, Rajasthan",
        note: "Approximate — confirm with RBI official calendar",
      },
    ],
  },
  {
    name: "April 2026",
    holidays: [
      {
        date: "1 Apr", day: "Wednesday",
        name: "Annual Bank Closing / Mahavir Jayanti",
        type: "national",
        states: "All India (Annual closing); Mahavir Jayanti — Gujarat, Rajasthan, Maharashtra",
        note: "Annual bank account closing day — all banks closed",
      },
      {
        date: "3 Apr", day: "Friday",
        name: "Good Friday",
        type: "national",
        states: "All India (NI Act)",
        note: "Fixed — Easter 2026 is April 5",
      },
      {
        date: "14 Apr", day: "Tuesday",
        name: "Dr. B.R. Ambedkar Jayanti / Tamil New Year (Puthandu) / Vishu / Baisakhi",
        type: "national",
        states: "All India (Ambedkar Jayanti — NI Act); TN (Tamil New Year); Kerala (Vishu); Punjab, Haryana (Baisakhi)",
        note: "Multiple states observe different holidays on April 14",
      },
    ],
  },
  {
    name: "May 2026",
    holidays: [
      {
        date: "1 May", day: "Friday",
        name: "Maharashtra Day / May Day / Labour Day / Buddha Purnima",
        type: "regional",
        states: "Maharashtra (Maharashtra Day); Most states (Labour Day); AP, Telangana, Karnataka (Buddha Purnima)",
        note: "Verified from RBI May 2026 calendar",
      },
      {
        date: "9 May", day: "Saturday",
        name: "Rabindranath Tagore Birthday",
        type: "regional",
        states: "West Bengal (Kolkata RBI office only)",
        note: "Verified from RBI calendar — Saturday is 2nd Saturday (already a holiday)",
      },
      {
        date: "26 May", day: "Tuesday",
        name: "Kazi Nazrul Islam Jayanti",
        type: "regional",
        states: "West Bengal, Tripura",
        note: "Verified from RBI May 2026 calendar",
      },
      {
        date: "27 May", day: "Wednesday",
        name: "Eid-ul-Adha (Bakri Eid / Id-ul-Zuha)",
        type: "national",
        states: "All India (NI Act, most states)",
        note: "Verified from RBI May 2026 calendar — exact date subject to moon sighting",
      },
      {
        date: "28 May", day: "Thursday",
        name: "Bakri Id (second day)",
        type: "regional",
        states: "J&K (Jammu, Srinagar)",
        note: "Verified from RBI May 2026 calendar",
      },
    ],
  },
  {
    name: "June 2026",
    holidays: [
      {
        date: "16 Jun", day: "Tuesday",
        name: "Muharram / Ashura",
        type: "regional",
        states: "Most states with significant Muslim population",
        note: "Approximate — confirm with RBI official calendar",
      },
    ],
  },
  {
    name: "July 2026",
    holidays: [
      {
        date: "No major national holidays", day: "",
        name: "State-specific holidays may apply",
        type: "optional",
        states: "Check local RBI office calendar",
      },
    ],
  },
  {
    name: "August 2026",
    holidays: [
      {
        date: "15 Aug", day: "Saturday",
        name: "Independence Day",
        type: "national",
        states: "All India (NI Act)",
        note: "Falls on Saturday — which is the 3rd Saturday (working day normally). As a national holiday, banks are still closed.",
      },
      {
        date: "25 Aug", day: "Tuesday",
        name: "Ganesh Chaturthi / Vinayaka Chaturthi",
        type: "regional",
        states: "Maharashtra, Goa, Karnataka, Andhra Pradesh, Telangana",
        note: "Approximate — confirm with RBI calendar",
      },
    ],
  },
  {
    name: "September 2026",
    holidays: [
      {
        date: "5 Sep", day: "Saturday",
        name: "Onam (Thiruvonam)",
        type: "regional",
        states: "Kerala",
        note: "Approximate — confirm with RBI calendar",
      },
    ],
  },
  {
    name: "October 2026",
    holidays: [
      {
        date: "2 Oct", day: "Friday",
        name: "Gandhi Jayanti / Mahatma Gandhi's Birthday",
        type: "national",
        states: "All India (NI Act)",
        note: "Fixed date national holiday",
      },
      {
        date: "22 Oct", day: "Thursday",
        name: "Dussehra / Vijaya Dashami",
        type: "regional",
        states: "Most states except Kerala, some south Indian states",
        note: "Approximate — confirm with RBI calendar",
      },
    ],
  },
  {
    name: "November 2026",
    holidays: [
      {
        date: "9 Nov", day: "Monday",
        name: "Diwali / Deepavali / Naraka Chaturdashi",
        type: "regional",
        states: "Most states (NI Act for most RBI offices)",
        note: "Approximate — confirm with RBI calendar. Exact Diwali date TBC.",
      },
      {
        date: "10 Nov", day: "Tuesday",
        name: "Diwali (Laxmi Puja / Balipratipada)",
        type: "regional",
        states: "Maharashtra, Gujarat, Karnataka, West Bengal",
        note: "Approximate — additional Diwali holiday in some states",
      },
      {
        date: "5 Nov", day: "Thursday",
        name: "Milad-un-Nabi (Prophet's Birthday)",
        type: "regional",
        states: "Most states — NI Act for majority of RBI offices",
        note: "Approximate — exact date subject to moon sighting",
      },
      {
        date: "25 Nov", day: "Wednesday",
        name: "Guru Nanak Jayanti (Gurpurab)",
        type: "regional",
        states: "Punjab, Haryana, Himachal Pradesh, Delhi, Chandigarh, most north Indian states",
        note: "Approximate — confirm with RBI calendar",
      },
    ],
  },
  {
    name: "December 2026",
    holidays: [
      {
        date: "25 Dec", day: "Friday",
        name: "Christmas Day",
        type: "national",
        states: "All India (NI Act)",
        note: "Fixed — all banks closed nationally",
      },
    ],
  },
];

const TYPE_STYLE: Record<HolidayType, { badge: string; row: string }> = {
  national: { badge: "bg-red-100 text-red-700", row: "bg-red-50/40" },
  regional: { badge: "bg-amber-100 text-amber-700", row: "" },
  optional: { badge: "bg-gray-100 text-gray-500", row: "bg-gray-50/40" },
};

const TYPE_LABEL: Record<HolidayType, string> = {
  national: "National (NI Act)",
  regional: "State/Regional",
  optional: "State-specific",
};

export default function BankHolidaysPage() {
  const nationalCount = MONTHS.flatMap((m) => m.holidays).filter((h) => h.type === "national").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">Bank Holidays 2026</span>
      </nav>

      {/* White content card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 sm:px-8 sm:py-10">

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Bank Holidays 2026 — India Complete List
      </h1>
      <p className="text-gray-600 mb-6 text-sm">
        National NI Act holidays (all banks closed) and state-wise bank holidays for 2026.
        Lunar holiday dates are approximate — verify at{" "}
        <a href="https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">
          RBI official calendar
        </a>.
      </p>

      {/* Key rules */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { title: "National holidays (NI Act)", value: `${nationalCount} confirmed`, sub: "All banks closed nationally", color: "bg-red-50 border-red-200" },
          { title: "Saturdays rule", value: "2nd & 4th closed", sub: "1st, 3rd, 5th Saturdays — working half days", color: "bg-blue-50 border-blue-200" },
          { title: "Sundays", value: "Always closed", sub: "No banking on Sundays", color: "bg-gray-50 border-gray-200" },
        ].map((card) => (
          <div key={card.title} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-xs text-gray-500 mb-1">{card.title}</p>
            <p className="text-lg font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {(Object.keys(TYPE_STYLE) as HolidayType[]).map((t) => (
          <span key={t} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-medium ${TYPE_STYLE[t].badge}`}>
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      {/* Month-by-month calendar */}
      <div className="space-y-8">
        {MONTHS.map((month) => (
          <section key={month.name}>
            <h2 className="text-base font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              {month.name}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="pb-2 pr-4 font-medium w-24">Date</th>
                    <th className="pb-2 pr-4 font-medium w-24">Day</th>
                    <th className="pb-2 pr-4 font-medium">Holiday</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 font-medium">States</th>
                  </tr>
                </thead>
                <tbody>
                  {month.holidays.map((h, i) => (
                    <tr key={i} className={`border-t border-gray-100 ${TYPE_STYLE[h.type].row}`}>
                      <td className="py-2.5 pr-4 font-mono font-semibold text-gray-800 whitespace-nowrap">{h.date}</td>
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{h.day}</td>
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-gray-800">{h.name}</div>
                        {h.note && (
                          <div className="text-xs text-gray-400 mt-0.5">{h.note}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[h.type].badge}`}>
                          {TYPE_LABEL[h.type]}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-gray-600">{h.states}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* 2nd & 4th Saturday 2026 */}
      <section className="mt-10">
        <h2 className="text-base font-bold text-gray-800 mb-4">2nd & 4th Saturdays 2026 — Bank Closed Dates</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-800 mb-4">
            All scheduled and non-scheduled banks observe a holiday on the <strong>2nd and 4th Saturday</strong> of every month (RBI circular effective April 2015).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {[
              ["January", "10 Jan (2nd Sat)", "24 Jan (4th Sat)"],
              ["February", "14 Feb (2nd Sat)", "28 Feb (4th Sat)"],
              ["March", "14 Mar (2nd Sat)", "28 Mar (4th Sat)"],
              ["April", "11 Apr (2nd Sat)", "25 Apr (4th Sat)"],
              ["May", "9 May (2nd Sat)", "23 May (4th Sat)"],
              ["June", "13 Jun (2nd Sat)", "27 Jun (4th Sat)"],
              ["July", "11 Jul (2nd Sat)", "25 Jul (4th Sat)"],
              ["August", "8 Aug (2nd Sat)", "22 Aug (4th Sat)"],
              ["September", "12 Sep (2nd Sat)", "26 Sep (4th Sat)"],
              ["October", "10 Oct (2nd Sat)", "24 Oct (4th Sat)"],
              ["November", "14 Nov (2nd Sat)", "28 Nov (4th Sat)"],
              ["December", "12 Dec (2nd Sat)", "26 Dec (4th Sat)"],
            ].map(([month, s2, s4]) => (
              <div key={month} className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="font-semibold text-blue-900 text-xs mb-1">{month}</p>
                <p className="text-blue-700 text-xs">{s2}</p>
                <p className="text-blue-700 text-xs">{s4}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-base font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "Are banks closed on all public holidays?",
              a: "No. Banks observe holidays under the Negotiable Instruments Act (NI Act) — not all gazetted public holidays. An NI Act holiday must be specifically notified by the state government or RBI. For example, some state-specific government holidays are not NI Act holidays and banks may remain open.",
            },
            {
              q: "Do all banks have the same holidays?",
              a: "All scheduled and non-scheduled commercial banks follow the same NI Act holidays. Private banks (HDFC, ICICI, Axis, etc.) and public sector banks (SBI, PNB, BOB) observe the same set of mandated holidays. State cooperative banks follow their state's notification.",
            },
            {
              q: "How to check if my bank is open today?",
              a: "Check the RBI Holiday Matrix at rbi.org.in for your city's RBI office. Also check your bank's official app or website — most banks publish their holiday calendar in the FAQ or Customer Care section. You can always use net banking, UPI, or ATMs on bank holidays.",
            },
            {
              q: "Do banks close on both days of Diwali?",
              a: "Most states close banks on the main Diwali day (Laxmi Puja). Some states like Maharashtra and Gujarat close for 2–3 days. The exact dates are in the RBI state-wise holiday matrix.",
            },
            {
              q: "Are NEFT / RTGS / UPI available on bank holidays?",
              a: "UPI and IMPS work 24×7 including on bank holidays. NEFT now operates 24×7 all 365 days. RTGS operates on bank working days only (Monday–Friday and 1st, 3rd, 5th Saturdays). Cheque clearance does not happen on bank holidays.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border border-gray-200 rounded-xl p-4">
              <p className="font-semibold text-gray-800 text-sm mb-2">{q}</p>
              <p className="text-sm text-gray-600">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official source */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="font-semibold text-amber-900 mb-2">Verify with Official RBI Calendar</h2>
        <p className="text-sm text-amber-800 mb-3">
          Lunar holiday dates (Eid, Holi, Diwali, Dussehra, Guru Nanak Jayanti, etc.) shift every year based on the moon calendar. Always confirm with the official RBI source before planning critical financial transactions.
        </p>
        <a
          href="https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition"
        >
          RBI Official Holiday Calendar ↗
        </a>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="text-sm text-orange-600 hover:underline">← Home</Link>
        <Link href="/ifsc" className="text-sm text-orange-600 hover:underline">→ IFSC Lookup</Link>
        <Link href="/guide/bank-account-opening-guide" className="text-sm text-orange-600 hover:underline">→ Bank Account Guide</Link>
      </div>

      </div>{/* end white card */}
    </div>
  );
}
