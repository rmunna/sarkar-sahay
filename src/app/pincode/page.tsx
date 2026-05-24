import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "PIN Code Finder India — All States, All Districts",
  description:
    "Find PIN code for any area, locality or post office in India. Search by area name, city or district across all states. 19,000+ Indian PIN codes.",
  keywords: [
    "pin code finder india",
    "postal code india",
    "find pin code by area",
    "india post pin code",
    "pincode search india",
  ],
};

interface StateInfo {
  slug: string;
  name: string;
  count: number;
}

function getStates(): StateInfo[] {
  const file = path.join(process.cwd(), "data", "pincode", "states.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as StateInfo[];
}

// Popular pincodes to showcase
const POPULAR_PINCODES = [
  { pin: "110001", label: "Connaught Place, Delhi" },
  { pin: "400001", label: "Fort, Mumbai" },
  { pin: "560001", label: "Bangalore City" },
  { pin: "600001", label: "Parrys, Chennai" },
  { pin: "700001", label: "Dalhousie, Kolkata" },
  { pin: "500001", label: "Abids, Hyderabad" },
  { pin: "411001", label: "Pune City" },
  { pin: "380001", label: "Ahmedabad City" },
  { pin: "302001", label: "Jaipur City" },
  { pin: "226001", label: "Lucknow City" },
  { pin: "800001", label: "Patna City" },
  { pin: "682001", label: "Ernakulam, Kochi" },
];

export default function PincodeHomePage() {
  const states = getStates();
  const total = states.reduce((s, st) => s + st.count, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">PIN Code Finder</h1>
      <p className="text-gray-600 mb-8">
        Find PIN codes for any area, locality or post office across India.{" "}
        <span className="font-medium text-gray-800">{total.toLocaleString()} PIN codes</span>{" "}
        across {states.length} states & UTs. Data sourced from India Post / GeoNames.
      </p>

      {/* What is PIN */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-amber-900 mb-2">What is a PIN Code?</h2>
        <p className="text-sm text-amber-800">
          PIN (Postal Index Number) is a 6-digit code introduced by India Post in 1972.
          The first digit indicates the region, next two the district, and last three the delivery post office.
          It is required for all postal deliveries, courier services, and address verification in India.
        </p>
      </div>

      {/* Popular pincodes */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Popular PIN Codes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {POPULAR_PINCODES.map(({ pin, label }) => (
          <Link
            key={pin}
            href={`/pincode/${pin}`}
            className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <div className="font-mono text-lg font-bold text-blue-700 mb-1 group-hover:text-blue-800">
              {pin}
            </div>
            <div className="text-xs text-gray-600">{label}</div>
          </Link>
        ))}
      </div>

      {/* Browse by state */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by State</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
        {states.map((st) => (
          <Link
            key={st.slug}
            href={`/pincode/state/${st.slug}`}
            className="flex justify-between items-center text-sm text-blue-600 hover:text-blue-800 hover:underline py-1.5 border-b border-gray-100"
          >
            <span>{st.name}</span>
            <span className="text-gray-400 text-xs">{st.count.toLocaleString()}</span>
          </Link>
        ))}
      </div>

      {/* PIN format guide */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">How to Read a PIN Code</h2>
        <div className="font-mono text-2xl text-center bg-gray-50 rounded-lg p-4 mb-4 tracking-widest">
          <span className="text-orange-600 font-bold">5</span>
          <span className="text-blue-600 font-bold">60</span>
          <span className="text-green-600 font-bold">001</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-orange-600 font-bold text-lg mb-1">5</div>
            <div className="text-gray-700 font-medium">Zone</div>
            <div className="text-gray-500 text-xs">South India (AP, Telangana, Karnataka)</div>
          </div>
          <div className="text-center">
            <div className="text-blue-600 font-bold text-lg mb-1">60</div>
            <div className="text-gray-700 font-medium">Circle & District</div>
            <div className="text-gray-500 text-xs">Karnataka postal circle</div>
          </div>
          <div className="text-center">
            <div className="text-green-600 font-bold text-lg mb-1">001</div>
            <div className="text-gray-700 font-medium">Delivery Office</div>
            <div className="text-gray-500 text-xs">Bangalore GPO</div>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-8 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
        <strong>Tip:</strong> You can look up any PIN code directly by going to{" "}
        <code className="bg-gray-200 px-1 rounded">citizennest.com/pincode/[6-digit-code]</code>{" "}
        — e.g., <Link href="/pincode/560001" className="text-blue-600 hover:underline">/pincode/560001</Link> for Bangalore GPO.
      </div>
    </div>
  );
}
