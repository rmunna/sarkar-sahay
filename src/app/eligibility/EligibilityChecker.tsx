"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CasteCategory, SchemeLite, SchemeRecord, UserProfile } from "@/lib/schemes";
import { matchSchemes } from "@/lib/schemes";

const OCCUPATION_OPTIONS = [
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
  { value: "general", label: "General" }, { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" }, { value: "st", label: "ST" },
  { value: "ews", label: "EWS" }, { value: "minority", label: "Minority" },
];

const INCOME_OPTIONS = [
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
function catLabel(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

const CAP = 8;

export default function EligibilityChecker({ curated, catalog, states }: {
  curated: SchemeRecord[];
  catalog: SchemeLite[];
  states: string[];
}) {
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
  const [catFilter, setCatFilter] = useState("all");

  const profile: UserProfile | null = useMemo(() => {
    if (!submitted || !age) return null;
    return {
      age: Number(age), gender, state: state || null,
      annualIncomeINR: income ? Number(income) : null,
      casteCategory: caste, occupation,
      isWidow: gender === "female" && isWidow, hasDisability, hasBplCard,
    };
  }, [submitted, age, gender, state, income, caste, occupation, isWidow, hasDisability, hasBplCard]);

  // Precise = curated schemes with real structured constraints met.
  const precise = useMemo(() => profile ? matchSchemes(profile, curated) : [], [profile, curated]);
  // Broad = catalog schemes for the user's state + all-India central, by category.
  const broad = useMemo(() => {
    if (!profile) return [];
    const curatedSlugs = new Set(curated.map(s => s.slug ?? s.id));
    return catalog.filter(s =>
      !curatedSlugs.has(s.slug) &&
      (s.level === "central" || (profile.state && s.state === profile.state)),
    );
  }, [profile, catalog, curated]);

  const total = precise.length + broad.length;
  const fBroad = catFilter === "all" ? broad : broad.filter(s => s.category === catFilter);
  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of broad) m.set(s.category, (m.get(s.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [broad]);
  const broadByCat = useMemo(() => {
    const m = new Map<string, SchemeLite[]>();
    for (const s of fBroad) { (m.get(s.category) ?? m.set(s.category, []).get(s.category)!).push(s); }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [fBroad]);

  const fieldCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-400 focus:outline-none bg-white";
  const labelCls = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div>
      <form
        onSubmit={e => { e.preventDefault(); setCatFilter("all"); setSubmitted(true); }}
        onChange={() => setSubmitted(false)}
        className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm"
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="el-age" className={labelCls}>Age</label>
            <input id="el-age" type="number" min={0} max={120} required value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 32" className={fieldCls} />
          </div>
          <div>
            <label htmlFor="el-gender" className={labelCls}>Gender</label>
            <select id="el-gender" value={gender} onChange={e => setGender(e.target.value as "female" | "male")} className={fieldCls}>
              <option value="female">Female</option><option value="male">Male</option>
            </select>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="el-state" className={labelCls}>State</label>
            <select id="el-state" value={state} onChange={e => setState(e.target.value)} className={fieldCls}>
              <option value="">All India only</option>
              {states.map(s => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="el-income" className={labelCls}>Family income</label>
            <select id="el-income" value={income} onChange={e => setIncome(e.target.value)} className={fieldCls}>
              {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="el-caste" className={labelCls}>Category</label>
            <select id="el-caste" value={caste} onChange={e => setCaste(e.target.value as CasteCategory)} className={fieldCls}>
              {CASTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="el-occupation" className={labelCls}>Occupation</label>
            <select id="el-occupation" value={occupation} onChange={e => setOccupation(e.target.value)} className={fieldCls}>
              {OCCUPATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
          {gender === "female" && (
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isWidow} onChange={e => setIsWidow(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />Widow</label>
          )}
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDisability} onChange={e => setHasDisability(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />Disability (40%+)</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasBplCard} onChange={e => setHasBplCard(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />BPL / priority card</label>
        </div>

        <button type="submit" className="mt-6 w-full rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition">
          Find my schemes →
        </button>
      </form>

      {profile && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900">
            {total > 0 ? `${total.toLocaleString("en-IN")} scheme${total === 1 ? "" : "s"} you may be eligible for` : "No matching schemes found"}
          </h2>
          {total > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              {precise.length > 0 && <><strong>{precise.length}</strong> closely match your details. </>}
              The rest are central{state ? ` + ${stateLabel(state)}` : ""} schemes you likely qualify for — open any for full eligibility. Always confirm on the official site.
            </p>
          )}

          {precise.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1.5">✅ Best matches for your profile</h3>
              <ul className="space-y-3">
                {precise.map(({ scheme, checkManually }) => (
                  <li key={scheme.id} className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={scheme.guidePath} className="font-semibold text-orange-700 hover:underline">{scheme.name}</Link>
                      <span className="text-xs rounded-full bg-white px-2 py-0.5 text-gray-600">{catLabel(scheme.schemeCategory)}</span>
                    </div>
                    {scheme.benefitSummary && <p className="mt-1 text-sm text-gray-700">{scheme.benefitSummary}</p>}
                    {checkManually.length > 0 && <p className="mt-2 text-xs text-amber-700">Also check: {checkManually.slice(0, 3).join(" · ")}</p>}
                    <div className="mt-2 flex gap-4 text-sm">
                      <Link href={scheme.guidePath} className="text-orange-600 font-medium hover:underline">How to apply →</Link>
                      {scheme.officialLink && <a href={scheme.officialLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">Official ↗</a>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {broad.length > 0 && (
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-800">More schemes you likely qualify for</h3>
                {catCounts.length > 1 && (
                  <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white">
                    <option value="all">All categories ({broad.length})</option>
                    {catCounts.map(([c, n]) => <option key={c} value={c}>{catLabel(c)} ({n})</option>)}
                  </select>
                )}
              </div>
              {broadByCat.map(([cat, list]) => (
                <div key={cat} className="mb-5">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{catLabel(cat)} <span className="text-gray-400 font-normal">({list.length})</span></h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {list.slice(0, CAP).map(s => (
                      <li key={s.slug}><Link href={s.guidePath} className="text-sm text-orange-700 hover:underline">{s.name}</Link></li>
                    ))}
                  </ul>
                  {list.length > CAP && (
                    <Link href="/schemes" className="mt-1.5 inline-block text-xs text-gray-500 hover:underline">+{list.length - CAP} more {catLabel(cat).toLowerCase()} schemes →</Link>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
