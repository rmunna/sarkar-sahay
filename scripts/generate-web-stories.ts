import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = path.resolve(__dirname, "..");
const GUIDES_DIR = path.join(ROOT, "content/guides");
const OUT_DIR = path.join(ROOT, "public/stories");
const SITE = "https://www.citizennest.com";

const CATEGORY_COLORS: Record<string, string> = {
  "Identity Documents": "#1e40af",
  "Government Schemes": "#047857",
  "Tax & Finance": "#7c3aed",
  "Jobs & Exams": "#dc2626",
  Certificates: "#0891b2",
  Utilities: "#d97706",
  "Property & Legal": "#4338ca",
  "Food & Ration": "#059669",
  "State Schemes": "#e11d48",
};

function getColor(category: string): string {
  return CATEGORY_COLORS[category] || "#1e40af";
}

function darken(hex: string): string {
  // Simple darken by mixing with black
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface SlideContent {
  title: string;
  points: string[];
}

function extractSlides(content: string, guideTitle: string): SlideContent[] {
  const slides: SlideContent[] = [];
  const lines = content.split("\n");
  let currentHeading = "";
  let currentPoints: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const bullet = line.match(/^[-*]\s+\*\*(.+?)\*\*[:\s]*(.*)/);
    const plainBullet = line.match(/^[-*]\s+(.{15,120})$/);

    if (h2 || h3) {
      if (currentHeading && currentPoints.length > 0) {
        slides.push({ title: currentHeading, points: currentPoints.slice(0, 4) });
      }
      currentHeading = (h2 || h3)![1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
      currentPoints = [];
    } else if (bullet) {
      const text = `${bullet[1]}${bullet[2] ? ": " + bullet[2] : ""}`.trim();
      if (text.length > 10 && text.length < 150) currentPoints.push(text);
    } else if (plainBullet && currentPoints.length < 4) {
      const text = plainBullet[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "").trim();
      if (text.length > 10 && text.length < 150) currentPoints.push(text);
    }
  }
  if (currentHeading && currentPoints.length > 0) {
    slides.push({ title: currentHeading, points: currentPoints.slice(0, 4) });
  }

  // Pick best 5-6 slides (skip very short ones)
  const good = slides.filter((s) => s.points.length >= 2);
  return good.slice(0, 6);
}

function generateStoryHTML(
  slug: string,
  title: string,
  description: string,
  category: string,
  slides: SlideContent[]
): string {
  const color = getColor(category);
  const dark = darken(color);

  const storyPages = slides
    .map(
      (slide, i) => `
    <amp-story-page id="page-${i + 1}">
      <amp-story-grid-layer template="fill">
        <div style="width:100%;height:100%;background:linear-gradient(135deg, ${color} 0%, ${dark} 100%);"></div>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="story-layer">
        <div style="padding:24px;">
          <h2 style="color:#fff;font-size:1.4em;margin-bottom:16px;line-height:1.3;">${escapeHtml(slide.title)}</h2>
          ${slide.points.map((p) => `<p style="color:rgba(255,255,255,0.92);font-size:0.95em;margin:8px 0;line-height:1.5;">• ${escapeHtml(p)}</p>`).join("\n          ")}
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`
    )
    .join("\n");

  // CTA last page
  const ctaPage = `
    <amp-story-page id="page-cta">
      <amp-story-grid-layer template="fill">
        <div style="width:100%;height:100%;background:linear-gradient(135deg, ${color} 0%, ${dark} 100%);"></div>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="story-layer">
        <div style="padding:24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
          <h2 style="color:#fff;font-size:1.5em;margin-bottom:12px;">Read the Full Guide</h2>
          <p style="color:rgba(255,255,255,0.85);font-size:1em;margin-bottom:24px;">${escapeHtml(description.slice(0, 120))}</p>
          <a href="${SITE}/guide/${slug}" style="background:#fff;color:${color};padding:14px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:1.1em;">Read on CitizenNest →</a>
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`;

  return `<!doctype html>
<html ⚡>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - Web Story | CitizenNest</title>
  <link rel="canonical" href="${SITE}/stories/${slug}.html">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${escapeJson(title)}",
    "description": "${escapeJson(description.slice(0, 160))}",
    "publisher": {
      "@type": "Organization",
      "name": "CitizenNest",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE}/favicon.svg"
      }
    }
  }
  </script>
  <style amp-custom>
    * { box-sizing: border-box; }
    .story-layer { display: flex; align-items: center; }
  </style>
</head>
<body>
  <amp-story standalone
    title="${escapeHtml(title)}"
    publisher="CitizenNest"
    publisher-logo-src="${SITE}/favicon.svg"
    poster-portrait-src="${SITE}/favicon.svg">
${storyPages}
${ctaPage}
  </amp-story>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeJson(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

function generateSitemap(slugs: string[]): string {
  const today = new Date().toISOString().split("T")[0];
  const urls = slugs
    .map(
      (slug) => `  <url>
    <loc>${SITE}/stories/${slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// --- MAIN ---
async function main() {
  const priorityData = JSON.parse(fs.readFileSync(path.join(ROOT, "agents/priority-guides.json"), "utf-8"));
  const allSlugs: string[] = [...(priorityData.tier1 || []), ...(priorityData.tier2 || [])];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const generated: string[] = [];
  const manifest: Array<{ slug: string; title: string; description: string; category: string }> = [];

  for (const slug of allSlugs) {
    const mdPath = path.join(GUIDES_DIR, `${slug}.md`);
    if (!fs.existsSync(mdPath)) {
      console.log(`⏭  Skipping ${slug} (no markdown file)`);
      continue;
    }

    const raw = fs.readFileSync(mdPath, "utf-8");
    const { data, content } = matter(raw);
    const title = data.title || slug;
    const description = data.description || "";
    const category = data.category || "Identity Documents";

    const slides = extractSlides(content, title);
    if (slides.length < 3) {
      console.log(`⏭  Skipping ${slug} (only ${slides.length} slides extracted)`);
      continue;
    }

    const html = generateStoryHTML(slug, title, description, category, slides);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, "utf-8");
    generated.push(slug);
    manifest.push({ slug, title, description: description.slice(0, 200), category });
    console.log(`✅ ${slug} (${slides.length} slides)`);
  }

  // Write sitemap
  fs.writeFileSync(path.join(ROOT, "public/stories-sitemap.xml"), generateSitemap(generated), "utf-8");
  console.log(`\n📄 stories-sitemap.xml (${generated.length} stories)`);

  // Write manifest for the listing page
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`📋 manifest.json written`);

  console.log(`\n🎉 Generated ${generated.length} web stories`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
