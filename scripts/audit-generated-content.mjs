#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const deleteRejected = args.has("--delete-rejected");
const revertRejected = args.has("--revert-rejected");
const checkLinks = args.has("--check-links");
const failOnReject = args.has("--fail-on-reject");

const scopedDirs = process.argv
  .slice(2)
  .filter(arg => arg.startsWith("--dir="))
  .map(arg => arg.slice("--dir=".length));
const dirs = scopedDirs.length ? scopedDirs : ["content/updates", "content/guides"];

const candidates = changedMarkdownFiles(dirs);
const results = [];

for (const file of candidates) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;
  const result = await auditFile(file, fullPath);
  results.push(result);
  if (!result.ok && deleteRejected) {
    fs.unlinkSync(fullPath);
  }
  if (!result.ok && revertRejected) {
    revertOrDelete(file, fullPath);
  }
}

const report = {
  ok: results.every(result => result.ok),
  checked: results.length,
  accepted: results.filter(result => result.ok).length,
  rejected: results.filter(result => !result.ok).length,
  results,
};

fs.mkdirSync(path.join(ROOT, "agents"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "agents", "generated-content-audit.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (failOnReject && !report.ok) process.exit(1);

function changedMarkdownFiles(targetDirs) {
  const output = execSync("git status --porcelain -- " + targetDirs.map(shellQuote).join(" "), {
    cwd: ROOT,
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map(line => line.trimEnd())
    .filter(Boolean)
    .map(line => line.slice(3))
    .filter(file => file.endsWith(".md"))
    .filter(file => targetDirs.some(dir => file === dir || file.startsWith(`${dir}/`)))
    .sort();
}

async function auditFile(file, fullPath) {
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const body = parsed.content.trim();
  const fm = parsed.data || {};
  const issues = [];
  const warnings = [];
  const kind = file.startsWith("content/updates/") ? "update" : "guide";
  const wordCount = countWords(body);

  requireString(fm.title, "title", issues);
  requireString(fm.description, "description", issues);
  if (fm.description && String(fm.description).length > 180) {
    issues.push("description too long");
  }

  if (kind === "update") {
    requireString(fm.organization, "organization", issues);
    requireString(fm.examName, "examName", issues);
    requireString(fm.stage || fm.type, "stage/type", issues);
    if (wordCount < 750) issues.push(`thin update body: ${wordCount} words`);
    if (body.length < 4_500) issues.push(`thin update body: ${body.length} chars`);
  } else {
    if (wordCount < 900) issues.push(`thin guide body: ${wordCount} words`);
  }

  const officialLinks = normalizeLinks(fm.officialLinks);
  if (officialLinks.length === 0) {
    issues.push("missing officialLinks");
  }
  for (const link of officialLinks) {
    if (!isOfficialishUrl(link)) issues.push(`untrusted official link: ${link}`);
    if (checkLinks) {
      const probe = await probeLink(link);
      if (probe === "gone") issues.push(`official link returned 404/410: ${link}`);
      // Gov sites routinely time out or block datacenter IPs (the GitHub
      // runner is in the US), so unreachable is not proof the page is bad.
      if (probe === "unreachable") warnings.push(`official link did not respond from runner: ${link}`);
    }
  }

  const fullText = `${raw}\n${body}`.toLowerCase();
  for (const phrase of bannedPhrases()) {
    if (fullText.includes(phrase.toLowerCase())) issues.push(`banned phrase: ${phrase}`);
  }

  const tbaCount = (body.match(/\bTBA\b/g) || []).length;
  if (kind === "update" && tbaCount > 4) issues.push(`excessive TBA count: ${tbaCount}`);

  if (/\bexpected\s+(fee|fees|pay|pay scale|salary|fellowship|vacanc|date|timeline)/i.test(raw)) {
    issues.push("unsupported expected fee/pay/date language");
  }
  if (/\b(typically|required|standard)\b.{0,80}\b(fee|qualification|pay|selection|age|vacanc)/i.test(raw)) {
    issues.push("unsupported typical/standard eligibility or fee language");
  }

  return {
    file,
    ok: issues.length === 0,
    kind,
    wordCount,
    charCount: body.length,
    officialLinks,
    issues,
    warnings,
  };
}

function requireString(value, label, issues) {
  if (!value || typeof value !== "string" || !value.trim()) {
    issues.push(`missing ${label}`);
  }
}

function normalizeLinks(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [String(value)].filter(Boolean);
}

function isOfficialishUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host.endsWith(".gov.in") || host.endsWith(".nic.in")) return true;
  if (host.endsWith(".ac.in")) return true;
  if (host.endsWith(".res.in")) return true;
  return [
    "irctc.co.in",
    "ssc.gov.in",
    "nta.ac.in",
    "ugcnet.nta.nic.in",
    "ctet.nic.in",
    "cbse.gov.in",
    "rpsc.rajasthan.gov.in",
    "cetonline.karnataka.gov.in",
    "kea.kar.nic.in",
    "pmsuryaghar.gov.in",
    "solarrooftop.gov.in",
    "rbi.org.in",
    "sbi.co.in",
    "ibps.in",
    "rrbcdg.gov.in",
    "upsc.gov.in",
  ].includes(host);
}

const PROBE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
};

// "ok" — link confirmed live. "gone" — server said 404/410, the page is
// definitively dead. "unreachable" — timeout, TLS error, bot-block or other
// non-definitive failure; gov.in hosts do this constantly to foreign IPs.
async function probeLink(value) {
  const attempt = async (method) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(value, {
        method,
        redirect: "follow",
        headers: PROBE_HEADERS,
        signal: controller.signal,
      });
      if (response.status >= 200 && response.status < 400) return "ok";
      if (response.status === 404 || response.status === 410) return "gone";
      return "blocked";
    } catch {
      return "error";
    } finally {
      clearTimeout(timeout);
    }
  };

  const head = await attempt("HEAD");
  if (head === "ok") return "ok";
  // Never trust a non-200 HEAD: csbc.bihar.gov.in answers 404 to HEAD but 200
  // to GET. Only a GET 404/410 proves the page is gone.
  const get = await attempt("GET");
  if (get === "ok" || get === "gone") return get;
  const retry = await attempt("GET");
  if (retry === "ok" || retry === "gone") return retry;
  return "unreachable";
}

function bannedPhrases() {
  return [
    "CitizenNest detected",
    "CitizenNest created this page",
    "publishing this tracker",
    "without adding unverified",
    "search demand is rising",
    "not been confirmed from the official source yet",
    "As an AI",
    "Given the prompt",
    "I cannot determine",
  ];
}

function countWords(value) {
  return (value.match(/[A-Za-z0-9\u0900-\u097F]+/g) || []).length;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function revertOrDelete(file, fullPath) {
  if (isTracked(file)) {
    const previous = execFileSync("git", ["show", `HEAD:${file}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    fs.writeFileSync(fullPath, previous, "utf8");
  } else if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function isTracked(file) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", file], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
