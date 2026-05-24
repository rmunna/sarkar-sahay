import Link from "next/link";

interface Props {
  courtName: string;
  caseStatusUrl: string;
  advocateUrl?: string;
  causeListUrl?: string;
  courtWebsite: string;
  isHighCourt?: boolean;
  isSupremeCourt?: boolean;
}

export default function CourtCaseSearch({
  courtName,
  caseStatusUrl,
  advocateUrl,
  causeListUrl,
  courtWebsite,
  isHighCourt = false,
  isSupremeCourt = false,
}: Props) {
  const searchTypes = isSupremeCourt
    ? "CNR / Diary number · Case number · Party name · Advocate"
    : isHighCourt
    ? "CNR number · Case number · Party name · Advocate"
    : "CNR number · Case number · Party name · FIR number · Advocate";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
      <div className="p-5">
        <p className="text-xs text-gray-500 mb-4">
          Search on the official eCourts portal — searchable by{" "}
          <span className="text-gray-700">{searchTypes}</span>.
        </p>
        <a
          href={caseStatusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition"
        >
          Search {courtName} Cases on eCourts ↗
        </a>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Opens the official government portal — search happens there
        </p>
      </div>

      <div className="border-t border-gray-100 px-5 py-3 flex flex-wrap gap-x-4 gap-y-2 items-center">
        {advocateUrl && (
          <a
            href={advocateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-orange-600 hover:underline"
          >
            Advocate Search ↗
          </a>
        )}
        {causeListUrl && (
          <a
            href={causeListUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-orange-600 hover:underline"
          >
            Cause List ↗
          </a>
        )}
        <a
          href={courtWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-orange-600 hover:underline"
        >
          Official Website ↗
        </a>
        <Link
          href="/guide/ecourts-case-status-search"
          className="text-xs text-orange-600 hover:underline ml-auto"
        >
          How to search →
        </Link>
      </div>
    </div>
  );
}
