/**
 * Extract FAQ pairs from markdown content and generate JSON-LD schema
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export function extractFAQs(markdownContent: string): FAQItem[] {
  const faqs: FAQItem[] = [];
  // Match patterns like **Q: ...** followed by **A: ...** or answer text
  const faqRegex = /\*\*Q:\s*(.+?)\*\*\s*\n+(?:A:\s*)?(.+?)(?=\n\n\*\*Q:|\n\n##|\n*$)/gs;

  let match;
  while ((match = faqRegex.exec(markdownContent)) !== null) {
    const question = match[1].trim();
    let answer = match[2].trim();
    // Clean up markdown formatting
    answer = answer.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    faqs.push({ question, answer });
  }
  return faqs;
}

export function generateFAQSchema(faqs: FAQItem[]): object | null {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleSchema(guide: {
  title: string;
  description: string;
  lastUpdated: string;
  slug: string;
}): object {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sarkarsahay.in";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    dateModified: guide.lastUpdated,
    datePublished: guide.lastUpdated,
    author: {
      "@type": "Organization",
      name: "SarkarSahay",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "SarkarSahay",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/guide/${guide.slug}`,
    },
  };
}
