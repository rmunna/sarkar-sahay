"use client";

import { useState } from "react";

interface Props {
  caseStatusUrl: string;
  courtName: string;
  courtState?: string;          // e.g. "Andhra Pradesh" — used to build HC search URLs
  ecourtsStateCode?: string;
  ecourtsDistCode?: string;
  isHighCourt?: boolean;
  isSupremeCourt?: boolean;
}

type SearchTab = "cnr" | "case" | "party" | "fir";

// hcservices.ecourts.gov.in URL builder for High Courts
// The portal moved from /hcservices/cases/case_no_status.php?state_code=X
//                     to /ecourtindiaHC/cases/case_no.php?state_cd=X&dist_cd=1&...
// Note: param name changed: state_code → state_cd
const HC_BASE = "https://hcservices.ecourts.gov.in/ecourtindiaHC";

export default function CourtCaseSearch({
  caseStatusUrl,
  courtName,
  courtState,
  ecourtsStateCode,
  ecourtsDistCode,
  isHighCourt = false,
  isSupremeCourt = false,
}: Props) {
  const [tab, setTab] = useState<SearchTab>("cnr");
  const [cnr, setCnr] = useState("");
  const [caseType, setCaseType] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [caseYear, setCaseYear] = useState(new Date().getFullYear().toString());
  const [partyName, setPartyName] = useState("");
  const [firNo, setFirNo] = useState("");
  const [firYear, setFirYear] = useState(new Date().getFullYear().toString());
  const [policeStation, setPoliceStation] = useState("");

  // ── Base link at bottom of widget ("Open [court] on eCourts portal") ─────────
  // For district courts: deep-link to their state+dist page on services.ecourts.gov.in
  // For High Courts:     use caseStatusUrl (now points to HC index on hcservices)
  // For Supreme Court:   use caseStatusUrl directly
  const baseEcourts = !isHighCourt && ecourtsStateCode && ecourtsDistCode
    ? `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${ecourtsStateCode}&dist_code=${ecourtsDistCode}`
    : caseStatusUrl;

  // ── HC-specific URL builder ───────────────────────────────────────────────────
  // hcservices.ecourts.gov.in moved its URL structure:
  //   OLD (broken): /hcservices/cases/case_no_status.php?state_code=X
  //   NEW (live):   /ecourtindiaHC/cases/case_no.php?state_cd=X&dist_cd=1&court_code=1&stateNm=...
  // The portal is form-based — we route to the correct search page, but the user
  // must re-enter their case details in the form on the HC portal.
  function buildHCSearchUrl(): string {
    if (!ecourtsStateCode) return caseStatusUrl;
    const stateNm = courtState ? `&stateNm=${encodeURIComponent(courtState)}` : "";
    const courtParams = `state_cd=${ecourtsStateCode}&dist_cd=1&court_code=1${stateNm}`;
    const indexParams = `state_cd=${ecourtsStateCode}&dist_cd=1${stateNm}`;
    switch (tab) {
      case "case":
        return `${HC_BASE}/cases/case_no.php?${courtParams}`;
      case "party":
        return `${HC_BASE}/cases/ki_petres.php?${courtParams}`;
      case "fir":
        return `${HC_BASE}/cases/fir1.php?${courtParams}`;
      case "cnr":
      default:
        // No dedicated CNR page on hcservices — route to HC index
        return `${HC_BASE}/index_highcourt.php?${indexParams}`;
    }
  }

  function buildSearchUrl(): string {
    if (isSupremeCourt) return caseStatusUrl;

    // High Courts use hcservices.ecourts.gov.in with a completely different
    // URL structure from district courts (services.ecourts.gov.in).
    // Route to the correct per-tab search page on hcservices.
    if (isHighCourt) return buildHCSearchUrl();

    // District Courts — services.ecourts.gov.in
    if (tab === "cnr") {
      const cleanCnr = cnr.replace(/\s/g, "").toUpperCase();
      if (ecourtsStateCode) {
        return `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${ecourtsStateCode}${ecourtsDistCode ? `&dist_code=${ecourtsDistCode}` : ""}&searchOption=CNR&cnrNumber=${encodeURIComponent(cleanCnr)}`;
      }
      return caseStatusUrl;
    }

    if (tab === "case") {
      if (ecourtsStateCode) {
        return `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${ecourtsStateCode}${ecourtsDistCode ? `&dist_code=${ecourtsDistCode}` : ""}&searchOption=caseNo&caseType=${encodeURIComponent(caseType)}&caseNo=${encodeURIComponent(caseNo)}&caseYear=${encodeURIComponent(caseYear)}`;
      }
      return caseStatusUrl;
    }

    if (tab === "party") {
      if (ecourtsStateCode) {
        return `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${ecourtsStateCode}${ecourtsDistCode ? `&dist_code=${ecourtsDistCode}` : ""}&searchOption=partyName&partyName=${encodeURIComponent(partyName)}&caseYear=${encodeURIComponent(caseYear)}`;
      }
      return caseStatusUrl;
    }

    if (tab === "fir") {
      if (ecourtsStateCode) {
        return `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&state_code=${ecourtsStateCode}${ecourtsDistCode ? `&dist_code=${ecourtsDistCode}` : ""}&searchOption=FIR&firNo=${encodeURIComponent(firNo)}&firYear=${encodeURIComponent(firYear)}&policeStation=${encodeURIComponent(policeStation)}`;
      }
      return caseStatusUrl;
    }

    return caseStatusUrl;
  }

  const tabs: { id: SearchTab; label: string }[] = [
    { id: "cnr", label: "By CNR Number" },
    { id: "case", label: "By Case Number" },
    { id: "party", label: "By Party Name" },
    ...(isHighCourt || isSupremeCourt ? [] : [{ id: "fir" as SearchTab, label: "By FIR Number" }]),
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => String(currentYear - i));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? "text-orange-700 bg-white border-b-2 border-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="p-5">
        {/* CNR Number */}
        {tab === "cnr" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              CNR (Case Number Record) is a unique 16-character identifier for every case in India.
              Format: <span className="font-mono bg-gray-100 px-1 rounded">DLST010000122024</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNR Number</label>
              <input
                type="text"
                value={cnr}
                onChange={(e) => setCnr(e.target.value.toUpperCase())}
                placeholder="e.g. DLST010000122024"
                maxLength={20}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 uppercase"
              />
            </div>
            <a
              href={buildSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                cnr.replace(/\s/g, "").length === 16
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
            >
              Search on eCourts →
            </a>
            <p className="text-xs text-gray-400 text-center">
              Opens on the official eCourts portal
            </p>
          </div>
        )}

        {/* Case Number */}
        {tab === "case" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Search by case type, number and year — the format shown on court notices.
              {isHighCourt && <span className="block mt-1 text-amber-600">Note these details — you&apos;ll re-enter them in the form on the eCourts portal.</span>}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Case Type</label>
                <input
                  type="text"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value.toUpperCase())}
                  placeholder="e.g. CS"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 uppercase"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Number</label>
                <input
                  type="text"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                  placeholder="123"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={caseYear}
                  onChange={(e) => setCaseYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <a
              href={buildSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                caseType && caseNo
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
            >
              Search on eCourts →
            </a>
          </div>
        )}

        {/* Party Name */}
        {tab === "party" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Search by petitioner or respondent name. Enter at least 3 characters.
              {isHighCourt && <span className="block mt-1 text-amber-600">Note your search terms — you&apos;ll enter them in the form on the eCourts portal.</span>}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Party / Advocate Name</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={caseYear}
                  onChange={(e) => setCaseYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="">All</option>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <a
              href={buildSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                partyName.trim().length >= 3
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
            >
              Search on eCourts →
            </a>
          </div>
        )}

        {/* FIR Number */}
        {tab === "fir" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Look up a criminal case using the FIR number and police station.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">FIR Number</label>
                <input
                  type="text"
                  value={firNo}
                  onChange={(e) => setFirNo(e.target.value)}
                  placeholder="e.g. 123"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">FIR Year</label>
                <select
                  value={firYear}
                  onChange={(e) => setFirYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Police Station (optional)</label>
              <input
                type="text"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                placeholder="e.g. Connaught Place"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>
            <a
              href={buildSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                firNo.trim()
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
            >
              Search on eCourts →
            </a>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <a
            href={baseEcourts}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 hover:underline"
          >
            Open {courtName} on eCourts portal →
          </a>
        </div>
      </div>
    </div>
  );
}
