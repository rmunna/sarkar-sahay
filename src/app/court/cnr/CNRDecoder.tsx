"use client";

import { useState } from "react";

// State code → state name mapping (from CNR prefix)
const STATE_CODES: Record<string, string> = {
  DL: "Delhi",
  MH: "Maharashtra",
  KA: "Karnataka",
  TN: "Tamil Nadu",
  UP: "Uttar Pradesh",
  RJ: "Rajasthan",
  GJ: "Gujarat",
  WB: "West Bengal",
  AP: "Andhra Pradesh",
  TS: "Telangana",
  KL: "Kerala",
  BR: "Bihar",
  MP: "Madhya Pradesh",
  PB: "Punjab",
  HR: "Haryana",
  OR: "Odisha",
  AS: "Assam",
  JH: "Jharkhand",
  CG: "Chhattisgarh",
  UK: "Uttarakhand",
  HP: "Himachal Pradesh",
  JK: "Jammu & Kashmir",
  MN: "Manipur",
  MG: "Meghalaya",
  SK: "Sikkim",
  TR: "Tripura",
  SC: "Supreme Court",
};

const STATE_TO_SLUG: Record<string, string> = {
  DL: "delhi",
  MH: "maharashtra",
  KA: "karnataka",
  TN: "tamil-nadu",
  UP: "uttar-pradesh",
  RJ: "rajasthan",
  GJ: "gujarat",
  WB: "west-bengal",
  AP: "andhra-pradesh",
  TS: "telangana",
  KL: "kerala",
  BR: "bihar",
  MP: "madhya-pradesh",
  PB: "punjab",
  OR: "odisha",
  AS: "assam",
  JH: "jharkhand",
  CG: "chhattisgarh",
  UK: "uttarakhand",
  HP: "himachal-pradesh",
  JK: "jammu-and-kashmir",
};

interface ParsedCNR {
  stateCode: string;
  distCode: string;
  estCode: string;
  caseNo: string;
  year: string;
  stateName: string;
  stateSlug: string | null;
  ecourtsUrl: string;
}

function parseCNR(raw: string): ParsedCNR | null {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  if (clean.length !== 16) return null;

  const stateCode = clean.slice(0, 2);
  const distCode = clean.slice(2, 4);
  const estCode = clean.slice(4, 6);
  const caseNo = clean.slice(6, 12);
  const year = clean.slice(12, 16);

  const stateName = STATE_CODES[stateCode] || `Unknown (${stateCode})`;
  const stateSlug = STATE_TO_SLUG[stateCode] || null;

  // eCourts CNR search URL — uses the full CNR
  const ecourtsUrl = `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&searchOption=CNR&cnrNumber=${clean}`;

  return { stateCode, distCode, estCode, caseNo, year, stateName, stateSlug, ecourtsUrl };
}

export default function CNRDecoder() {
  const [input, setInput] = useState("");
  const parsed = input.replace(/\s/g, "").length === 16 ? parseCNR(input) : null;
  const isValid = parsed !== null;
  const cleaned = input.replace(/\s/g, "").toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        Enter CNR Number
      </label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="e.g. DLST010000122024"
          maxLength={20}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 uppercase"
        />
        <span className={`flex items-center px-3 text-xs font-medium rounded-lg ${
          cleaned.length === 0 ? "text-gray-400" : isValid ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
        }`}>
          {cleaned.length}/16
        </span>
      </div>

      {/* Result */}
      {isValid && parsed && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 font-mono text-sm">
            <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold">
              {parsed.stateCode} = {parsed.stateName}
            </span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold">
              Dist: {parsed.distCode}
            </span>
            <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold">
              Est: {parsed.estCode}
            </span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold">
              Case #: {parseInt(parsed.caseNo, 10)}
            </span>
            <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold">
              Year: {parsed.year}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">
              This CNR belongs to a case filed in{" "}
              <strong className="text-gray-800">{parsed.stateName}</strong>, District Code{" "}
              <strong className="text-gray-800">{parsed.distCode}</strong>, in{" "}
              <strong className="text-gray-800">{parsed.year}</strong>.
              Case number <strong className="text-gray-800">{parseInt(parsed.caseNo, 10)}</strong> at establishment{" "}
              <strong className="text-gray-800">{parsed.estCode}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={parsed.ecourtsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none text-center bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
            >
              Check Status on eCourts →
            </a>
            {parsed.stateSlug && (
              <a
                href={`/court/${parsed.stateSlug}`}
                className="flex-1 sm:flex-none text-center border border-orange-300 text-orange-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-50 transition"
              >
                {parsed.stateName} Courts →
              </a>
            )}
          </div>
        </div>
      )}

      {cleaned.length > 0 && cleaned.length !== 16 && (
        <p className="text-sm text-red-600 mt-2">
          CNR must be exactly 16 characters. You&apos;ve entered {cleaned.length}.
        </p>
      )}
    </div>
  );
}
