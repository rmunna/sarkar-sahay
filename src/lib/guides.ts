import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const guidesDirectory = path.join(process.cwd(), "content/guides");

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  officialLinks: string[];
  readingTime?: string;
}

export interface Guide extends GuideMeta {
  contentHtml: string;
}

export function getAllGuideSlugs(): string[] {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllGuides(): GuideMeta[] {
  const slugs = getAllGuideSlugs();
  return slugs
    .map((slug) => getGuideMeta(slug))
    .filter(Boolean) as GuideMeta[];
}

export function getGuideRawContent(slug: string): string | null {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  return content;
}

export function getGuideMeta(slug: string): GuideMeta | null {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContents);
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

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const meta = getGuideMeta(slug)!;
  return { ...meta, contentHtml: processedContent.toString() };
}

export function getRelatedGuides(slug: string, limit = 5): GuideMeta[] {
  const current = getGuideMeta(slug);
  if (!current) return [];
  const all = getAllGuides();
  // Same category, exclude self
  const sameCategory = all.filter(
    (g) => g.category === current.category && g.slug !== slug
  );
  // Shuffle deterministically based on slug hash, then take `limit`
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  const seed = hash(slug);
  const sorted = sameCategory.sort(
    (a, b) => (hash(a.slug + seed) % 1000) - (hash(b.slug + seed) % 1000)
  );
  return sorted.slice(0, limit);
}

export function getCategories(): { name: string; count: number }[] {
  const guides = getAllGuides();
  const map: Record<string, number> = {};
  guides.forEach((g) => {
    map[g.category] = (map[g.category] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
