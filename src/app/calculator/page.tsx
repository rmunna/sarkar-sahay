import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Financial Calculators & Tools for India",
  description:
    "22 free calculators — EMI, SIP, FD, PPF, GST, NPS, income tax, HRA, gratuity, home loan eligibility, retirement, education cost & more. Updated for FY 2025-26.",
};

const calculators = [
  {
    icon: "💰",
    title: "Income Tax Calculator",
    description: "Calculate tax under old & new regime for FY 2025-26. Compare and save.",
    href: "/calculator/income-tax",
  },
  {
    icon: "🏠",
    title: "HRA Exemption Calculator",
    description: "Find your HRA exemption amount and taxable HRA in seconds.",
    href: "/calculator/hra-exemption",
  },
  {
    icon: "🎁",
    title: "Gratuity Calculator",
    description: "Estimate gratuity for government & private sector employees.",
    href: "/calculator/gratuity",
  },
  {
    icon: "🏦",
    title: "EPF Retirement Calculator",
    description: "Project your EPF corpus at retirement with yearly growth chart.",
    href: "/calculator/epf",
  },
  {
    icon: "📜",
    title: "Stamp Duty Calculator",
    description: "Calculate stamp duty & registration charges across major Indian states.",
    href: "/calculator/stamp-duty",
  },
  {
    icon: "🏦",
    title: "EMI Calculator",
    description: "Calculate monthly EMI for home, car, personal & education loans with amortization schedule.",
    href: "/calculator/emi",
  },
  {
    icon: "📈",
    title: "SIP Calculator",
    description: "Estimate mutual fund SIP returns with year-wise growth projection.",
    href: "/calculator/sip",
  },
  {
    icon: "🏧",
    title: "FD Calculator",
    description: "Calculate fixed deposit maturity amount with different compounding frequencies.",
    href: "/calculator/fd",
  },
  {
    icon: "🏛️",
    title: "PPF Calculator",
    description: "Calculate PPF maturity amount, interest earned & tax savings under Section 80C.",
    href: "/calculator/ppf",
  },
  {
    icon: "👧",
    title: "Sukanya Samriddhi Calculator",
    description: "Calculate SSY maturity amount for your girl child's education & marriage fund.",
    href: "/calculator/sukanya-samriddhi",
  },
  {
    icon: "💼",
    title: "Salary Calculator",
    description: "Convert CTC to in-hand salary with PF, tax & deductions for Old & New regime.",
    href: "/calculator/salary",
  },
  {
    icon: "🧾",
    title: "Rent Receipt Generator",
    description: "Generate free printable rent receipts for HRA tax exemption claims.",
    href: "/calculator/rent-receipt",
  },
  {
    icon: "💼",
    title: "Job Eligibility Checker",
    description: "Check your eligibility for 25+ government exams — UPSC, SSC, Banking, Railways & Defence.",
    href: "/calculator/job-eligibility",
  },
  {
    icon: "🎂",
    title: "Scheme & Service Eligibility Checker",
    description: "Check age eligibility for government schemes, services & benefits.",
    href: "/calculator/age-eligibility",
  },
  {
    icon: "🧾",
    title: "GST Calculator",
    description: "Calculate GST (CGST + SGST/IGST) for any amount. Inclusive & exclusive modes.",
    href: "/calculator/gst",
  },
  {
    icon: "🏦",
    title: "NPS Calculator",
    description: "Estimate your National Pension System corpus, annuity & lump sum at retirement.",
    href: "/calculator/nps",
  },
  {
    icon: "📊",
    title: "Lumpsum Calculator",
    description: "Calculate mutual fund lumpsum returns vs FD with year-wise comparison.",
    href: "/calculator/lumpsum",
  },
  {
    icon: "📐",
    title: "Interest Calculator",
    description: "Compare simple vs compound interest with different compounding frequencies.",
    href: "/calculator/interest",
  },
  {
    icon: "🏡",
    title: "Home Loan Eligibility",
    description: "Check maximum home loan you're eligible for based on income & existing EMIs.",
    href: "/calculator/home-loan-eligibility",
  },
  {
    icon: "🧓",
    title: "Retirement Calculator",
    description: "Plan your retirement — corpus needed, monthly SIP required & gap analysis.",
    href: "/calculator/retirement",
  },
  {
    icon: "🎓",
    title: "Education Cost Calculator",
    description: "Estimate future education costs for IIT, MBBS, MBA, abroad — with SIP planning.",
    href: "/calculator/education-cost",
  },
  {
    icon: "🚗",
    title: "Car Loan Calculator",
    description: "EMI, on-road price breakdown, depreciation schedule & total cost of ownership.",
    href: "/calculator/car-loan",
  },
];

export default function CalculatorsIndex() {
  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
          🧮 Financial <span className="text-orange-600">Calculators</span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Free, accurate calculators for Indian citizens — income tax, HRA, gratuity, EPF, stamp duty, and eligibility checks. Updated for FY 2025-26.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculators.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-md transition group"
          >
            <span className="text-3xl mb-3 block">{calc.icon}</span>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition mb-2">
              {calc.title}
            </h2>
            <p className="text-sm text-gray-500">{calc.description}</p>
          </Link>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Financial Calculators — CitizenNest",
            description: "Free financial calculators for Indian citizens.",
            url: "https://www.citizennest.com/calculator",
          }),
        }}
      />
    </div>
  );
}
