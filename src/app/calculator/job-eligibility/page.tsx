"use client";

import { useState } from "react";
import Link from "next/link";

/* ───── types ───── */
type Exam = {
  name: string;
  organization: string;
  ageMin: number;
  ageMax: number;
  ageRelaxation: { obc: number; sc: number; st: number; ews: number; disability: number; exServicemen: number; female: number };
  minEducation: "10th" | "12th" | "graduate" | "postGraduate";
  genderRestriction: null | "male" | "female";
  guideSlug: string | null;
};

type Result = {
  exam: Exam;
  eligible: boolean;
  ageEligible: boolean;
  eduEligible: boolean;
  genderEligible: boolean;
  ageYears: number;
  effectiveMax: number;
  relaxationApplied: number;
};

/* ───── education hierarchy ───── */
const EDU_RANK: Record<string, number> = { "10th": 1, "12th": 2, graduate: 3, postGraduate: 4 };
const EDU_LABEL: Record<string, string> = { "10th": "10th Pass", "12th": "12th Pass", graduate: "Graduate", postGraduate: "Post Graduate" };

/* ───── Indian states/UTs ───── */
const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

/* ───── national exam data ───── */
const NATIONAL_EXAMS: Exam[] = [
  { name: "UPSC Civil Services (CSE)", organization: "UPSC", ageMin: 21, ageMax: 32, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "upsc-civil-services-preparation-guide" },
  { name: "UPSC IES/ISS", organization: "UPSC", ageMin: 21, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "postGraduate", genderRestriction: null, guideSlug: null },
  { name: "UPSC CDS", organization: "UPSC", ageMin: 19, ageMax: 25, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "UPSC NDA", organization: "UPSC", ageMin: 16, ageMax: 19, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: null },
  { name: "SSC CGL", organization: "SSC", ageMin: 18, ageMax: 27, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 3, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "ssc-exam-complete-guide" },
  { name: "SSC CHSL", organization: "SSC", ageMin: 18, ageMax: 27, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 3, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: "ssc-exam-complete-guide" },
  { name: "SSC MTS", organization: "SSC", ageMin: 18, ageMax: 25, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 3, female: 0 }, minEducation: "10th", genderRestriction: null, guideSlug: null },
  { name: "SSC GD Constable", organization: "SSC", ageMin: 18, ageMax: 23, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 0, exServicemen: 3, female: 0 }, minEducation: "10th", genderRestriction: null, guideSlug: null },
  { name: "SSC Stenographer", organization: "SSC", ageMin: 18, ageMax: 27, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 3, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: null },
  { name: "IBPS PO", organization: "IBPS", ageMin: 20, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "banking-exam-preparation-guide" },
  { name: "IBPS Clerk", organization: "IBPS", ageMin: 20, ageMax: 28, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "banking-exam-preparation-guide" },
  { name: "IBPS SO", organization: "IBPS", ageMin: 20, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "SBI PO", organization: "SBI", ageMin: 21, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "banking-exam-preparation-guide" },
  { name: "SBI Clerk", organization: "SBI", ageMin: 20, ageMax: 28, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "banking-exam-preparation-guide" },
  { name: "RBI Grade B", organization: "RBI", ageMin: 21, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: "banking-exam-preparation-guide" },
  { name: "RBI Assistant", organization: "RBI", ageMin: 20, ageMax: 28, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "RRB NTPC", organization: "RRB", ageMin: 18, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "RRB Group D", organization: "RRB", ageMin: 18, ageMax: 33, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "10th", genderRestriction: null, guideSlug: null },
  { name: "RRB ALP", organization: "RRB", ageMin: 18, ageMax: 28, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "10th", genderRestriction: null, guideSlug: null },
  { name: "GATE", organization: "IIT", ageMin: 0, ageMax: 99, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "CTET", organization: "CBSE", ageMin: 18, ageMax: 99, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "NTA UGC NET", organization: "NTA", ageMin: 0, ageMax: 99, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "postGraduate", genderRestriction: null, guideSlug: "ugc-net-exam-guide" },
  { name: "Indian Army (Agniveer)", organization: "Indian Army", ageMin: 17, ageMax: 21, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "10th", genderRestriction: "male", guideSlug: null },
  { name: "Indian Navy (Agniveer)", organization: "Indian Navy", ageMin: 17, ageMax: 21, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: "male", guideSlug: null },
  { name: "Indian Air Force (Agniveer)", organization: "Indian Air Force", ageMin: 17, ageMax: 21, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: "male", guideSlug: null },
  { name: "LIC AAO", organization: "LIC", ageMin: 21, ageMax: 30, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  { name: "EPFO SSA", organization: "EPFO", ageMin: 18, ageMax: 27, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
];

/* ───── state-specific jobs ───── */
const STATE_JOBS: Record<string, Exam[]> = {
  "Uttar Pradesh": [
    { name: "UPPSC PCS", organization: "UPPSC", ageMin: 21, ageMax: 40, ageRelaxation: { obc: 5, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
    { name: "UP Police Constable", organization: "UP Police", ageMin: 18, ageMax: 22, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: null },
  ],
  "Bihar": [
    { name: "BPSC PCS", organization: "BPSC", ageMin: 20, ageMax: 37, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
    { name: "Bihar Police Constable", organization: "Bihar Police", ageMin: 18, ageMax: 25, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: null },
  ],
  "Madhya Pradesh": [
    { name: "MPPSC", organization: "MPPSC", ageMin: 21, ageMax: 40, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
    { name: "MP Police Constable", organization: "MP Police", ageMin: 18, ageMax: 28, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: null },
  ],
  "Rajasthan": [
    { name: "RPSC RAS", organization: "RPSC", ageMin: 21, ageMax: 40, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
    { name: "Rajasthan Police Constable", organization: "Rajasthan Police", ageMin: 18, ageMax: 26, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "12th", genderRestriction: null, guideSlug: null },
  ],
  "Tamil Nadu": [
    { name: "TNPSC Group 1", organization: "TNPSC", ageMin: 21, ageMax: 32, ageRelaxation: { obc: 0, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
    { name: "TNPSC Group 2", organization: "TNPSC", ageMin: 18, ageMax: 32, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Karnataka": [
    { name: "KPSC", organization: "KPSC", ageMin: 21, ageMax: 35, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "West Bengal": [
    { name: "WBPSC", organization: "WBPSC", ageMin: 21, ageMax: 36, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Gujarat": [
    { name: "GPSC", organization: "GPSC", ageMin: 21, ageMax: 35, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Haryana": [
    { name: "HPSC", organization: "HPSC", ageMin: 21, ageMax: 42, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Uttarakhand": [
    { name: "UKPSC", organization: "UKPSC", ageMin: 21, ageMax: 42, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Andhra Pradesh": [
    { name: "APPSC", organization: "APPSC", ageMin: 18, ageMax: 42, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Telangana": [
    { name: "TSPSC", organization: "TSPSC", ageMin: 18, ageMax: 44, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Jharkhand": [
    { name: "JPSC", organization: "JPSC", ageMin: 21, ageMax: 35, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Kerala": [
    { name: "Kerala PSC", organization: "Kerala PSC", ageMin: 18, ageMax: 36, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Odisha": [
    { name: "OPSC", organization: "OPSC", ageMin: 21, ageMax: 32, ageRelaxation: { obc: 3, sc: 5, st: 5, ews: 0, disability: 10, exServicemen: 5, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Punjab": [
    { name: "Punjab PCS", organization: "PPSC", ageMin: 21, ageMax: 37, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Chhattisgarh": [
    { name: "Chhattisgarh PSC", organization: "CGPSC", ageMin: 21, ageMax: 40, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Assam": [
    { name: "Assam PSC", organization: "APSC", ageMin: 21, ageMax: 38, ageRelaxation: { obc: 0, sc: 0, st: 0, ews: 0, disability: 0, exServicemen: 0, female: 0 }, minEducation: "graduate", genderRestriction: null, guideSlug: null },
  ],
  "Maharashtra": [
    // Maharashtra doesn't have a separate entry in the given list but keeping state structure
  ],
};

/* ───── helpers ───── */
function getAgeYears(dob: Date, ref: Date): number {
  let y = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) y--;
  return y;
}

function evaluate(
  exam: Exam,
  ageYears: number,
  category: string,
  education: string,
  gender: string,
  disability: string,
): Result {
  let relaxation = 0;
  if (category === "OBC") relaxation += exam.ageRelaxation.obc;
  else if (category === "SC") relaxation += exam.ageRelaxation.sc;
  else if (category === "ST") relaxation += exam.ageRelaxation.st;
  if (disability === "yes") relaxation += exam.ageRelaxation.disability;
  if (gender === "Female") relaxation += exam.ageRelaxation.female;

  const effectiveMax = exam.ageMax + relaxation;
  const ageEligible = exam.ageMax === 99 ? ageYears >= exam.ageMin : ageYears >= exam.ageMin && ageYears <= effectiveMax;
  const eduEligible = EDU_RANK[education] >= EDU_RANK[exam.minEducation];
  const genderEligible = !exam.genderRestriction || exam.genderRestriction === gender.toLowerCase();

  return { exam, eligible: ageEligible && eduEligible && genderEligible, ageEligible, eduEligible, genderEligible, ageYears, effectiveMax, relaxationApplied: relaxation };
}

/* ───── component ───── */
export default function JobEligibilityChecker() {
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [category, setCategory] = useState("UR");
  const [education, setEducation] = useState("graduate");
  const [state, setState] = useState("");
  const [disability, setDisability] = useState("no");
  const [experience, setExperience] = useState("");
  const [results, setResults] = useState<{ national: Result[]; stateJobs: Result[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "not">("all");

  function check() {
    if (!dob) return;
    const age = getAgeYears(new Date(dob), new Date());
    const national = NATIONAL_EXAMS.map((e) => evaluate(e, age, category, education, gender, disability));
    const stateExams = state && STATE_JOBS[state] ? STATE_JOBS[state] : [];
    const stateJobs = stateExams.map((e) => evaluate(e, age, category, education, gender, disability));
    setResults({ national, stateJobs });
    setFilter("all");
  }

  const allResults = results ? [...results.national, ...results.stateJobs] : [];
  const eligibleCount = allResults.filter((r) => r.eligible).length;
  const totalCount = allResults.length;

  const applyFilter = (arr: Result[]) =>
    filter === "all" ? arr : filter === "eligible" ? arr.filter((r) => r.eligible) : arr.filter((r) => !r.eligible);

  const nationalFiltered = results ? applyFilter(results.national) : null;
  const stateFiltered = results ? applyFilter(results.stateJobs) : null;

  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  function renderCard(r: Result) {
    const ageLabel =
      r.exam.ageMax === 99
        ? "No upper limit"
        : `${r.exam.ageMin}–${r.exam.ageMax}${r.relaxationApplied > 0 ? ` + ${r.relaxationApplied} relaxation = ${r.effectiveMax}` : ""}`;
    return (
      <div key={r.exam.name} className={`bg-white rounded-xl border p-4 ${r.eligible ? "border-green-200" : "border-gray-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-semibold text-gray-900">
                {r.exam.guideSlug ? (
                  <Link href={`/guide/${r.exam.guideSlug}`} className="hover:text-orange-600 underline decoration-dotted underline-offset-2">
                    {r.exam.name}
                  </Link>
                ) : (
                  r.exam.name
                )}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{r.exam.organization}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
              <span>
                {r.ageEligible ? "✅" : "❌"} Age: {r.ageYears} yrs (limit: {ageLabel})
              </span>
              <span>
                {r.eduEligible ? "✅" : "❌"} Education: {EDU_LABEL[r.exam.minEducation]} required
              </span>
              {r.exam.genderRestriction && (
                <span>{r.genderEligible ? "✅" : "❌"} Gender: {r.exam.genderRestriction} only</span>
              )}
            </div>
          </div>
          <span className={`shrink-0 text-sm font-bold px-3 py-1 rounded-lg ${r.eligible ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
            {r.eligible ? "✅ Eligible" : "❌ Not Eligible"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Government Job Eligibility Checker",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/job-eligibility",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        🎯 Government Job Eligibility <span className="text-orange-600">Checker</span>
      </h1>
      <p className="text-gray-600 mb-6">
        Enter your details to instantly check your eligibility for 25+ national government exams and state PSC/Police jobs — UPSC, SSC, Banking, Railways, Defence & more.
      </p>

      {/* ── Form ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={selectCls} />
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectCls}>
              <option>Male</option>
              <option>Female</option>
              <option>Transgender</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              {["UR", "OBC", "SC", "ST", "EWS"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Education</label>
            <select value={education} onChange={(e) => setEducation(e.target.value)} className={selectCls}>
              {Object.entries(EDU_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>State / UT</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className={selectCls}>
              <option value="">Select State (for state jobs)</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Disability (PwBD)</label>
            <select value={disability} onChange={(e) => setDisability(e.target.value)} className={selectCls}>
              <option value="no">None</option>
              <option value="yes">Yes (40%+)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Experience (years)</label>
            <input type="number" min={0} max={30} placeholder="Optional" value={experience} onChange={(e) => setExperience(e.target.value)} className={selectCls} />
          </div>
        </div>
        <button onClick={check} className="mt-5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-2.5 rounded-lg transition">
          Check Eligibility
        </button>
      </div>

      {/* ── Results ── */}
      {results && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Result Summary</p>
            <p className="text-3xl font-bold text-orange-600">
              {eligibleCount} <span className="text-lg font-medium text-gray-600">out of {totalCount} exams</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">you are potentially eligible for</p>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {([["all", `All (${totalCount})`], ["eligible", `✅ Eligible (${eligibleCount})`], ["not", `❌ Not Eligible (${totalCount - eligibleCount})`]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === key ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* National exams */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">🇮🇳 National Government Exams</h2>
          <div className="space-y-3 mb-6">
            {nationalFiltered?.map(renderCard)}
          </div>

          {/* State jobs */}
          {state && stateFiltered && stateFiltered.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-3">📍 {state} Government Jobs</h2>
              <div className="space-y-3 mb-6">
                {stateFiltered.map(renderCard)}
              </div>
            </>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Disclaimer:</strong> Eligibility shown is indicative based on general rules. Always check the official notification for the specific recruitment cycle. Age relaxation and education requirements may vary by post and year.
            </p>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/age-eligibility" className="text-sm text-orange-600 hover:underline">→ Age Eligibility Checker</Link>
        <Link href="/calculator/income-tax" className="text-sm text-orange-600 hover:underline">→ Income Tax Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["How does the eligibility checker work?", "Enter your basic details like date of birth, category, education level, and gender. The tool compares your profile against the eligibility criteria of 25+ national exams and state-specific jobs, showing you which ones you qualify for."],
          ["Does it account for age relaxation?", "Yes! Age relaxation is automatically applied based on your category (OBC: 3 years, SC/ST: 5 years) and disability status (10 years) as per standard government rules. State PSCs may have different relaxation — we use their specific rules."],
          ["Is this eligibility check 100% accurate?", "This tool uses general eligibility rules. Specific recruitment cycles may have different criteria. Always verify with the official notification before applying."],
          ["Which exams are covered?", "We cover UPSC (CSE, CDS, NDA), SSC (CGL, CHSL, MTS, GD), Banking (IBPS, SBI, RBI), Railways (NTPC, Group D, ALP), Defence (Agniveer), GATE, UGC NET, CTET, LIC, EPFO, and more."],
          ["Can women apply for NDA and defence exams?", "Women can apply for NDA and CDS. Agniveer entries for Army, Navy, and Air Force currently have specific gender requirements — check the latest notification."],
          ["Does it show state PSC and police jobs?", "Yes! Select your state from the dropdown to see state-specific PSC exams (UPPSC, BPSC, MPPSC, RPSC, TNPSC, KPSC, etc.) and police constable vacancies with their specific age limits and relaxations."],
          ["Which state jobs are covered?", "We cover State PSC exams for 19 states including UP, Bihar, MP, Rajasthan, Tamil Nadu, Karnataka, West Bengal, Gujarat, Haryana, Uttarakhand, AP, Telangana, Jharkhand, Kerala, Odisha, Punjab, Chhattisgarh, and Assam. Police constable data is available for UP, Bihar, MP, and Rajasthan."],
        ].map(([q, a]) => (
          <details key={q} className="mb-3 group">
            <summary className="cursor-pointer font-medium text-gray-800 group-open:text-orange-600">{q}</summary>
            <p className="mt-1 text-sm text-gray-600 pl-4">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
