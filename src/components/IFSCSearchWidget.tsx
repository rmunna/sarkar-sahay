"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface SearchResult {
  ifsc: string;
  bank: string;
  bankSlug: string;
  branch: string;
  city: string;
  state: string;
  pageSlug: string;
  url: string;
}

interface IFSCSearchWidgetProps {
  defaultBank?: string; // pre-filter to a specific bank slug
  placeholder?: string;
}

export default function IFSCSearchWidget({ defaultBank, placeholder }: IFSCSearchWidgetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const ph = placeholder || (defaultBank
    ? "Type branch name or city…"
    : "Search branch name, city or IFSC code…");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (defaultBank) params.set("bank", defaultBank);
        const res = await fetch(`/api/ifsc/search?${params.toString()}`);
        const data = await res.json() as { results: SearchResult[] };
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, defaultBank]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={ph}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {loading ? (
          <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <Link
              key={r.ifsc}
              href={r.url}
              onClick={() => { setOpen(false); setQuery(""); }}
              className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 group"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {r.branch} — {r.city.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{r.bank} · {r.state}</div>
              </div>
              <div className="ml-3 font-mono text-xs font-semibold text-blue-700 shrink-0 bg-blue-50 group-hover:bg-blue-100 px-2 py-1 rounded">
                {r.ifsc}
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-500">
          No branches found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
