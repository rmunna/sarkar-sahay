"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface SearchItem {
  s: string; // slug
  t: string; // title
  d: string; // description
  c: string; // category
  u?: 1;     // update flag
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [index, setIndex] = useState<SearchItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-load search index on first focus
  const loadIndex = useCallback(() => {
    if (index) return;
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((data) => setIndex(data))
      .catch(() => {});
  }, [index]);

  const search = useCallback(
    (q: string) => {
      if (!q.trim() || !index) {
        setResults([]);
        return;
      }
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = index
        .map((item) => {
          const tl = item.t.toLowerCase();
          const dl = item.d.toLowerCase();
          const cl = item.c.toLowerCase();
          let score = 0;
          for (const term of terms) {
            if (tl.includes(term)) score += 10;
            if (tl.startsWith(term)) score += 5;
            if (cl.includes(term)) score += 3;
            if (dl.includes(term)) score += 1;
          }
          return { item, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((r) => r.item);
      setResults(scored);
    },
    [index]
  );

  useEffect(() => {
    search(query);
    setSelectedIndex(-1);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        loadIndex();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loadIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      setIsOpen(false);
      setQuery("");
      const r = results[selectedIndex];
      window.location.href = r.u ? `/update/${r.s}` : `/guide/${r.s}`;
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            loadIndex();
          }}
          onFocus={() => {
            setIsOpen(true);
            loadIndex();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search guides... (⌘K)"
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition"
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {!index ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No guides found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, i) => (
                <li key={item.s}>
                  <Link
                    href={item.u ? `/update/${item.s}` : `/guide/${item.s}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block px-4 py-3 hover:bg-orange-50 transition ${
                      i === selectedIndex ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.u && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold">NEW</span>}
                      <span className="font-medium text-sm text-gray-900">{item.t}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.c}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
