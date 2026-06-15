import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const updatesHiDirectory = path.join(process.cwd(), "content/updates-hi");

export interface UpdateHiMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  type: string;
  organization: string;
  examName: string;
  stage: string;
  keywords: string[];
  officialLinks: string[];
  readingTime?: string;
  publishedDate: string;
  status: string;
}

export interface UpdateHi extends UpdateHiMeta {
  contentHtml: string;
}

export function getAllHindiUpdateSlugs(): string[] {
  if (!fs.existsSync(updatesHiDirectory)) return [];
  return fs
    .readdirSync(updatesHiDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getHindiUpdateMeta(slug: string): UpdateHiMeta | null {
  const filePath = path.join(updatesHiDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContents);
  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    category: data.category || "सरकारी नौकरी",
    type: data.type || "notification",
    organization: data.organization || "",
    examName: data.examName || "",
    stage: data.stage || "",
    keywords: data.keywords || [],
    officialLinks: data.officialLinks || [],
    readingTime: data.readingTime,
    publishedDate: data.publishedDate || "",
    status: data.status || "active",
  };
}

export async function getHindiUpdateBySlug(slug: string): Promise<UpdateHi | null> {
  const filePath = path.join(updatesHiDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const meta = getHindiUpdateMeta(slug)!;
  let contentHtml = processedContent.toString();
  contentHtml = contentHtml.replace(
    /<code>(https?:\/\/[^<\s"']+)<\/code>/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return { ...meta, contentHtml };
}

export function getRelatedHindiUpdates(slug: string, limit = 5): UpdateHiMeta[] {
  const current = getHindiUpdateMeta(slug);
  if (!current) return [];
  const slugs = getAllHindiUpdateSlugs();
  const all = slugs.map((s) => getHindiUpdateMeta(s)).filter(Boolean) as UpdateHiMeta[];
  const sameExam = all.filter((u) => u.examName === current.examName && u.slug !== slug);
  if (sameExam.length >= limit) return sameExam.slice(0, limit);
  const sameOrg = all.filter(
    (u) => u.organization === current.organization && u.slug !== slug && !sameExam.find((s) => s.slug === u.slug)
  );
  return [...sameExam, ...sameOrg].slice(0, limit);
}
