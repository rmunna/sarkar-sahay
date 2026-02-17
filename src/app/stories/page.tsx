import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web Stories | CitizenNest",
  description:
    "Visual web stories for Indian government services — Aadhaar, PAN, Passport, Ration Card, and more.",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Identity Documents": "bg-blue-700",
  "Government Schemes": "bg-emerald-700",
  "Tax & Finance": "bg-violet-600",
  "Jobs & Exams": "bg-red-600",
  Certificates: "bg-cyan-600",
  Utilities: "bg-amber-600",
  "Property & Legal": "bg-indigo-700",
  "Food & Ration": "bg-emerald-600",
  "State Schemes": "bg-rose-600",
};

interface StoryEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
}

function getStories(): StoryEntry[] {
  const manifestPath = path.join(process.cwd(), "public/stories/manifest.json");
  if (!fs.existsSync(manifestPath)) return [];
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

export default function StoriesPage() {
  const stories = getStories();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Web Stories</h1>
      <p className="mb-8 text-gray-600">
        Quick visual guides to Indian government services. Swipe through key steps and tips.
      </p>

      {stories.length === 0 ? (
        <p className="text-gray-500">No stories available yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <a
              key={story.slug}
              href={`/stories/${story.slug}.html`}
              className="group block overflow-hidden rounded-xl border border-gray-200 transition hover:shadow-lg"
            >
              <div
                className={`${CATEGORY_COLORS[story.category] || "bg-blue-700"} px-5 py-8 text-white`}
              >
                <span className="mb-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  {story.category}
                </span>
                <h2 className="text-lg font-semibold leading-snug">{story.title}</h2>
              </div>
              <div className="px-5 py-3">
                <p className="line-clamp-2 text-sm text-gray-600">{story.description}</p>
                <span className="mt-2 inline-block text-sm font-medium text-blue-600 group-hover:underline">
                  View Story →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
