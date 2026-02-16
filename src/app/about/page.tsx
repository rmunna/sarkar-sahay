import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Making Government Services Simple",
  description:
    "CitizenNest provides clear, step-by-step guides for Indian government services. Independent, accurate, always updated.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About CitizenNest</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          India has thousands of government services, schemes, and processes — but finding
          clear, reliable information about them is unnecessarily difficult. Official websites
          are confusing, outdated blogs give wrong information, and there&apos;s no single
          place that explains things step by step.
        </p>

        <p className="text-lg text-gray-600 mb-6">
          <strong>CitizenNest</strong> solves this. We provide clear, accurate, step-by-step
          guides for every Indian government service — from getting an Aadhaar card to
          filing your taxes. A nest of resources for every Indian citizen.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Our Commitment</h2>
        <ul className="space-y-3 text-gray-600">
          <li>✅ <strong>Accuracy First</strong> — Every guide is verified against official government sources</li>
          <li>✅ <strong>Always Updated</strong> — We monitor policy changes and update guides regularly</li>
          <li>✅ <strong>Official Links</strong> — We always link to official .gov.in websites</li>
          <li>✅ <strong>No Misleading Claims</strong> — We clearly state what we are and what we&apos;re not</li>
          <li>✅ <strong>Free Forever</strong> — All guides are free to access</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Disclaimer</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p>
            CitizenNest is an <strong>independent informational website</strong>. We are NOT
            affiliated with, endorsed by, or connected to any Indian government body or
            department. Information provided here is for general guidance only.
          </p>
          <p className="mt-2">
            Always verify details on official government websites before taking action.
            Fees, processes, and requirements may change. We are not responsible for any
            decisions made based on information on this website.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
        <p className="text-gray-600">
          Found an error or have a suggestion? We&apos;d love to hear from you.
        </p>
      </div>
    </div>
  );
}
