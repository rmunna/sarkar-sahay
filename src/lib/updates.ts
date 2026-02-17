import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const updatesDirectory = path.join(process.cwd(), "content/updates");

export interface ImportantDates {
  notificationDate?: string;
  lastDateToApply?: string;
  lastDateFeePayment?: string;
  examDate?: string;
  admitCardDate?: string;
  resultDate?: string;
  [key: string]: string | undefined;
}

export interface UpdateMeta {
  slug: string;
  title: string;
  description: string;
  category: string; // "Government Jobs" | "Entrance Exams" | "Results" | "Admit Cards"
  type: string; // notification | admit-card | exam-schedule | result | cutoff | answer-key
  organization: string;
  examName: string;
  stage: string;
  keywords: string[];
  importantDates: ImportantDates;
  officialLinks: string[];
  readingTime?: string;
  publishedDate: string;
  expiryDate?: string;
  status: string; // active | expired | superseded
  relatedStages?: { slug: string; stage: string; status: string }[];
  vacancies?: number | string;
}

export interface Update extends UpdateMeta {
  contentHtml: string;
}

export function getAllUpdateSlugs(): string[] {
  if (!fs.existsSync(updatesDirectory)) return [];
  return fs
    .readdirSync(updatesDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getUpdateMeta(slug: string): UpdateMeta | null {
  const filePath = path.join(updatesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContents);
  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    category: data.category || "Government Jobs",
    type: data.type || "notification",
    organization: data.organization || "",
    examName: data.examName || "",
    stage: data.stage || "",
    keywords: data.keywords || [],
    importantDates: data.importantDates || {},
    officialLinks: data.officialLinks || [],
    readingTime: data.readingTime,
    publishedDate: data.publishedDate || "",
    expiryDate: data.expiryDate,
    status: data.status || "active",
    relatedStages: data.relatedStages,
    vacancies: data.vacancies,
  };
}

export function getAllUpdates(): UpdateMeta[] {
  const slugs = getAllUpdateSlugs();
  return slugs
    .map((slug) => getUpdateMeta(slug))
    .filter(Boolean) as UpdateMeta[];
}

export function getActiveUpdates(): UpdateMeta[] {
  const today = new Date().toISOString().split("T")[0];
  return getAllUpdates()
    .filter((u) => u.status === "active")
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

export function getUpdatesByExam(examName: string): UpdateMeta[] {
  return getAllUpdates()
    .filter((u) => u.examName === examName)
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

export function getUpdatesByOrganization(org: string): UpdateMeta[] {
  return getAllUpdates()
    .filter((u) => u.organization === org)
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

export function getRelatedUpdates(slug: string, limit = 5): UpdateMeta[] {
  const current = getUpdateMeta(slug);
  if (!current) return [];
  const all = getAllUpdates();

  // Priority: same exam (other stages) > same org > same category
  const sameExam = all.filter(
    (u) => u.examName === current.examName && u.slug !== slug
  );
  if (sameExam.length >= limit) return sameExam.slice(0, limit);

  const sameOrg = all.filter(
    (u) =>
      u.organization === current.organization &&
      u.slug !== slug &&
      !sameExam.find((s) => s.slug === u.slug)
  );

  return [...sameExam, ...sameOrg].slice(0, limit);
}

export async function getUpdateBySlug(slug: string): Promise<Update | null> {
  const filePath = path.join(updatesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const meta = getUpdateMeta(slug)!;
  return { ...meta, contentHtml: processedContent.toString() };
}

export function getUpdateRawContent(slug: string): string | null {
  const filePath = path.join(updatesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContents);
  return content;
}

export function getUpdateCategories(): { name: string; count: number }[] {
  const updates = getActiveUpdates();
  const map: Record<string, number> = {};
  updates.forEach((u) => {
    map[u.category] = (map[u.category] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getOrganizations(): { name: string; count: number }[] {
  const updates = getActiveUpdates();
  const map: Record<string, number> = {};
  updates.forEach((u) => {
    map[u.organization] = (map[u.organization] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
