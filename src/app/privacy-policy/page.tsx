import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CitizenNest",
  description:
    "Privacy Policy for CitizenNest. Learn how we collect, use, and protect your data including cookies, analytics, and advertising.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-400 mb-6">Last updated: 21 February 2026</p>

        <p className="text-lg text-gray-600 mb-6">
          CitizenNest (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website{" "}
          <strong>citizennest.com</strong>. This Privacy Policy explains how we collect, use,
          and protect your information when you visit our website.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
        <p className="text-gray-600 mb-3">
          We do not collect personal information such as your name, email, or phone number
          unless you voluntarily provide it (e.g., by contacting us). We do collect
          non-personal information automatically through the following services:
        </p>
        <ul className="space-y-2 text-gray-600 mb-4">
          <li>
            <strong>Google Analytics (GA4)</strong> — We use Google Analytics (Measurement ID:
            G-NNYF0TD9EY) to understand how visitors use our website. This collects
            anonymized data such as pages visited, time spent, device type, and approximate
            location. Google Analytics uses cookies to distinguish users.
          </li>
          <li>
            <strong>Microsoft Clarity</strong> — We use Microsoft Clarity for heatmaps and
            session recordings to improve user experience. Clarity may collect data about
            your interactions with the site (clicks, scrolls, mouse movements).
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Google AdSense &amp; Advertising Cookies</h2>
        <p className="text-gray-600 mb-3">
          We use Google AdSense to display advertisements on our website. Google AdSense may
          use cookies and web beacons to serve ads based on your prior visits to this website
          or other websites on the internet. Specifically:
        </p>
        <ul className="space-y-2 text-gray-600 mb-4">
          <li>
            Google uses the <strong>DoubleClick cookie</strong> to serve ads based on your
            browsing history. You can opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Google Ads Settings
            </a>.
          </li>
          <li>
            Third-party vendors, including Google, use cookies to serve ads based on your
            visits to this and other websites.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Cookies</h2>
        <p className="text-gray-600 mb-4">
          In addition to our own cookies, third-party services (Google Analytics, Google
          AdSense, Microsoft Clarity) may place cookies on your device. We do not control
          these cookies. Please refer to the respective privacy policies of these services
          for more information.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">How to Opt Out</h2>
        <ul className="space-y-2 text-gray-600 mb-4">
          <li>
            <strong>Browser settings:</strong> You can disable cookies through your browser
            settings. Note that some features of the website may not function properly.
          </li>
          <li>
            <strong>Google Ads opt-out:</strong> Visit{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Google Ads Settings
            </a>{" "}
            or{" "}
            <a
              href="https://optout.aboutads.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              aboutads.info
            </a>.
          </li>
          <li>
            <strong>Google Analytics opt-out:</strong> Install the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Google Analytics Opt-out Browser Add-on
            </a>.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Data Retention</h2>
        <p className="text-gray-600 mb-4">
          Analytics data collected through Google Analytics is retained for 14 months. We do
          not store any personally identifiable information on our servers.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">GDPR &amp; CCPA Compliance</h2>
        <p className="text-gray-600 mb-3">
          If you are a resident of the European Economic Area (EEA) or California, you have
          certain data protection rights:
        </p>
        <ul className="space-y-2 text-gray-600 mb-4">
          <li>The right to access, update, or delete your personal information.</li>
          <li>The right to object to or restrict processing of your data.</li>
          <li>The right to data portability.</li>
          <li>The right to opt out of the sale of personal information (CCPA).</li>
        </ul>
        <p className="text-gray-600 mb-4">
          To exercise any of these rights, please contact us at the email below.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Children&apos;s Privacy</h2>
        <p className="text-gray-600 mb-4">
          Our website is not directed at children under 13. We do not knowingly collect
          personal information from children.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
        <p className="text-gray-600 mb-4">
          We may update this Privacy Policy from time to time. Changes will be posted on this
          page with an updated &quot;Last updated&quot; date.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
        <p className="text-gray-600">
          If you have questions about this Privacy Policy, contact us at{" "}
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
