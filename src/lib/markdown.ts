import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

/** Render a markdown string to HTML (GFM). Used for myScheme detail fields. */
export async function renderMarkdown(md?: string | null): Promise<string> {
  if (!md || !md.trim()) return "";
  const out = await remark().use(remarkGfm).use(html).process(md.trim());
  return out.toString();
}
