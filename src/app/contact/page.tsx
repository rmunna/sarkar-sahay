import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Disclaimer — CitizenNest",
  description:
    "Contact CitizenNest and read our disclaimer. We are an independent informational website not affiliated with any government body.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Contact &amp; Disclaimer</h1>

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mt-8 mb-4">About CitizenNest</h2>
        <p className="text-gray-600 mb-4">
          CitizenNest is an <strong>independent informational website</strong> that provides
          clear, step-by-step guides for Indian government services, schemes, and processes.
          Our goal is to make government information accessible and easy to understand for
          every Indian citizen.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 mb-6">
          <p className="font-semibold mb-1">⚠️ Important</p>
          <p>
            CitizenNest is <strong>NOT affiliated with, endorsed by, or connected to any
            Indian government body, ministry, or department</strong>. We are a private,
            independent website. We do not process government applications, issue documents,
            or have any official authority.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
        <p className="text-gray-600 mb-3">
          Have a question, found an error, or want to suggest a topic? We&apos;d love to
          hear from you.
        </p>
        <ul className="space-y-2 text-gray-600 mb-4">
          <li>
            📧 <strong>Email:</strong>{" "}
            <a
              href="mailto:citizennest@gmail.com"
              className="text-orange-600 hover:underline"
            >
              citizennest@gmail.com
            </a>
          </li>
          <li>
            📢 <strong>Telegram:</strong>{" "}
            <a
              href="https://t.me/citizennest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              @citizennest
            </a>
          </li>
          <li>
            💬 <strong>WhatsApp:</strong>{" "}
            <a
              href="https://whatsapp.com/channel/0029Vb7Ln7DC6ZvnozBVGU0e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              CitizenNest Channel
            </a>
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Disclaimer</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 mb-4">
          <ul className="space-y-2">
            <li>
              All information on CitizenNest is provided for <strong>general informational
              purposes only</strong>. It is not a substitute for professional or official
              government advice.
            </li>
            <li>
              While we strive for accuracy, we <strong>cannot guarantee</strong> that all
              information is complete, current, or error-free. Government rules, fees, and
              procedures change frequently.
            </li>
            <li>
              <strong>Always verify</strong> information on official government websites
              (e.g., .gov.in portals) before making decisions or submitting applications.
            </li>
            <li>
              CitizenNest is <strong>not responsible</strong> for any loss, damage, or
              inconvenience caused by reliance on information published on this website.
            </li>
            <li>
              We do not charge any fees for information. If anyone asks you to pay for
              government services through this website, it is a scam.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
