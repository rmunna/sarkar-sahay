"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { UpdateMeta } from "@/lib/updates";

const stageInfo: Record<string, { label: string; icon: string; color: string }> = {
  notification: { label: "Notification", icon: "📢", color: "bg-blue-100 text-blue-800 border-blue-200" },
  registration: { label: "Registration", icon: "📝", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  "admit-card": { label: "Admit Card", icon: "🎫", color: "bg-purple-100 text-purple-800 border-purple-200" },
  "exam-schedule": { label: "Exam Schedule", icon: "📅", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "answer-key": { label: "Answer Key", icon: "🔑", color: "bg-teal-100 text-teal-800 border-teal-200" },
  result: { label: "Result", icon: "📊", color: "bg-green-100 text-green-800 border-green-200" },
  cutoff: { label: "Cutoff", icon: "📉", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

const stageFilterOrder = ["notification", "registration", "admit-card", "exam-schedule", "answer-key", "result", "cutoff"];

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface Props {
  updates: UpdateMeta[];
  orgs: { name: string; count: number }[];
}

export default function UpdatesFilter({ updates, orgs }: Props) {
  const [activeOrg, setActiveOrg] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return updates.filter((u) => {
      if (activeOrg && u.organization !== activeOrg) return false;
      if (activeStage && u.stage !== activeStage) return false;
      return true;
    });
  }, [updates, activeOrg, activeStage]);

  const stageCounts = useMemo(() => {
    const base = activeOrg ? updates.filter((u) => u.organization === activeOrg) : updates;
    const counts: Record<string, number> = {};
    for (const u of base) {
      counts[u.stage] = (counts[u.stage] || 0) + 1;
    }
    return counts;
  }, [updates, activeOrg]);

  return (
    <>
      {/* Stage filter row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveStage(null)}
          className={`px-3 py-1.5 text-sm rounded-full border transition ${
            activeStage === null
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          All types
        </button>
        {stageFilterOrder.filter((s) => stageCounts[s]).map((s) => {
          const info = stageInfo[s];
          return (
            <button
              key={s}
              onClick={() => setActiveStage(activeStage === s ? null : s)}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                activeStage === s
                  ? `${info.color} font-semibold`
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {info.icon} {info.label} ({stageCounts[s]})
            </button>
          );
        })}
      </div>

      {/* Org filter chips */}
      {orgs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveOrg(null)}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              activeOrg === null
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            }`}
          >
            All orgs
          </button>
          {orgs.map((org) => (
            <button
              key={org.name}
              onClick={() => setActiveOrg(activeOrg === org.name ? null : org.name)}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                activeOrg === org.name
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {org.name} ({org.count})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg font-medium">No updates match this filter</p>
          <button
            onClick={() => { setActiveOrg(null); setActiveStage(null); }}
            className="mt-3 text-sm text-orange-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">{filtered.length} update{filtered.length !== 1 ? "s" : ""}</p>
          <div className="grid gap-4">
            {filtered.map((update) => {
              const stage = stageInfo[update.stage] || stageInfo["notification"];
              const lastDate = update.importantDates?.lastDateToApply;
              const isUrgent = lastDate && lastDate !== "TBA" && new Date(lastDate) > new Date() &&
                (new Date(lastDate).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;
              const showVacancies = update.vacancies && update.vacancies !== "TBA" && String(update.vacancies).toLowerCase() !== "tba";

              return (
                <Link
                  key={update.slug}
                  href={`/update/${update.slug}`}
                  className={`block p-5 bg-white border rounded-xl hover:border-orange-300 hover:shadow-sm transition ${isUrgent ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${stage.color}`}>
                      {stage.icon} {stage.label}
                    </span>
                    <span className="text-xs text-gray-400">{update.organization}</span>
                    {showVacancies && (
                      <span className="text-xs font-semibold text-orange-600">
                        {typeof update.vacancies === "number"
                          ? `${update.vacancies.toLocaleString("en-IN")} posts`
                          : update.vacancies}
                      </span>
                    )}
                    {isUrgent && (
                      <span className="text-xs font-semibold text-red-600">🔴 Closing soon</span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 mb-1 leading-snug">
                    {update.title}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{update.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {update.publishedDate && <span>Published: {formatDate(update.publishedDate)}</span>}
                    {lastDate && lastDate !== "TBA" && (
                      <span className={isUrgent ? "text-red-500 font-medium" : ""}>
                        Last date: {formatDate(lastDate)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
