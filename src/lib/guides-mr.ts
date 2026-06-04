import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const guidesDirectory = path.join(process.cwd(), "content/guides-mr");

export interface GuideMrMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  officialLinks: string[];
  readingTime?: string;
}

export interface GuideMr extends GuideMrMeta {
  contentHtml: string;
}

export function getAllMarathiGuideSlugs(): string[] {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllMarathiGuides(): GuideMrMeta[] {
  const slugs = getAllMarathiGuideSlugs();
  return slugs.map((slug) => getMarathiGuideMeta(slug)).filter(Boolean) as GuideMrMeta[];
}

export function getMarathiGuideRawContent(slug: string): string | null {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const { content } = matter(fs.readFileSync(filePath, "utf8"));
  return content;
}

export function getMarathiGuideMeta(slug: string): GuideMrMeta | null {
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

export async function getMarathiGuideBySlug(slug: string): Promise<GuideMr | null> {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const meta = getMarathiGuideMeta(slug)!;
  return { ...meta, contentHtml: processedContent.toString() };
}

export function getRelatedMarathiGuides(slug: string, limit = 5): GuideMrMeta[] {
  const current = getMarathiGuideMeta(slug);
  if (!current) return [];
  const all = getAllMarathiGuides();
  const sameCategory = all.filter((g) => g.category === current.category && g.slug !== slug);
  const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const seed = hash(slug);
  return sameCategory.sort((a, b) => (hash(a.slug + seed) % 1000) - (hash(b.slug + seed) % 1000)).slice(0, limit);
}
