"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SchemeLite } from "@/lib/schemes";

function label(slug: string) {
  return slug.split("-").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

const PAGE = 60;

export default function SchemesBrowser({ schemes, states, categories }: {
  schemes: SchemeLite[];
  states: string[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [catF, setCatF] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return schemes.filter(s =>
      (stateF === "all" || (stateF === "central" ? s.level === "central" : s.state === stateF)) &&
      (catF === "all" || s.category === catF) &&
      (!needle || s.name.toLowerCase().includes(needle)),
    );
  }, [schemes, q, stateF, catF]);

  const selectCls = "rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-orange-400 focus:outline-none";

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setShown(PAGE); }}
          placeholder="Search schemes…"
          className={`${selectCls} sm:col-span-3 w-full`}
        />
        <select value={stateF} onChange={e => { setStateF(e.target.value); setShown(PAGE); }} className={selectCls}>
          <option value="all">All states + central</option>
          <option value="central">Central (All India)</option>
          {states.map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={catF} onChange={e => { setCatF(e.target.value); setShown(PAGE); }} className={`${selectCls} sm:col-span-2`}>
          <option value="all">All categories</option>
          {categories.map(c => <option key={c} value={c}>{label(c)}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-600 mb-3">{filtered.length.toLocaleString("en-IN")} schemes</p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {filtered.slice(0, shown).map(s => (
          <li key={s.slug} className="leading-snug">
            <Link href={`/scheme/${s.slug}`} className="text-sm text-orange-700 hover:underline">{s.name}</Link>
            {s.state && <span className="ml-1 text-xs text-gray-400">· {label(s.state)}</span>}
          </li>
        ))}
      </ul>

      {shown < filtered.length && (
        <button
          onClick={() => setShown(n => n + PAGE)}
          className="mt-6 w-full sm:w-auto rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Show more ({filtered.length - shown} remaining)
        </button>
      )}
    </div>
  );
}
