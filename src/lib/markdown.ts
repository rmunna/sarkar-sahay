import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

/** Decode the HTML entities myScheme leaves in its markdown (&#39; &quot; &amp;
 * &nbsp; numeric/hex) and turn stray <br> variants into real line breaks. */
function decodeEntities(s: string): string {
  return s
    .replace(/(?:<|&lt;|&#x3c;|&#60;)\s*br\s*\/?\s*(?:>|&gt;|&#x3e;|&#62;)/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/gi, "&");
}

/**
 * myScheme's markdown is effectively a PDF dump: HTML entities, "headings"
 * faked as bold blockquotes, tabs after list numbers, roman-numeral sub-points,
 * and single newlines that collapse everything into walls of text. This rewrites
 * it into clean, well-structured markdown so the rendered page reads like an
 * original guide rather than a scraped government page.
 */
export function cleanSchemeMarkdown(md?: string | null): string {
  if (!md) return "";
  let s = md.replace(/\r/g, "");
  s = decodeEntities(s);
  // tabs (myScheme puts them after list numbers) → single space
  s = s.replace(/\t+/g, " ");
  // blockquote pseudo-headings: a blockquote that is only bold text, e.g.
  //   "> **Aim and Objective:**"  →  a real "### Aim and Objective" subheading
  s = s.replace(
    /^>\s*\*\*\s*(.+?)\s*\*\*\s*[:–—-]*\s*$/gm,
    (_, t: string) => `\n\n### ${t.replace(/[\s:–—-]+$/, "").trim()}\n`,
  );
  // put each step marker (Step N / चरण N) on its own paragraph
  s = s.replace(/[ \t]*\n*[ \t]*(\**\s*(?:Step|चरण)\s*\d+\s*[:.)।])/gi, "\n\n$1");
  // repair: a "### Step N: …" heading just split by the rule above → rejoin it
  s = s.replace(/^(#{2,4})[ \t]*\n+[ \t]*((?:Step|चरण)\b[^\n]*)/gim, "$1 $2");
  // ensure a blank line before list items / headings that follow prose, so
  // markdown parses them as lists/headings instead of merging into a paragraph
  s = s.replace(/([^\n])\n(\s*(?:\d+\.|[-*])\s)/g, "$1\n\n$2");
  // roman-numeral / lettered sub-points (i. ii. iii. / a) b)) onto own lines
  s = s.replace(/([^\n])\n([ \t]*(?:[ivxlcdm]{1,4}\.|[a-z]\))\s)/gi, "$1\n\n$2");
  // normalize bullet glyphs to markdown dashes
  s = s.replace(/^(\s*)[•·]\s+/gm, "$1- ");
  // drop leftover leading ">" on lines that are no longer real callouts
  s = s.replace(/^>\s?$/gm, "");
  // collapse runs of blank lines
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

/** Render a myScheme detail field to clean, well-structured HTML (GFM). */
export async function renderMarkdown(md?: string | null): Promise<string> {
  const cleaned = cleanSchemeMarkdown(md);
  if (!cleaned) return "";
  const out = await remark().use(remarkGfm).use(html).process(cleaned);
  return out.toString();
}
