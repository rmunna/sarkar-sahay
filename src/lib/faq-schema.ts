/**
 * Extract FAQ pairs from markdown content and generate JSON-LD schema
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export function extractFAQs(markdownContent: string): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Strategy 1: ### heading question + answer paragraph (most common format)
  // Find the FAQ section first
  const faqSectionMatch = markdownContent.match(/##\s+(?:FAQ|Frequently Asked Questions).*?\n([\s\S]*?)(?=\n## [^#]|\n*$)/i);
  if (faqSectionMatch) {
    const faqSection = faqSectionMatch[1];
    // Split by ### headings
    const qaPairs = faqSection.split(/(?=^### )/m).filter(s => s.trim());
    for (const pair of qaPairs) {
      const headingMatch = pair.match(/^###\s+(.+?)[\?\.]?\s*\n+([\s\S]+)/);
      if (headingMatch) {
        const question = headingMatch[1].trim().replace(/\?$/, '') + '?';
        let answer = headingMatch[2].trim().split('\n\n')[0].trim(); // First paragraph only
        // Clean up markdown formatting
        answer = answer.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        if (question && answer) {
          faqs.push({ question, answer });
        }
      }
    }
  }

  // Strategy 2: **Q: ...** format (fallback for older guides)
  if (faqs.length === 0) {
    const faqRegex = /\*\*Q:\s*(.+?)\*\*\s*\n+(?:A:\s*)?(.+?)(?=\n\n\*\*Q:|\n\n##|\n*$)/gs;
    let match;
    while ((match = faqRegex.exec(markdownContent)) !== null) {
      const question = match[1].trim();
      let answer = match[2].trim();
      answer = answer.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      faqs.push({ question, answer });
    }
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
  slug: string;
}): object {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.citizennest.com";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    author: {
      "@type": "Organization",
      name: "CitizenNest",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "CitizenNest",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/guide/${guide.slug}`,
    },
  };
}

export function generateHowToSchema(guide: {
  title: string;
  description: string;
  slug: string;
  rawContent: string;
}): object | null {
  const steps = extractHowToSteps(guide.rawContent);
  if (steps.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.description,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

function extractHowToSteps(markdown: string): { name: string; text: string }[] {
  const steps: { name: string; text: string }[] = [];

  // Find sections with headings that suggest step-by-step content
  const stepHeadingPattern = /^#{2,3}\s+.*(?:step|how\s+to|process|procedure|apply\s+online|apply\s+offline)/im;

  // Split into sections by h2/h3
  const sections = markdown.split(/(?=^#{2,3}\s)/m);

  for (const section of sections) {
    const headingMatch = section.match(/^#{2,3}\s+(.+)/m);
    if (!headingMatch) continue;

    const heading = headingMatch[1].trim();
    if (!stepHeadingPattern.test(`## ${heading}`)) continue;

    // Extract numbered list items from this section
    const numberedItemRegex = /^\d+\.\s+\*?\*?(.+?)\*?\*?\s*(?:[:\-–—]\s*)?(.*)$/gm;
    let match;
    while ((match = numberedItemRegex.exec(section)) !== null) {
      const name = match[1].replace(/\*\*/g, "").trim();
      const text = match[2] ? match[2].replace(/\*\*/g, "").trim() : name;
      if (name) {
        steps.push({ name, text: text || name });
      }
    }
  }

  return steps;
}
