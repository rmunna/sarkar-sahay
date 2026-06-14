import type { Metadata } from "next";
import Link from "next/link";
import { getAllStatesWithCounts, getPincodeData, getPincodePath } from "@/lib/pincode";


export const metadata: Metadata = {
  title: "PIN Code Finder India — All States & Districts",
  description:
    "Find PIN code for any area, locality or post office in India. Browse by state and district. 19,000+ Indian PIN codes with post office and area details.",
  alternates: { canonical: "https://www.citizennest.com/pincode" },
};

const POPULAR_PINS = [
  "110001", "400001", "560001", "600001",
  "700001", "500001", "411001", "380001",
  "302001", "226001", "800001", "682001",
];

export default function PincodeHomePage() {
  const states = getAllStatesWithCounts();
  const total = states.reduce((s, st) => s + st.count, 0);

  // Resolve popular pins to their new URLs
  const popularPincodes = POPULAR_PINS.map((pin) => {
    const data = getPincodeData(pin);
    if (!data) return null;
    return { pin, label: `${data.postOffice}, ${data.district}`, path: getPincodePath(data) };
  }).filter(Boolean) as { pin: string; label: string; path: string }[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        📮 PIN Code <span className="text-orange-600">Finder India</span>
      </h1>
      <p className="text-gray-600 mb-8">
        Find PIN codes for any area, locality or post office across India.{" "}
        <strong className="text-gray-800">{total.toLocaleString()} PIN codes</strong>{" "}
        across {states.length} states & UTs.
      </p>

      {/* What is PIN */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-amber-900 mb-2">What is a PIN Code?</h2>
        <p className="text-sm text-amber-800">
          PIN (Postal Index Number) is a 6-digit code introduced by India Post in 1972.
          The first digit indicates the postal zone, the next two identify the district, and the last three
          identify the specific delivery post office. Required for all postal deliveries and address verification.
        </p>
      </div>

      {/* Popular pincodes */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Popular PIN Codes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {popularPincodes.map(({ pin, label, path }) => (
          <Link
            key={pin}
            href={path}
            className="border border-gray-200 rounded-xl p-4 hover:border-orange-400 hover:bg-orange-50 transition group"
          >
            <div className="font-mono text-lg font-bold text-orange-700 mb-1 group-hover:text-orange-800">
              {pin}
            </div>
            <div className="text-xs text-gray-600">{label}</div>
          </Link>
        ))}
      </div>

      {/* Browse by state */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by State / UT</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="grid sm:grid-cols-2">
          {states.map((st, i) => (
            <Link
              key={st.stateSlug}
              href={`/pincode/${st.stateSlug}`}
              className={`flex justify-between items-center px-4 py-3 hover:bg-orange-50 group transition border-b border-gray-100 ${i % 2 === 0 ? "sm:border-r border-gray-100" : ""}`}
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                {st.state}
              </span>
              <span className="text-xs text-gray-400">{st.count.toLocaleString()} PINs</span>
            </Link>
          ))}
        </div>
      </div>

      {/* PIN format guide */}
      <div className="border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">How to Read a PIN Code</h2>
        <div className="font-mono text-3xl text-center bg-gray-50 rounded-lg p-4 mb-4 tracking-[0.3em]">
          <span className="text-orange-600 font-bold">5</span>
          <span className="text-blue-600 font-bold">60</span>
          <span className="text-green-600 font-bold">043</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-orange-600 font-bold text-xl mb-1">5</div>
            <div className="font-medium text-gray-700">Postal Zone</div>
            <div className="text-gray-500 text-xs mt-0.5">South India</div>
          </div>
          <div>
            <div className="text-blue-600 font-bold text-xl mb-1">60</div>
            <div className="font-medium text-gray-700">Circle & District</div>
            <div className="text-gray-500 text-xs mt-0.5">Karnataka circle</div>
          </div>
          <div>
            <div className="text-green-600 font-bold text-xl mb-1">043</div>
            <div className="font-medium text-gray-700">Delivery Office</div>
            <div className="text-gray-500 text-xs mt-0.5">Banaswadi PO</div>
          </div>
        </div>
      </div>

      {/* Cross links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/ifsc" className="text-sm text-orange-600 hover:underline">→ IFSC Code Finder</Link>
        <Link href="/hsn" className="text-sm text-orange-600 hover:underline">→ HSN Code Search</Link>
      </div>
    </div>
  );
}
