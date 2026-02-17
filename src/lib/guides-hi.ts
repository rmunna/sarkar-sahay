import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const guidesDirectory = path.join(process.cwd(), "content/guides-hi");

export interface GuideHiMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  officialLinks: string[];
  readingTime?: string;
}

export interface GuideHi extends GuideHiMeta {
  contentHtml: string;
}

export function getAllHindiGuideSlugs(): string[] {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllHindiGuides(): GuideHiMeta[] {
  const slugs = getAllHindiGuideSlugs();
  return slugs
    .map((slug) => getHindiGuideMeta(slug))
    .filter(Boolean) as GuideHiMeta[];
}

export function getHindiGuideRawContent(slug: string): string | null {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  return content;
}

export function getHindiGuideMeta(slug: string): GuideHiMeta | null {
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

export async function getHindiGuideBySlug(slug: string): Promise<GuideHi | null> {
  const filePath = path.join(guidesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const meta = getHindiGuideMeta(slug)!;
  return { ...meta, contentHtml: processedContent.toString() };
}

export function getRelatedHindiGuides(slug: string, limit = 5): GuideHiMeta[] {
  const current = getHindiGuideMeta(slug);
  if (!current) return [];
  const all = getAllHindiGuides();
  const sameCategory = all.filter(
    (g) => g.category === current.category && g.slug !== slug
  );
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
