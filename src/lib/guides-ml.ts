import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const guidesDirectory = path.join(process.cwd(), "content/guides-ml");

export interface GuideMlMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  officialLinks: string[];
  readingTime?: string;
}

export interface GuideMl extends GuideMlMeta {
  contentHtml: string;
}

export function getAllMalayalamGuideSlugs(): string[] {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllMalayalamGuides(): GuideMlMeta[] {
  const slugs = getAllMalayalamGuideSlugs();
  return slugs.map((slug) => getMalayalamGuideMeta(slug)).filter(Boolean) as GuideMlMeta[];
}

export function getMalayalamGuideRawContent(slug: string): string | null {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const { content } = matter(fs.readFileSync(filePath, "utf8"));
  return content;
}

export function getMalayalamGuideMeta(slug: string): GuideMlMeta | null {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const { data } = matter(fs.readFileSync(filePath, "utf8"));
  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    category: data.category || "General",
    keywords: data.keywords || [],
    officialLinks: data.officialLinks || [],
    readingTime: data.readingTime,
  };
}

export async function getMalayalamGuideBySlug(slug: string): Promise<GuideMl | null> {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const meta = getMalayalamGuideMeta(slug)!;
  return { ...meta, contentHtml: processedContent.toString() };
}

export function getRelatedMalayalamGuides(slug: string, limit = 5): GuideMlMeta[] {
  const current = getMalayalamGuideMeta(slug);
  if (!current) return [];
  const all = getAllMalayalamGuides();
  const sameCategory = all.filter((g) => g.category === current.category && g.slug !== slug);
  const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const seed = hash(slug);
  return sameCategory.sort((a, b) => (hash(a.slug + seed) % 1000) - (hash(b.slug + seed) % 1000)).slice(0, limit);
}
