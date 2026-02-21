import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CitizenNest",
  description:
    "Terms of Service for CitizenNest. Understand the terms and conditions for using our website.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-400 mb-6">Last updated: 21 February 2026</p>

        <p className="text-lg text-gray-600 mb-6">
          By accessing and using <strong>citizennest.com</strong> (&quot;the Website&quot;),
          you agree to be bound by these Terms of Service. If you do not agree, please do
          not use this website.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Informational Content Only</h2>
        <p className="text-gray-600 mb-4">
          CitizenNest provides general informational content about Indian government
          services, schemes, and processes. The information on this website is{" "}
          <strong>not official government advice</strong> and should not be treated as such.
          Always verify information on official government websites (e.g., .gov.in) before
          taking any action.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">No Warranties</h2>
        <p className="text-gray-600 mb-4">
          The content on this website is provided &quot;as is&quot; and &quot;as
          available&quot; without warranties of any kind, either express or implied. We make
          reasonable efforts to ensure accuracy, but we do not guarantee that the information
          is complete, current, or error-free. Government policies, fees, and procedures may
          change at any time without notice.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">External Links</h2>
        <p className="text-gray-600 mb-4">
          Our website may contain links to external websites, including official government
          portals and third-party services. These links are provided for convenience only. We
          do not control, endorse, or take responsibility for the content, privacy policies,
          or practices of any external websites. Visiting external links is at your own risk.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Intellectual Property</h2>
        <p className="text-gray-600 mb-4">
          All original content on CitizenNest — including text, graphics, logos, and page
          layout — is the property of CitizenNest and is protected by applicable copyright
          laws. You may not reproduce, distribute, or republish any content from this website
          without prior written permission. Government data and official information
          referenced on this site remain the property of their respective owners.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Limitation of Liability</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 mb-4">
          <p>
            To the fullest extent permitted by law, CitizenNest and its team shall not be
            liable for any direct, indirect, incidental, consequential, or punitive damages
            arising from your use of or inability to use this website. This includes, but is
            not limited to, damages resulting from errors, omissions, or inaccuracies in the
            content, or any action taken based on the information provided.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">User Conduct</h2>
        <p className="text-gray-600 mb-4">
          You agree not to misuse the website, including but not limited to: attempting to
          gain unauthorized access, using automated systems to scrape content, or
          distributing malware through the site.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Changes to These Terms</h2>
        <p className="text-gray-600 mb-4">
          We reserve the right to modify these Terms of Service at any time. Changes will be
          posted on this page with an updated date. Continued use of the website after
          changes constitutes acceptance of the new terms.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
        <p className="text-gray-600">
          If you have questions about these Terms, contact us at{" "}
          <a
            href="mailto:citizennest@gmail.com"
            className="text-orange-600 hover:underline"
          >
            citizennest@gmail.com
          </a>.
        </p>
      </div>
    </div>
  );
}
