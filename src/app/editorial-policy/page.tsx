import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "Learn how CitizenNest creates, verifies, and maintains accurate government service guides for Indian citizens.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-orange-600 transition">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Editorial Policy</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Editorial Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: March 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            CitizenNest exists to make Indian government services accessible to everyone. We provide clear, accurate,
            step-by-step guides that help citizens navigate complex government processes — from applying for an Aadhaar
            card to understanding tax filing requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">How We Create Content</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Every guide on CitizenNest goes through a rigorous process:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Primary Research:</strong> We study official government websites, circulars, and notifications as the primary source of truth.</li>
            <li><strong>Cross-Verification:</strong> Information is cross-checked across multiple official sources (.gov.in, .nic.in) to ensure accuracy.</li>
            <li><strong>Step-by-Step Writing:</strong> Our editorial team writes clear, jargon-free instructions that anyone can follow.</li>
            <li><strong>Quality Review:</strong> Each guide undergoes automated QA checks for completeness, accuracy of links, and content standards.</li>
            <li><strong>Continuous Updates:</strong> We monitor government policy changes and update guides when processes change.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Our Sources</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We rely exclusively on authoritative sources:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-600">
            <li>Official government portals (e.g., uidai.gov.in, incometax.gov.in, nrega.nic.in)</li>
            <li>Government gazettes and official notifications</li>
            <li>Press Information Bureau (PIB) releases</li>
            <li>State government official websites</li>
            <li>Parliament and ministry circulars</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Every guide includes direct links to the relevant official websites so readers can verify information themselves.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Corrections & Updates</h2>
          <p className="text-gray-600 leading-relaxed">
            Government processes change frequently. If you find outdated or incorrect information in any guide,
            please <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">contact us</Link>.
            We take accuracy seriously and will review and update the guide promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Independence & Transparency</h2>
          <p className="text-gray-600 leading-relaxed">
            CitizenNest is an independent website. We are <strong>not affiliated with, endorsed by, or connected
            to any Indian government body</strong>. Our content is created independently for informational purposes
            only.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            We may display advertisements to support the website. Advertising does not influence our editorial
            content or guide recommendations in any way.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Content Standards</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-600">
            <li>No speculation or unverified claims</li>
            <li>Clear disclaimers on every guide page</li>
            <li>Direct links to official sources</li>
            <li>Plain language, avoiding bureaucratic jargon</li>
            <li>Regular review cycle for existing content</li>
            <li>Immediate updates when major policy changes are announced</li>
          </ul>
        </section>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <p className="text-sm text-gray-500">
            <strong>Questions about our editorial process?</strong>{" "}
            <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
              Get in touch
            </Link>
            . We&apos;re committed to providing the most accurate and helpful government service guides in India.
          </p>
        </div>
      </div>
    </div>
  );
}
