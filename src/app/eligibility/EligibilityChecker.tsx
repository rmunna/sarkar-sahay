"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CasteCategory, SchemeMatch, SchemeRecord, UserProfile } from "@/lib/schemes";
import { matchSchemes } from "@/lib/schemes";

const OCCUPATION_OPTIONS: { value: string; label: string }[] = [
  { value: "any", label: "Other / none of these" },
  { value: "farmer", label: "Farmer (own land)" },
  { value: "agricultural-labourer", label: "Agricultural labourer" },
  { value: "student", label: "Student" },
  { value: "unemployed-youth", label: "Unemployed / looking for work" },
  { value: "salaried-employee", label: "Salaried employee" },
  { value: "self-employed", label: "Self-employed / freelancer" },
  { value: "business-owner", label: "Business owner" },
  { value: "artisan", label: "Artisan / craftsperson" },
  { value: "fisherman", label: "Fisherman" },
  { value: "construction-worker", label: "Construction worker" },
  { value: "street-vendor", label: "Street vendor" },
  { value: "domestic-worker", label: "Domestic worker" },
  { value: "homemaker", label: "Homemaker" },
];

const CASTE_OPTIONS: { value: CasteCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "ews", label: "EWS" },
  { value: "minority", label: "Minority" },
];

const INCOME_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Prefer not to say" },
  { value: "24000", label: "Up to ₹24,000 / year" },
  { value: "100000", label: "Up to ₹1 lakh / year" },
  { value: "250000", label: "Up to ₹2.5 lakh / year" },
  { value: "500000", label: "Up to ₹5 lakh / year" },
  { value: "800000", label: "Up to ₹8 lakh / year" },
  { value: "999999999", label: "Above ₹8 lakh / year" },
];

function stateLabel(slug: string) {
  return slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default function EligibilityChecker({ schemes, states }: { schemes: SchemeRecord[]; states: string[] }) {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [state, setState] = useState("");
  const [income, setIncome] = useState("");
  const [caste, setCaste] = useState<CasteCategory>("general");
  const [occupation, setOccupation] = useState("any");
  const [isWidow, setIsWidow] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const [hasBplCard, setHasBplCard] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const results: SchemeMatch[] | null = useMemo(() => {
    if (!submitted || !age) return null;
    const profile: UserProfile = {
      age: Number(age),
      gender,
      state: state || null,
      annualIncomeINR: income ? Number(income) : null,
      casteCategory: caste,
      occupation,
      isWidow: gender === "female" && isWidow,
      hasDisability,
      hasBplCard,
    };
    return matchSchemes(profile, schemes);
  }, [submitted, age, gender, state, income, caste, occupation, isWidow, hasDisability, hasBplCard, schemes]);

  const stateMatches = results?.filter(m => m.scheme.level === "state") ?? [];
  const centralMatches = results?.filter(m => m.scheme.level === "central") ?? [];

  const selectCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <form
        onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
        onChange={() => setSubmitted(false)}
        className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="el-age" className={labelCls}>Your age</label>
            <input
              id="el-age" type="number" min={0} max={120} required value={age}
              onChange={e => setAge(e.target.value)} placeholder="e.g. 32"
              className={selectCls}
            />
          </div>
          <div>
            <label htmlFor="el-gender" className={labelCls}>Gender</label>
            <select id="el-gender" value={gender} onChange={e => setGender(e.target.value as "female" | "male")} className={selectCls}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div>
            <label htmlFor="el-state" className={labelCls}>State</label>
            <select id="el-state" value={state} onChange={e => setState(e.target.value)} className={selectCls}>
              <option value="">All India (central schemes only)</option>
              {states.map(s => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="el-income" className={labelCls}>Family annual income</label>
            <select id="el-income" value={income} onChange={e => setIncome(e.target.value)} className={selectCls}>
              {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="el-caste" className={labelCls}>Category</label>
            <select id="el-caste" value={caste} onChange={e => setCaste(e.target.value as CasteCategory)} className={selectCls}>
              {CASTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="el-occupation" className={labelCls}>Occupation</label>
            <select id="el-occupation" value={occupation} onChange={e => setOccupation(e.target.value)} className={selectCls}>
              {OCCUPATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
          {gender === "female" && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isWidow} onChange={e => setIsWidow(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Widow
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasDisability} onChange={e => setHasDisability(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Person with disability (40%+)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasBplCard} onChange={e => setHasBplCard(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            BPL / priority ration card
          </label>
        </div>

        <button
          type="submit"
          className="mt-5 w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Find my schemes
        </button>
      </form>

      {results && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900">
            {results.length > 0
              ? `You may be eligible for ${results.length} scheme${results.length === 1 ? "" : "s"}`
              : "No matching schemes found"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Based on the criteria each scheme publishes. Always confirm on the official website before applying — rules and amounts change.
          </p>

          {[{ title: state ? `${stateLabel(state)} schemes` : null, items: stateMatches },
            { title: "Central government schemes", items: centralMatches }]
            .filter(g => g.title && g.items.length > 0)
            .map(group => (
              <section key={group.title} className="mt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">{group.title}</h3>
                <ul className="space-y-3">
                  {group.items.map(({ scheme, checkManually }) => (
                    <li key={scheme.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link href={scheme.guidePath} className="font-semibold text-blue-700 hover:underline">
                          {scheme.name}
                        </Link>
                        <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 capitalize">
                          {scheme.schemeCategory.replace(/-/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{scheme.benefitSummary}</p>
                      {checkManually.length > 0 && (
                        <p className="mt-2 text-xs text-amber-700">
                          Also check: {checkManually.slice(0, 3).join(" · ")}
                        </p>
                      )}
                      <div className="mt-2 flex gap-4 text-sm">
                        <Link href={scheme.guidePath} className="text-blue-600 hover:underline">How to apply →</Link>
                        {scheme.officialLink && (
                          <a href={scheme.officialLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">
                            Official site ↗
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
