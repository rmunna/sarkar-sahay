import { getActiveUpdates, getOrganizations } from "@/lib/updates";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Government Job Notifications, Exam Results & Updates",
  description:
    "Latest government job notifications, entrance exam updates, admit cards, results and cutoffs. SSC, UPSC, Railway, Banking, State PSC and more.",
};

const stageInfo: Record<string, { label: string; icon: string; color: string }> = {
  notification: { label: "Notification", icon: "📢", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "admit-card": { label: "Admit Card", icon: "🎫", color: "bg-purple-100 text-purple-800 border-purple-200" },
  "exam-schedule": { label: "Exam Schedule", icon: "📅", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "answer-key": { label: "Answer Key", icon: "🔑", color: "bg-teal-100 text-teal-800 border-teal-200" },
  result: { label: "Result", icon: "📊", color: "bg-green-100 text-green-800 border-green-200" },
  cutoff: { label: "Cutoff", icon: "📉", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function UpdatesPage() {
  const updates = getActiveUpdates();
  const orgs = getOrganizations();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Latest Updates
        </h1>
        <p className="text-gray-600">
          Government job notifications, exam schedules, admit cards, results & cutoffs.
        </p>
      </div>

      {/* Org filter chips */}
      {orgs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {orgs.map((org) => (
            <span
              key={org.name}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full border border-gray-200"
            >
              {org.name} ({org.count})
            </span>
          ))}
        </div>
      )}

      {updates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg font-medium">No active updates yet</p>
          <p className="text-sm mt-2">Check back soon for the latest government job notifications and exam updates.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {updates.map((update) => {
            const stage = stageInfo[update.stage] || stageInfo["notification"];
            const lastDate = update.importantDates?.lastDateToApply;
            const isUrgent = lastDate && new Date(lastDate) > new Date() &&
              (new Date(lastDate).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

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
                  {update.vacancies && (
                    <span className="text-xs font-semibold text-orange-600">
                      {typeof update.vacancies === "number"
                        ? `${update.vacancies.toLocaleString("en-IN")} posts`
                        : update.vacancies}
                    </span>
                  )}
                  {isUrgent && (
                    <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                      🔴 Closing soon
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-1 leading-snug">
                  {update.title}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{update.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {update.publishedDate && <span>Published: {formatDate(update.publishedDate)}</span>}
                  {lastDate && <span>Last date: {formatDate(lastDate)}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
