"use client";

import { useState } from "react";
import Link from "next/link";

interface GuideItem {
  slug: string;
  title: string;
  description: string;
}

interface CategorySectionProps {
  name: string;
  count: number;
  guides: GuideItem[];
  initialShow?: number;
}

export default function CategorySection({
  name,
  count,
  guides,
  initialShow = 12,
}: CategorySectionProps) {
  const [showAll, setShowAll] = useState(guides.length <= initialShow);
  const visible = showAll ? guides : guides.slice(0, initialShow);
  const remaining = guides.length - initialShow;
  const sectionId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <section id={sectionId}>
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        {name}
        <span className="text-sm font-normal text-gray-400">({count} guides)</span>
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guide/${guide.slug}`}
            className="guide-card"
          >
            <h3 className="font-semibold text-gray-900 mb-1">{guide.title}</h3>
            <p className="text-sm text-gray-500">{guide.description}</p>
          </Link>
        ))}
      </div>
      {!showAll && remaining > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
          >
            Show {remaining} more {remaining === 1 ? "guide" : "guides"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
