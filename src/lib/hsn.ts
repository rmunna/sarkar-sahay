import { readFileSync } from "fs";
import path from "path";

export interface HSNRecord {
  code: string;
  type: "HSN" | "SAC";
  description: string;
  gstRate: number;
  chapter: string;
  chapterName: string;
  examples: string[];
  notes?: string;
}

export interface ChapterEntry {
  code: string;
  name: string;
  count: number;
}

let _index: Record<string, HSNRecord> | null = null;
let _all: HSNRecord[] | null = null;
let _chapters: Record<string, string> | null = null;
let _chapterList: ChapterEntry[] | null = null;

function loadIndex(): Record<string, HSNRecord> {
  if (!_index) {
    const filePath = path.join(process.cwd(), "data", "hsn", "index.json");
    _index = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return _index!;
}

function loadAll(): HSNRecord[] {
  if (!_all) {
    const filePath = path.join(process.cwd(), "data", "hsn", "all.json");
    _all = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return _all!;
}

function loadChapters(): Record<string, string> {
  if (!_chapters) {
    const filePath = path.join(process.cwd(), "data", "hsn", "chapters.json");
    _chapters = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return _chapters!;
}

function loadChapterList(): ChapterEntry[] {
  if (!_chapterList) {
    const filePath = path.join(process.cwd(), "data", "hsn", "chapter-list.json");
    _chapterList = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return _chapterList!;
}

export function getHSNByCode(code: string): HSNRecord | null {
  const index = loadIndex();
  return index[code.toUpperCase()] ?? index[code] ?? null;
}

export function getAllHSNCodes(): HSNRecord[] {
  return loadAll();
}

export function getHSNByChapter(chapter: string): HSNRecord[] {
  return loadAll().filter((r) => r.chapter === chapter);
}

export function getChapterList(): ChapterEntry[] {
  return loadChapterList();
}

export function getChapterName(chapter: string): string {
  return loadChapters()[chapter] ?? `Chapter ${chapter}`;
}

export function searchHSN(query: string, limit = 20): HSNRecord[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const all = loadAll();
  const exactCode = all.filter((r) => r.code.startsWith(q));
  const descMatch = all.filter(
    (r) => !r.code.startsWith(q) && (r.description.toLowerCase().includes(q) || r.examples.some((e) => e.toLowerCase().includes(q)))
  );
  return [...exactCode, ...descMatch].slice(0, limit);
}

export function getAllHSNParams(): { code: string }[] {
  return loadAll().map((r) => ({ code: r.code.toLowerCase() }));
}

export function getRelatedHSN(record: HSNRecord, limit = 6): HSNRecord[] {
  return loadAll()
    .filter((r) => r.chapter === record.chapter && r.code !== record.code)
    .slice(0, limit);
}
