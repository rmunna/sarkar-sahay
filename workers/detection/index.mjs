import config from "./sources.json" with { type: "json" };

const STATE_PREFIX = "source:";
const DETECTION_PREFIX = "detection:";
const PROCESS_PREFIX = "process:";
const WATCH_PREFIX = "watch:";
const WATCH_INDEX_KEY = "watch:index";
const OPPORTUNITY_PREFIX = "opportunity:";
const OPPORTUNITY_INDEX_KEY = "opportunity:index";
const OPPORTUNITY_RUN_KEY = "opportunity:last-run";
const RECENT_KEY = "detections:recent";
const DEFAULT_TIER = 2;
const MAX_RECENT = 100;
const MAX_WATCH_TOPICS = 100;
const MAX_OPPORTUNITIES = 200;
const DEFAULT_MIN_DISPATCH_CONFIDENCE = 0.75;
const DEFAULT_MIN_OPPORTUNITY_SCORE = 86;
const HEALTH_STALE_MINUTES = 45;
const FINGERPRINT_SCHEMA_VERSION = "2026-06-09.1";
const DEFAULT_FETCH_TIMEOUT_MS = 12000;
const DEFAULT_MAX_HTML_CHARS = 450_000;
const DEFAULT_MAX_ANCHORS = 350;
const DEFAULT_SCAN_SOURCE_LIMIT = 8;
const DEFAULT_MAX_TREND_CONFIRMATIONS = 6;
const DEFAULT_MIN_TREND_CONFIRM_SCORE = 68;
const DEFAULT_MIN_PREPOSITION_SCORE = 82;

const KEYWORDS = [
  "notice", "notification", "result", "admit", "hall ticket", "answer key",
  "exam", "schedule", "recruitment", "vacancy", "apply", "registration",
  "cut off", "cutoff", "scorecard", "marksheet", "counselling", "counseling",
  "merit", "interview", "written", "city intimation"
];

const TREND_SIGNAL_KEYWORDS = [
  "result", "results", "exam", "exams", "admit card", "hall ticket",
  "answer key", "response sheet", "cut off", "cutoff", "cut-off",
  "scorecard", "score card", "marksheet", "mark sheet", "rank card",
  "merit list", "final list", "shortlisted", "selection list",
  "counselling", "counseling", "seat allotment", "registration",
  "application form", "apply online", "last date", "exam date",
  "schedule", "date sheet", "time table", "notification", "notice",
  "recruitment", "vacancy", "job", "jobs", "bharti", "sarkari naukri",
  "constable", "police", "teacher", "clerk", "po", "mts", "stenographer"
];

const TREND_SIGNAL_ORGS = [
  "ssc", "upsc", "nta", "cbse", "nios", "rrb", "ibps", "sbi",
  "rbi", "csbc", "bpsc", "bssc", "bseb", "uppsc", "upsssc",
  "upprpb", "dsssb", "kvs", "nvs", "ctet", "ugc net", "neet",
  "jee", "cuet", "gate", "clat", "iiser", "iat", "icai", "icmai",
  "india post", "indiapost", "gds", "gramin dak sevak",
  "kea", "kcet", "cet", "mht cet", "comedk", "tspsc",
  "appsc", "tnpsc", "kpsc", "mppsc", "rpsc", "gpsc", "opsc",
  "jpsc", "hpsc", "hppsc", "ukpsc", "wbpsc", "ap eamcet",
  "ts eamcet", "eamcet", "msbte", "ignou", "du", "anna university",
  "calicut university", "ktu"
];

const TREND_SIGNAL_SKIP = /\b(cricket|ipl|t20|stock market|nifty|sensex|movie|ott|song|weather|earthquake|lottery|horoscope|share price|election result|football|kabaddi)\b/i;
const PRE_RELEASE_PATTERN = /\b(expected|expected soon|likely|may release|to be released|release date|tentative|soon|awaited|kab aayega|when will|not yet released)\b/i;

const TREND_OFFICIAL_SOURCES = [
  { id: "ssc", terms: ["ssc"], officialUrls: ["https://ssc.gov.in"] },
  { id: "cuet-ug", terms: ["cuet", "cuet ug"], officialUrls: ["https://cuet.nta.nic.in/"] },
  { id: "nta", terms: ["nta", "neet", "jee", "ugc net"], officialUrls: ["https://nta.ac.in"] },
  { id: "upsc", terms: ["upsc"], officialUrls: ["https://www.upsc.gov.in"] },
  { id: "kea", terms: ["kea", "kcet", "cet"], officialUrls: ["https://cetonline.karnataka.gov.in/kea/"] },
  { id: "rrb", terms: ["rrb"], officialUrls: ["https://www.rrbcdg.gov.in/"] },
  { id: "ibps", terms: ["ibps"], officialUrls: ["https://www.ibps.in/"] },
  { id: "sbi-careers", terms: ["sbi"], officialUrls: ["https://bank.sbi/web/careers/current-openings"] },
  { id: "cbse-results", terms: ["cbse", "ctet"], officialUrls: ["https://results.cbse.nic.in/", "https://www.cbse.gov.in/cbsenew/cbse.html"] },
  { id: "nios-results", terms: ["nios"], officialUrls: ["https://results.nios.ac.in/"] },
  { id: "csbc-official", terms: ["csbc", "bihar police", "bihar constable"], officialUrls: ["https://csbc.bihar.gov.in/"] },
  { id: "bpsc", terms: ["bpsc"], officialUrls: ["https://bpsc.bihar.gov.in/"] },
  { id: "dsssb", terms: ["dsssb"], officialUrls: ["https://dsssb.delhi.gov.in/"] },
  { id: "india-post-gds", terms: ["india post", "indiapost", "gds", "gramin dak sevak"], officialUrls: ["https://indiapostgdsonline.gov.in/"] }
];

const NOISE = [
  "visitor", "counter", "tender", "annual report", "privacy", "terms",
  "facebook", "twitter", "instagram", "youtube", "login#", "javascript:",
  "style.css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff"
];

const STAGE_PATTERNS = [
  ["admit-card", /\b(admit card|hall ticket|call letter|city intimation|exam city)\b/i],
  ["result", /\b(result|scorecard|marksheet|merit list|shortlisted|provisional list)\b/i],
  ["answer-key", /\b(answer key|response sheet|objection|challenge)\b/i],
  ["exam-schedule", /\b(schedule|exam date|time table|date sheet|written exam|interview schedule)\b/i],
  ["notification", /\b(notification|advertisement|recruitment|vacanc(?:y|ies)|notice|cen|crp)\b/i],
  ["registration", /\b(apply online|registration|application form|last date|online application)\b/i],
  ["cutoff", /\b(cut off|cutoff|cut-off)\b/i]
];

const OPPORTUNITY_CATEGORIES = [
  ["scheme", /\b(scheme|yojana|subsidy|beneficiary|dbt|pension|scholarship|loan|insurance|awas|ayushman|ujjwala|mudra|kisan|pm[- ]?surya|solar|apaar|abha|my bharat)\b|योजना|सब्सिडी|पेंशन|छात्रवृत्ति|ऋण|बीमा|किसान|आवास|आयुष्मान|उज्ज्वला/i],
  ["policy-change", /\b(deadline|extended|revised|amendment|guidelines|new rules|fee|charges|tax|last date|registration)\b|अंतिम तिथि|विस्तार|संशोधित|अधिसूचना|शुल्क|नए नियम/i],
  ["digital-service", /\b(portal|app|digital|online|registration|login|download|certificate|locker|health locker|id)\b|पोर्टल|ऐप|डिजिटल|ऑनलाइन|पंजीकरण|प्रमाण पत्र/i],
  ["exam-jobs", /\b(recruitment|vacancy|exam|result|admit card|answer key|notification)\b|भर्ती|रिक्ति|परीक्षा|परिणाम|प्रवेश पत्र/i]
];

const OPPORTUNITY_SKIP = /\b(tender|auction|annual report|conference|webinar|condolence|greetings|statistical supplement|monetary penalty|co-operative bank|treasury bill|government securities)\b|शोक|बधाई|सम्मेलन/i;

const LOW_COMPETITION_TOPICS = [
  "apaar", "pm surya", "abha", "health locker", "my bharat", "nyps",
  "farmer id", "agri stack", "agristack", "bharat vistaar", "bhashini",
  "aikosha", "indiaai", "ondc saarthi", "samadhan didi", "kar saathi"
];

const EXISTING_PAGE_TARGETS = [
  { terms: ["apaar"], slug: "/guide/apaar-id-guide", action: "update_existing" },
  { terms: ["pm surya", "surya ghar", "solar"], slug: "/guide/pm-surya-ghar-muft-bijli", action: "update_existing" },
  { terms: ["health locker", "abha records", "health records", "abha consent", "consent manager"], slug: "/guide/abha-health-locker-records-guide", action: "update_existing" },
  { terms: ["abha", "digital health id", "ayushman bharat health account"], slug: "/guide/abha-health-id", action: "update_existing" },
  { terms: ["my bharat certificate", "mera yuva bharat certificate", "youth certificate"], slug: "/guide/my-bharat-certificate-download", action: "update_existing" },
  { terms: ["my bharat experiential", "my bharat opportunity", "my bharat opportunities", "nyps opportunity", "youth volunteering"], slug: "/guide/my-bharat-experiential-learning-guide", action: "update_existing" },
  { terms: ["my bharat", "mera yuva bharat", "nyps", "nyps 2.0", "youth portal"], slug: "/guide/my-bharat-registration-guide", action: "update_existing" },
  { terms: ["farmer registry status", "farmer id status", "enrollment status", "odfr", "mpfr", "cgfr"], slug: "/guide/farmer-registry-status-check", action: "update_existing" },
  { terms: ["farmer id vs farm id", "farm id", "kisan id", "bucket id"], slug: "/guide/farmer-id-vs-farm-id-agristack", action: "update_existing" },
  { terms: ["farmer id", "agri stack", "agristack", "farmer registry", "digital agriculture mission", "farmer enrollment"], slug: "/guide/farmer-id-agri-stack-guide", action: "update_existing" },
  { terms: ["government ai services", "ai for citizens", "ai for all", "india ai mission", "indiaai mission", "ai in government"], slug: "/guide/government-ai-services-india", action: "update_existing" },
  { terms: ["bhashini", "saarthi", "vyoma"], slug: "/guide/bhashini-ondc-saarthi-multilingual-ai-guide", action: "update_existing" },
  { terms: ["indiaai", "aikosha", "compute"], slug: "/guide/indiaai-compute-aikosha-students-developers-guide", action: "update_existing" }
];

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(Promise.all([
      scanAndPersist(env, { tier: DEFAULT_TIER, dryRun: false, sourceId: null, limit: DEFAULT_SCAN_SOURCE_LIMIT }),
      scanOpportunityQueue(env, { tier: DEFAULT_TIER, dryRun: false }),
      scanTrendSignals(env, { dryRun: false })
    ]));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\/cn-monitor(?=\/|$)/, "") || "/";

    if (pathname === "/health") {
      return json({ ok: true, service: "citizennest-detection-worker", sources: config.sources.length });
    }

    if (pathname === "/scan") {
      const tier = Number(url.searchParams.get("tier") || DEFAULT_TIER);
      const sourceId = url.searchParams.get("source");
      const limit = scanLimitFromParam(url.searchParams.get("limit"), sourceId);
      const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await scanAndPersist(env, { tier, dryRun, sourceId, limit });
      return json(result);
    }

    if (pathname === "/backfill") {
      const sourceId = url.searchParams.get("source");
      const days = Number(url.searchParams.get("days") || 7);
      const limit = Number(url.searchParams.get("limit") || 12);
      const dryRun = url.searchParams.get("dryRun") !== "0";
      if (!sourceId) {
        return json({ ok: false, error: "source is required" }, 400);
      }
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await backfillRecentSource(env, { sourceId, days, limit, dryRun });
      return json(result);
    }

    if (pathname === "/opportunities") {
      const tier = Number(url.searchParams.get("tier") || 2);
      const sourceId = url.searchParams.get("source");
      const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await scanOpportunityQueue(env, { tier, dryRun, sourceId });
      return json(result);
    }

    if (pathname === "/opportunities/queue") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const status = url.searchParams.get("status");
      const queue = await readOpportunityQueue(env, { status });
      return json({ ok: true, count: queue.length, opportunities: queue });
    }

    if (pathname === "/opportunities/summary") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const queue = await readOpportunityQueue(env, {});
      return json({ ok: true, summary: summarizeOpportunities(queue), opportunities: queue.slice(0, 25) });
    }

    if (pathname === "/opportunities/mark") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const body = await request.json().catch(() => null);
      if (!body?.keys?.length || !body.status) {
        return json({ ok: false, error: "keys and status are required" }, 400);
      }
      await markOpportunityStatuses(env, body.keys, body.status, body);
      return json({ ok: true, marked: body.keys.length, status: body.status });
    }

    if (pathname === "/trend-signals") {
      const dryRun = url.searchParams.get("dryRun") !== "0";
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await scanTrendSignals(env, { dryRun });
      return json(result);
    }

    if (pathname === "/watchlist") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const watchlist = await readWatchlist(env);
      return json({ ok: true, watchCount: watchlist.length, watchlist });
    }

    if (pathname === "/detections/recent") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const recent = await readRecent(env);
      return json({ detections: recent });
    }

    if (pathname === "/sources/status") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      return json({ sources: await readSourcesStatus(env) });
    }

    if (pathname === "/detections/status") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const fingerprints = (url.searchParams.get("fingerprints") || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
        .slice(0, 50);
      return json({ statuses: await readProcessStatuses(env, fingerprints) });
    }

    if (pathname === "/detections/mark") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const body = await request.json().catch(() => null);
      if (!body?.fingerprints?.length || !body.status) {
        return json({ ok: false, error: "fingerprints and status are required" }, 400);
      }
      await markProcessStatuses(env, body.fingerprints, body.status, body);
      return json({ ok: true, marked: body.fingerprints.length, status: body.status });
    }

    if (pathname === "/notify/pages-created") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const body = await request.json().catch(() => null);
      if (!body?.urls?.length) {
        return json({ ok: false, error: "urls are required" }, 400);
      }
      const result = await sendPageCreatedEmail(env, body);
      return json(result);
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
};

async function backfillRecentSource(env, options) {
  const source = config.sources.find(item => item.id === options.sourceId);
  if (!source) {
    return { ok: false, dryRun: options.dryRun, sourceId: options.sourceId, error: "source not found" };
  }

  const startedAt = new Date().toISOString();
  const result = await scanSource(source, env);
  const cutoffMs = Date.parse(startedAt) - Math.max(1, Number(options.days || 7)) * 86400000;
  const state = getStateBinding(env);
  const candidates = [];
  const rejected = [];

  for (const item of result.items || []) {
    const decision = backfillDecision(source, item, cutoffMs);
    if (!decision.ok) {
      rejected.push({
        title: item.title,
        url: item.url,
        fingerprint: item.fingerprint,
        reason: decision.reason
      });
      continue;
    }

    const existing = await state.get(`${PROCESS_PREFIX}${item.fingerprint}`);
    if (existing) {
      rejected.push({
        title: item.title,
        url: item.url,
        fingerprint: item.fingerprint,
        reason: "already processed or queued"
      });
      continue;
    }

    candidates.push({
      ...item,
      sourceId: source.id,
      sourceName: source.name,
      strategy: source.strategy,
      detectedAt: startedAt,
      backfill: true,
      backfillReason: "recent official item exists but was not previously handed to generation"
    });
  }

  const selected = candidates.slice(0, Math.max(1, Number(options.limit || 12)));
  let claimed = [];
  if (!options.dryRun && selected.length > 0) {
    await persistDetections(env, selected);
    claimed = await claimDetectionsForGeneration(env, selected);
    if (claimed.length > 0) {
      await notifyWebhook(env, claimed);
      await dispatchClaimedDetections(env, claimed);
    }
  }

  return {
    ok: true,
    dryRun: options.dryRun,
    scannedAt: startedAt,
    sourceId: source.id,
    sourceName: source.name,
    itemCount: result.items?.length || 0,
    candidateCount: candidates.length,
    selectedCount: selected.length,
    dispatchedCount: claimed.length,
    error: result.error || null,
    detections: selected,
    rejected: rejected.slice(0, 25)
  };
}

function backfillDecision(source, item, cutoffMs) {
  if (!item?.fingerprint) return { ok: false, reason: "missing fingerprint" };
  if (!isSourceFilterMatch(source, item.title, item.url)) return { ok: false, reason: "source include/exclude filter" };
  if ((item.confidence || 0) < DEFAULT_MIN_DISPATCH_CONFIDENCE) return { ok: false, reason: "low confidence" };
  if (item.stage === "other") return { ok: false, reason: "not a candidate-facing stage" };

  const itemMs = item.date ? Date.parse(item.date) : NaN;
  if (Number.isFinite(itemMs) && itemMs < cutoffMs) return { ok: false, reason: "older than backfill window" };
  return { ok: true };
}

async function scanAndPersist(env, options) {
  const state = getStateBinding(env);
  const eligibleSources = config.sources.filter(source => {
    if (options.sourceId) return source.id === options.sourceId;
    return Number(source.tier || 99) <= options.tier;
  });
  const sources = await selectSourcesForScan(state, eligibleSources, options);

  const startedAt = new Date().toISOString();
  const results = [];
  const detections = [];

  for (const source of sources) {
    const scanStarted = Date.now();
    const result = await scanSource(source, env);
    const previous = await readSourceState(state, source.id);
    const schemaChanged = previous.scannedAt
      && previous.fingerprintSchemaVersion !== FINGERPRINT_SCHEMA_VERSION;
    const previousFingerprints = new Set(schemaChanged ? [] : previous.fingerprints || []);
    const currentFingerprints = result.items.map(item => item.fingerprint);
    const hasComparableBaseline = !schemaChanged && previous.scannedAt && previousFingerprints.size > 0;
    const newItems = hasComparableBaseline
      ? result.items.filter(item => !previousFingerprints.has(item.fingerprint))
      : [];

    for (const item of newItems) {
      const detection = {
        ...item,
        sourceId: source.id,
        sourceName: source.name,
        strategy: source.strategy,
        detectedAt: startedAt
      };
      detections.push(detection);
    }

    if (!options.dryRun) {
      const successfulScan = !result.error && currentFingerprints.length > 0;
      await state.put(`${STATE_PREFIX}${source.id}`, JSON.stringify({
        scannedAt: startedAt,
        lastSuccessAt: successfulScan ? startedAt : previous.lastSuccessAt || null,
        sourceId: source.id,
        fingerprintSchemaVersion: FINGERPRINT_SCHEMA_VERSION,
        urlUsed: result.urlUsed || previous.urlUsed || null,
        extractionMode: result.extractionMode || previous.extractionMode || null,
        matchedSelectors: result.matchedSelectors || previous.matchedSelectors || [],
        fingerprints: successfulScan ? currentFingerprints.slice(0, 250) : previous.fingerprints || [],
        itemCount: result.items.length,
        lastGoodItemCount: successfulScan ? result.items.length : previous.lastGoodItemCount || 0,
        durationMs: Date.now() - scanStarted,
        error: result.error || null,
        consecutiveErrors: result.error ? Number(previous.consecutiveErrors || 0) + 1 : 0
      }));
    }

    results.push({
      sourceId: source.id,
      sourceName: source.name,
      strategy: source.strategy,
      urlUsed: result.urlUsed || null,
      extractionMode: result.extractionMode || null,
      matchedSelectors: result.matchedSelectors || [],
      itemCount: result.items.length,
      newCount: newItems.length,
      schemaChanged: Boolean(schemaChanged),
      error: result.error || null
    });
  }

  if (!options.dryRun && detections.length > 0) {
    await persistDetections(env, detections);
    const claimed = await claimDetectionsForGeneration(env, detections);
    if (claimed.length > 0) {
      await notifyWebhook(env, claimed);
      await dispatchClaimedDetections(env, claimed);
    }
  }

  return {
    ok: true,
    dryRun: options.dryRun,
    scannedAt: startedAt,
    sourceCount: sources.length,
    newCount: detections.length,
    results,
    detections
  };
}

async function selectSourcesForScan(state, sources, options) {
  if (options.sourceId) return sources;
  const limit = Number(options.limit || 0);
  if (!limit || sources.length <= limit) return sources;

  const withState = [];
  for (const source of sources) {
    const current = await readSourceState(state, source.id);
    const lastScan = current.scannedAt ? Date.parse(current.scannedAt) : 0;
    const consecutiveErrors = Number(current.consecutiveErrors || 0);
    withState.push({ source, lastScan, consecutiveErrors });
  }

  return withState
    .sort((a, b) => {
      if (a.lastScan !== b.lastScan) return a.lastScan - b.lastScan;
      if (a.consecutiveErrors !== b.consecutiveErrors) return a.consecutiveErrors - b.consecutiveErrors;
      return String(a.source.id).localeCompare(String(b.source.id));
    })
    .slice(0, limit)
    .map(item => item.source);
}

function scanLimitFromParam(value, sourceId) {
  if (sourceId) return 0;
  if (value === "all" || value === "0") return 0;
  if (value && Number.isFinite(Number(value))) return Math.max(1, Number(value));
  return DEFAULT_SCAN_SOURCE_LIMIT;
}

async function scanOpportunityQueue(env, options) {
  const startedAt = new Date().toISOString();
  const feedSources = config.sources.filter(source => {
    if (options.sourceId) return source.id === options.sourceId;
    return Number(source.tier || 99) <= options.tier && source.strategy === "rss";
  }).filter(source => source.strategy === "rss");
  const items = [];
  const results = [];

  for (const source of feedSources) {
    const result = await scanSource(source, env);
    const opportunities = result.items
      .map(item => scoreOpportunity(source, item))
      .filter(Boolean);
    items.push(...opportunities);
    results.push({
      sourceId: source.id,
      sourceName: source.name,
      itemCount: result.items.length,
      opportunityCount: opportunities.length,
      error: result.error || null
    });
  }

  const clusters = clusterOpportunities(items)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
  const queued = clusters.map(cluster => buildOpportunityRecord(cluster, startedAt));
  const queueUpdates = options.dryRun ? [] : await persistOpportunityQueue(env, queued, startedAt);
  const dispatchable = options.dryRun ? [] : await claimOpportunitiesForGeneration(env, queued);

  if (!options.dryRun && dispatchable.length > 0) {
    await notifyWebhook(env, dispatchable);
    await dispatchClaimedDetections(env, dispatchable);
  }
  const emailSummary = options.dryRun
    ? { skipped: true, reason: "dry run" }
    : await maybeSendOpportunitySummaryEmail(env, queued, queueUpdates, startedAt);

  return {
    ok: true,
    dryRun: options.dryRun,
    scannedAt: startedAt,
    sourceCount: feedSources.length,
    opportunityCount: items.length,
    clusterCount: clusters.length,
    queuedCount: queued.length,
    queueUpdates,
    dispatchableCount: dispatchable.length,
    emailSummary,
    summary: summarizeOpportunities(queued),
    results,
    opportunities: queued,
    clusters
  };
}

const scanOpportunities = scanOpportunityQueue;

async function scanTrendSignals(env, options) {
  const startedAt = new Date().toISOString();
  const source = config.sources.find(item => item.id === "google-trends-in");
  if (!source) {
    return {
      ok: false,
      dryRun: options.dryRun,
      scannedAt: startedAt,
      error: "google-trends-in source is not configured"
    };
  }

  const result = await scanGoogleTrendsRss(source, env);
  const signals = result
    .map(item => scoreTrendSignal(source, item))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
  const confirmation = await confirmTrendSignalsWithOfficialSources(env, signals, options, startedAt);
  const resolvedSignals = signals.map(signal => ({
    ...signal,
    ...(confirmation.signalUpdates.get(signal.topicKey) || {})
  }));
  const watchUpdates = options.dryRun ? [] : await persistTrendWatchlist(env, resolvedSignals, startedAt);

  if (!options.dryRun && confirmation.detections.length > 0) {
    await persistDetections(env, confirmation.detections);
    const claimed = await claimDetectionsForGeneration(env, confirmation.detections);
    if (claimed.length > 0) {
      await notifyWebhook(env, claimed);
      await dispatchClaimedDetections(env, claimed);
    }
    confirmation.dispatchedCount = claimed.length;
  }

  return {
    ok: true,
    dryRun: options.dryRun,
    scannedAt: startedAt,
    sourceId: source.id,
    sourceName: source.name,
    itemCount: result.length,
    signalCount: resolvedSignals.length,
    watchUpdates,
    confirmation: {
      checked: confirmation.checked,
      confirmedCount: confirmation.confirmed.length,
      rejectedCount: confirmation.rejected.length,
      prepositionCount: confirmation.prepositions.length,
      dispatchableCount: confirmation.detections.length,
      dispatchedCount: confirmation.dispatchedCount || 0,
      confirmed: confirmation.confirmed,
      rejected: confirmation.rejected,
      prepositions: confirmation.prepositions
    },
    note: "Trend signals are demand evidence only. The agent publishes only after official-source confirmation; otherwise it rejects with a reason.",
    signals: resolvedSignals
  };
}

async function confirmTrendSignalsWithOfficialSources(env, signals, options, now) {
  const state = getStateBinding(env);
  const maxConfirmations = Number(env.MAX_TREND_CONFIRMATIONS || DEFAULT_MAX_TREND_CONFIRMATIONS);
  const minConfirmScore = Number(env.MIN_TREND_CONFIRM_SCORE || DEFAULT_MIN_TREND_CONFIRM_SCORE);
  const candidates = signals
    .filter(signal => signal.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxConfirmations);
  const signalUpdates = new Map();
  const detections = [];
  const prepositions = [];
  const confirmed = [];
  const rejected = [];
  let checked = 0;

  for (const signal of candidates) {
    const sourceCandidates = officialSourcesForTrend(signal);
    if (sourceCandidates.length === 0) {
      const update = {
        status: "rejected_no_official_source",
        rejectReason: "No configured official source is mapped for this trend.",
        officialConfirmationRequired: true
      };
      signalUpdates.set(signal.topicKey, update);
      rejected.push({ topicKey: signal.topicKey, title: signal.title, status: update.status, reason: update.rejectReason });
      if (!options.dryRun) await putTrendProcessStatus(state, signal, update);
      continue;
    }

    let best = null;
    let scannedWithoutError = false;
    for (const officialSource of sourceCandidates) {
      checked++;
      const result = await scanSource(officialSource, env);
      if (!result.error && (result.items || []).length > 0) scannedWithoutError = true;
      for (const item of result.items || []) {
        const score = officialTrendMatchScore(signal, item, officialSource);
        if (!best || score > best.score) best = { source: officialSource, item, score };
      }
    }

    const shouldPreposition = scannedWithoutError
      && signal.score >= Number(env.MIN_PREPOSITION_SCORE || DEFAULT_MIN_PREPOSITION_SCORE)
      && (!best || best.score < minConfirmScore || (signal.preReleaseLanguage && best.item?.stage !== signal.stage));

    if (!best || best.score < minConfirmScore || shouldPreposition) {
      if (scannedWithoutError && signal.score >= Number(env.MIN_PREPOSITION_SCORE || DEFAULT_MIN_PREPOSITION_SCORE)) {
        const detection = prepositionDetectionFromTrend(signal, sourceCandidates[0], best?.score || 0, now);
        const update = {
          status: "preposition_ready",
          rejectReason: null,
          officialConfirmationRequired: true,
          prepositionSourceId: sourceCandidates[0].id,
          prepositionOfficialUrl: sourceCandidates[0].homepage || sourceCandidates[0].url,
          prepositionFingerprint: detection.fingerprint,
          bestOfficialMatchScore: best?.score || 0
        };
        signalUpdates.set(signal.topicKey, update);
        prepositions.push({
          topicKey: signal.topicKey,
          title: signal.title,
          sourceId: sourceCandidates[0].id,
          officialUrl: detection.url,
          score: signal.score,
          bestOfficialMatchScore: best?.score || 0
        });
        detections.push(detection);
        if (!options.dryRun) await putTrendProcessStatus(state, signal, update);
        continue;
      }

      const update = {
        status: "rejected_no_official_match",
        rejectReason: `Official source scanned but no matching live item reached score ${minConfirmScore}.`,
        officialConfirmationRequired: true,
        bestOfficialMatchScore: best?.score || 0
      };
      signalUpdates.set(signal.topicKey, update);
      rejected.push({ topicKey: signal.topicKey, title: signal.title, status: update.status, reason: update.rejectReason, bestScore: best?.score || 0 });
      if (!options.dryRun) await putTrendProcessStatus(state, signal, update);
      continue;
    }

    const detection = officialDetectionFromTrend(signal, best.source, best.item, best.score, now);
    const update = {
      status: "official_confirmed",
      rejectReason: null,
      officialConfirmationRequired: false,
      confirmedSourceId: best.source.id,
      confirmedOfficialUrl: best.item.url,
      confirmedTitle: best.item.title,
      officialMatchScore: best.score,
      detectionFingerprint: detection.fingerprint
    };
    signalUpdates.set(signal.topicKey, update);
    detections.push(detection);
    confirmed.push({
      topicKey: signal.topicKey,
      title: signal.title,
      sourceId: best.source.id,
      officialTitle: best.item.title,
      officialUrl: best.item.url,
      score: best.score
    });
    if (!options.dryRun) await putTrendProcessStatus(state, signal, update);
  }

  return { signalUpdates, detections, confirmed, rejected, prepositions, checked, dispatchedCount: 0 };
}

function officialSourcesForTrend(signal) {
  const suggestions = signal.suggestedOfficialSources || [];
  const aliases = {
    "bpsc-official": "bpsc"
  };
  const seen = new Set();
  const sources = [];
  for (const suggestion of suggestions) {
    const id = aliases[suggestion.id] || suggestion.id;
    const source = config.sources.find(item => item.id === id);
    if (!source || seen.has(source.id) || source.strategy === "google_trends_rss") continue;
    seen.add(source.id);
    sources.push(source);
  }
  return sources.slice(0, 3);
}

function officialTrendMatchScore(signal, item, source) {
  const signalText = trendSignalSearchText(signal);
  const officialText = normalizeSearchText(`${item.title} ${item.url} ${source.name}`);
  let score = 0;
  if (item.stage && signal.stage && item.stage === signal.stage) score += 34;
  if (signal.stage === "other" && item.stage !== "other") score += 12;

  const signalYear = signalText.match(/\b(20\d{2})\b/)?.[1] || signal.date?.slice(0, 4);
  const officialYear = officialText.match(/\b(20\d{2})\b/)?.[1] || item.date?.slice(0, 4);
  if (signalYear && officialYear && signalYear === officialYear) score += 18;
  if (signal.matchedOrgs?.some(org => officialText.includes(normalizeSearchText(org)))) score += 16;
  if (source.id && signal.suggestedOfficialSources?.some(candidate => candidate.id === source.id)) score += 10;

  const tokens = importantTrendTokens(signalText);
  const overlap = tokens.filter(token => officialText.includes(token));
  score += Math.min(32, overlap.length * 8);
  if (/\.pdf(\?|#|$)/i.test(item.url || "")) score += 4;
  return Math.min(100, score);
}

function importantTrendTokens(text) {
  const skip = new Set(["2025", "2026", "2027", "india", "official", "online", "pdf", "out", "released", "check", "download"]);
  return [...new Set(normalizeSearchText(text).split(" "))]
    .filter(token => token.length >= 3 && !skip.has(token))
    .slice(0, 12);
}

function trendSignalSearchText(signal) {
  return normalizeSearchText([
    signal.title,
    signal.stage,
    ...(signal.matchedOrgs || []),
    ...(signal.matchedKeywords || []),
    ...(signal.evidence || []).map(item => `${item.title} ${item.source} ${item.url}`)
  ].join(" "));
}

function officialDetectionFromTrend(signal, source, item, score, now) {
  const fingerprint = sha256HexSync(`trend-confirmed|${signal.topicKey}|${item.fingerprint}`);
  return {
    ...item,
    sourceId: source.id,
    sourceName: source.name,
    strategy: "trend_official_confirmation",
    detectedAt: now,
    trendTopicKey: signal.topicKey,
    trendTitle: signal.title,
    trendScore: signal.score,
    officialMatchScore: score,
    confidence: Math.min(0.98, Math.max(Number(item.confidence || 0), 0.82, score / 100)),
    fingerprint
  };
}

function prepositionDetectionFromTrend(signal, source, bestOfficialMatchScore, now) {
  const sourceUrl = source.homepage || source.url;
  const fingerprint = sha256HexSync(`trend-preposition|${signal.topicKey}|${source.id}`);
  return {
    id: `preposition:${signal.topicKey}`,
    title: `${humanTrendTopic(signal)} status tracker`,
    url: sourceUrl,
    canonicalUrl: canonicalizeUrl(sourceUrl),
    date: signal.date || now,
    type: "preposition",
    stage: signal.stage && signal.stage !== "other" ? signal.stage : "notification",
    canonicalId: `preposition:${signal.topicKey}`,
    fingerprintSchemaVersion: FINGERPRINT_SCHEMA_VERSION,
    confidence: Math.min(0.95, Math.max(0.82, signal.score / 100)),
    fingerprint,
    sourceId: source.id,
    sourceName: source.name,
    strategy: "trend_preposition",
    detectedAt: now,
    trendTopicKey: signal.topicKey,
    trendTitle: signal.title,
    trendScore: signal.score,
    trendTraffic: signal.traffic,
    matchedOrgs: signal.matchedOrgs || [],
    matchedKeywords: signal.matchedKeywords || [],
    evidence: signal.evidence || [],
    officialSourceId: source.id,
    officialSourceName: source.name,
    officialSourceUrl: sourceUrl,
    officialConfirmationRequired: true,
    bestOfficialMatchScore,
    safeContentMode: "preposition_only"
  };
}

function humanTrendTopic(signal) {
  const parts = String(signal.topicKey || signal.title || "")
    .split(":")
    .filter(Boolean)
    .slice(0, 3)
    .map(part => part.replace(/-/g, " "));
  return titleCase(parts.join(" ") || signal.title || "Exam update");
}

function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

async function putTrendProcessStatus(state, signal, update) {
  await putProcessStatus(state, `trend:${signal.fingerprint}`, {
    status: update.status,
    topicKey: signal.topicKey,
    title: signal.title,
    rejectReason: update.rejectReason || null,
    officialConfirmationRequired: update.officialConfirmationRequired,
    confirmedSourceId: update.confirmedSourceId || null,
    confirmedOfficialUrl: update.confirmedOfficialUrl || null,
    confirmedTitle: update.confirmedTitle || null,
    officialMatchScore: update.officialMatchScore || update.bestOfficialMatchScore || 0,
    detectionFingerprint: update.detectionFingerprint || null,
    prepositionSourceId: update.prepositionSourceId || null,
    prepositionOfficialUrl: update.prepositionOfficialUrl || null,
    prepositionFingerprint: update.prepositionFingerprint || null,
    updatedAt: new Date().toISOString()
  });
}

function scoreTrendSignal(source, item) {
  const text = normalizeSearchText([
    item.title,
    item.url,
    ...(item.news || []).map(news => `${news.title} ${news.source} ${news.url}`)
  ].join(" "));
  if (!text || TREND_SIGNAL_SKIP.test(text)) return null;

  const matchedKeywords = matchDictionary(text, TREND_SIGNAL_KEYWORDS);
  const matchedOrgs = matchDictionary(text, TREND_SIGNAL_ORGS);
  if (matchedKeywords.length === 0 && matchedOrgs.length === 0) return null;

  const traffic = parseTrendTraffic(item.traffic);
  const trafficScore = traffic >= 10000 ? 30 : traffic >= 1000 ? 22 : traffic >= 500 ? 15 : 8;
  const keywordScore = Math.min(25, matchedKeywords.length * 6);
  const orgScore = Math.min(25, matchedOrgs.length * 8);
  const freshness = freshnessScore(item.date);
  const score = 10 + trafficScore + keywordScore + orgScore + Math.min(20, freshness);

  return {
    sourceId: source.id,
    sourceName: source.name,
    title: item.title,
    topicKey: canonicalTrendTopicKey(item, matchedOrgs, text),
    traffic: item.traffic,
    trafficApprox: traffic,
    date: item.date,
    matchedKeywords,
    matchedOrgs,
    stage: classifyStage(text),
    score,
    status: PRE_RELEASE_PATTERN.test(text) ? "official_pending" : "official_check_required",
    preReleaseLanguage: PRE_RELEASE_PATTERN.test(text),
    suggestedOfficialSources: suggestedOfficialSources(matchedOrgs, text),
    officialConfirmationRequired: true,
    evidence: (item.news || []).slice(0, 5),
    fingerprint: item.fingerprint
  };
}

async function persistTrendWatchlist(env, signals, now) {
  const state = getStateBinding(env);
  const updates = [];
  const index = await readWatchIndex(state);

  for (const signal of signals) {
    const key = signal.topicKey;
    const storageKey = `${WATCH_PREFIX}${key}`;
    const previousRaw = await state.get(storageKey);
    const previous = previousRaw ? JSON.parse(previousRaw) : null;
    const seenFingerprints = [...new Set([...(previous?.seenFingerprints || []), signal.fingerprint])].slice(-20);
    const evidence = mergeEvidence(previous?.evidence || [], signal.evidence || []);
    const hasCurrentConfirmation = signal.officialConfirmationRequired === false;
    const hasPreviousConfirmation = previous?.officialConfirmationRequired === false;
    const keepPreviousConfirmation = hasPreviousConfirmation && !hasCurrentConfirmation;
    const watch = {
      topicKey: key,
      status: keepPreviousConfirmation ? previous.status : signal.status,
      title: signal.title,
      stage: signal.stage,
      matchedOrgs: signal.matchedOrgs,
      matchedKeywords: signal.matchedKeywords,
      suggestedOfficialSources: signal.suggestedOfficialSources,
      officialConfirmationRequired: keepPreviousConfirmation ? false : signal.officialConfirmationRequired !== false,
      rejectReason: keepPreviousConfirmation ? previous.rejectReason || null : signal.rejectReason || null,
      confirmedSourceId: signal.confirmedSourceId || previous?.confirmedSourceId || null,
      confirmedOfficialUrl: signal.confirmedOfficialUrl || previous?.confirmedOfficialUrl || null,
      confirmedTitle: signal.confirmedTitle || previous?.confirmedTitle || null,
      officialMatchScore: signal.officialMatchScore || signal.bestOfficialMatchScore || previous?.officialMatchScore || 0,
      detectionFingerprint: signal.detectionFingerprint || previous?.detectionFingerprint || null,
      prepositionSourceId: signal.prepositionSourceId || previous?.prepositionSourceId || null,
      prepositionOfficialUrl: signal.prepositionOfficialUrl || previous?.prepositionOfficialUrl || null,
      prepositionFingerprint: signal.prepositionFingerprint || previous?.prepositionFingerprint || null,
      firstSeenAt: previous?.firstSeenAt || now,
      lastSeenAt: now,
      seenCount: Number(previous?.seenCount || 0) + 1,
      highestScore: Math.max(Number(previous?.highestScore || 0), signal.score),
      latestTraffic: signal.traffic,
      preReleaseLanguage: Boolean(previous?.preReleaseLanguage || signal.preReleaseLanguage),
      seenFingerprints,
      evidence
    };

    await state.put(storageKey, JSON.stringify(watch));
    updates.push({ topicKey: key, status: previous ? "updated" : "created", watchStatus: watch.status });
    if (!index.includes(key)) index.unshift(key);
  }

  await state.put(WATCH_INDEX_KEY, JSON.stringify(index.slice(0, MAX_WATCH_TOPICS)));
  return updates;
}

async function readWatchlist(env) {
  const state = getStateBinding(env);
  const index = await readWatchIndex(state);
  const items = [];
  for (const key of index.slice(0, MAX_WATCH_TOPICS)) {
    const raw = await state.get(`${WATCH_PREFIX}${key}`);
    if (raw) items.push(JSON.parse(raw));
  }
  return items.sort((a, b) => String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")));
}

async function readWatchIndex(state) {
  const raw = await state.get(WATCH_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

function mergeEvidence(previous, current) {
  const byUrl = new Map();
  for (const item of [...previous, ...current]) {
    const key = item.url || item.title;
    if (!key || byUrl.has(key)) continue;
    byUrl.set(key, item);
  }
  return [...byUrl.values()].slice(0, 8);
}

function scoreOpportunity(source, item) {
  const text = `${item.title} ${item.url}`.toLowerCase();
  if (OPPORTUNITY_SKIP.test(text)) return null;

  const category = classifyOpportunity(text);
  if (!category) return null;

  const freshness = freshnessScore(item.date);
  const sourceWeight = source.id === "pib" ? 35
    : source.id.startsWith("rbi") ? 25
    : source.tier === 1 ? 30
    : 15;
  const actionability = /\b(apply|registration|deadline|last date|portal|download|result|admit|beneficiary|subsidy|guidelines)\b|आवेदन|पंजीकरण|अंतिम तिथि|पोर्टल|डाउनलोड/i.test(text) ? 25 : 10;
  const specificity = extractOpportunityTerms(text).length >= 2 ? 15 : 5;
  const score = sourceWeight + freshness + actionability + specificity;
  const terms = extractOpportunityTerms(text);
  if (terms.length === 0) return null;

  return {
    sourceId: source.id,
    sourceName: source.name,
    title: item.title,
    url: item.url,
    date: item.date,
    category,
    terms,
    score,
    fingerprint: item.fingerprint
  };
}

function classifyOpportunity(text) {
  for (const [category, pattern] of OPPORTUNITY_CATEGORIES) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function canonicalTrendTopicKey(item, matchedOrgs, text) {
  const stage = classifyStage(text);
  const year = String(text).match(/\b(20\d{2})\b/)?.[1] || item.date?.slice(0, 4) || "current";
  const org = primaryTrendOrg(matchedOrgs, text);
  const subject = trendSubject(text);
  return [org || subject || normalizeTitleForId(item.title), subject && org ? subject : null, stage, year]
    .filter(Boolean)
    .join(":")
    .replace(/:+/g, ":")
    .slice(0, 180);
}

function primaryTrendOrg(matchedOrgs, text) {
  const value = normalizeSearchText(text);
  if (value.includes("bihar police") || value.includes("bihar constable")) return "csbc";
  if (matchedOrgs.includes("csbc")) return "csbc";
  if (value.includes("mht cet")) return "mht-cet";
  if (value.includes("ugc net")) return "ugc-net";
  if (value.includes("ap eamcet")) return "ap-eamcet";
  if (value.includes("ts eamcet")) return "ts-eamcet";
  return normalizeTitleForId(matchedOrgs[0] || "");
}

function trendSubject(text) {
  const value = normalizeSearchText(text);
  const subjects = [
    ["bihar-police-constable", /\bbihar police\b.*\bconstable\b|\bconstable\b.*\bbihar police\b|\bcsbc\b.*\bconstable\b/i],
    ["bihar-daroga", /\bbihar daroga\b|\bsub inspector\b.*\bbihar\b|\bsi\b.*\bbihar\b/i],
    ["ctet", /\bctet\b/i],
    ["ugc-net", /\bugc net\b/i],
    ["neet", /\bneet\b/i],
    ["jee", /\bjee\b/i],
    ["cuet", /\bcuet\b/i],
    ["kcet", /\bkcet\b|\bkea\b.*\bcet\b/i],
    ["mht-cet", /\bmht cet\b/i],
    ["rrb-recruitment", /\brrb\b.*\b(recruitment|vacancy|cen)\b/i],
    ["ssc-cgl", /\bssc cgl\b/i],
    ["ssc-chsl", /\bssc chsl\b/i],
    ["ssc-mts", /\bssc mts\b/i],
    ["ibps-po", /\bibps po\b/i],
    ["ibps-clerk", /\bibps clerk\b/i]
  ];
  return subjects.find(([, pattern]) => pattern.test(value))?.[0] || null;
}

function suggestedOfficialSources(matchedOrgs, text) {
  const value = normalizeSearchText(text);
  const matches = [];
  for (const source of TREND_OFFICIAL_SOURCES) {
    const matched = source.terms.some(term => value.includes(normalizeSearchText(term)))
      || source.terms.some(term => matchedOrgs.includes(term));
    if (matched) matches.push(source);
  }
  return matches.slice(0, 5);
}

function freshnessScore(date) {
  if (!date) return 10;
  const ageDays = Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 86400000));
  if (ageDays <= 1) return 30;
  if (ageDays <= 7) return 22;
  if (ageDays <= 30) return 12;
  return 4;
}

function extractOpportunityTerms(text) {
  const normalized = String(text || "").toLowerCase();
  const dictionary = [
    ["apaar", /\bapaar\b|अपार/i],
    ["pm surya", /\bpm[- ]?surya|surya ghar|सूर्य घर|सौर/i],
    ["abha", /\babha\b|health locker|आभा|स्वास्थ्य/i],
    ["my bharat", /\bmy bharat\b|युवा|nyps/i],
    ["ayushman", /\bayushman\b|आयुष्मान/i],
    ["ujjwala", /\bujjwala\b|उज्ज्वला/i],
    ["pm kisan", /\bpm[- ]?kisan\b|किसान/i],
    ["mudra", /\bmudra\b|मुद्रा/i],
    ["pm awas", /\bpmay\b|pm awas|आवास/i],
    ["scholarship", /\bscholarship\b|छात्रवृत्ति/i],
    ["pension", /\bpension\b|पेंशन/i],
    ["ration", /\bration\b|राशन/i],
    ["aadhaar", /\baadhaar\b|आधार/i],
    ["pan", /\bpan\b|पैन/i],
    ["epfo", /\bepfo\b|ईपीएफ/i],
    ["upi", /\bupi\b|यूपीआई/i],
    ["rbi", /\brbi\b|reserve bank/i],
    ["solar", /\bsolar\b|सौर/i],
    ["dbt", /\bdbt\b|direct benefit|डीबीटी/i],
    ["portal", /\bportal\b|पोर्टल/i],
    ["registration", /\bregistration\b|पंजीकरण/i]
  ];
  return dictionary.filter(([, pattern]) => pattern.test(normalized)).map(([term]) => term).slice(0, 8);
}

function clusterOpportunities(items) {
  const clusters = new Map();
  for (const item of items) {
    const key = item.terms[0] || normalizeTitleForId(item.title).split("-").slice(0, 4).join("-");
    if (!clusters.has(key)) {
      clusters.set(key, {
        key,
        category: item.category,
        score: 0,
        sources: [],
        terms: [],
        items: []
      });
    }
    const cluster = clusters.get(key);
    cluster.items.push(item);
    cluster.sources = [...new Set([...cluster.sources, item.sourceId])];
    cluster.terms = [...new Set([...cluster.terms, ...item.terms])].slice(0, 10);
    cluster.score = Math.max(cluster.score, item.score) + Math.min(20, cluster.sources.length * 5);
  }
  return [...clusters.values()];
}

function buildOpportunityRecord(cluster, now) {
  const best = [...cluster.items].sort((a, b) => b.score - a.score)[0];
  const text = normalizeSearchText(`${cluster.key} ${cluster.terms.join(" ")} ${cluster.items.map(item => item.title).join(" ")}`);
  const existingPageMatch = findExistingPageMatch(text);
  const officialConfidence = officialConfidenceForCluster(cluster);
  const freshness = Math.max(...cluster.items.map(item => freshnessScore(item.date)));
  const searchIntent = Math.max(...cluster.items.map(item => actionabilityScore(`${item.title} ${item.url}`)));
  const competitionScore = lowCompetitionScore(text);
  const existingPageScore = existingPageMatch ? 12 : 0;
  const sourceDiversity = Math.min(12, cluster.sources.length * 6);
  const score = Math.min(100, Math.round(
    officialConfidence + freshness * 0.55 + searchIntent + competitionScore + existingPageScore + sourceDiversity
  ));
  const decision = opportunityDecision({ score, existingPageMatch, officialConfidence, cluster });
  const key = canonicalOpportunityKey(cluster, best);

  return {
    key,
    fingerprint: `opp:${sha256HexSync(key)}`,
    sourceId: best.sourceId,
    sourceName: best.sourceName,
    title: best.title,
    url: best.url,
    date: best.date,
    type: best.category,
    category: cluster.category,
    terms: cluster.terms,
    sources: cluster.sources,
    score,
    scoreBreakdown: {
      officialConfidence,
      freshness,
      searchIntent,
      competitionScore,
      existingPageScore,
      sourceDiversity
    },
    decision: decision.decision,
    status: decision.status,
    reason: decision.reason,
    existingPageMatch,
    contentAction: decision.contentAction,
    detectedAt: now,
    queuedAt: now,
    updatedAt: now,
    evidence: cluster.items.slice(0, 8).map(item => ({
      title: item.title,
      url: item.url,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      date: item.date,
      score: item.score,
      fingerprint: item.fingerprint
    })),
    officialConfirmationRequired: false,
    dispatchEligible: decision.status === "publish_now" || decision.status === "update_ready"
  };
}

function canonicalOpportunityKey(cluster, best) {
  const term = normalizeTitleForId(cluster.key || cluster.terms[0] || "opportunity");
  const category = normalizeTitleForId(cluster.category || "general");
  const source = normalizeTitleForId(best.sourceId || "official");
  const stage = classifyStage(`${best.title} ${best.url}`);
  const date = normalizeDate(best.date) || "current";
  return [category, term, stage, source, date].filter(Boolean).join(":").slice(0, 180);
}

function officialConfidenceForCluster(cluster) {
  const sourceScores = cluster.sources.map(sourceId => {
    if (sourceId === "pib") return 34;
    if (sourceId === "rbi-notifications") return 28;
    if (sourceId === "ssc" || sourceId === "nta" || sourceId === "upsc") return 30;
    return 22;
  });
  return Math.max(...sourceScores, 20);
}

function actionabilityScore(text) {
  const value = normalizeSearchText(text);
  let score = 8;
  if (/\b(apply|registration|deadline|last date|portal|download|status|beneficiary|subsidy|guidelines|launched|extended)\b/i.test(value)) score += 14;
  if (/\b(result|admit card|answer key|exam date|vacancy|recruitment)\b/i.test(value)) score += 12;
  if (/\b(how to|check|create|link|download|fix|not showing)\b/i.test(value)) score += 8;
  return Math.min(28, score);
}

function lowCompetitionScore(text) {
  const value = normalizeSearchText(text);
  const matches = LOW_COMPETITION_TOPICS.filter(topic => value.includes(normalizeSearchText(topic))).length;
  if (matches >= 2) return 16;
  if (matches === 1) return 12;
  return 4;
}

function findExistingPageMatch(text) {
  const value = normalizeSearchText(text);
  for (const target of EXISTING_PAGE_TARGETS) {
    if (target.terms.some(term => value.includes(normalizeSearchText(term)))) {
      return {
        slug: target.slug,
        action: target.action,
        matchedTerms: target.terms.filter(term => value.includes(normalizeSearchText(term)))
      };
    }
  }
  return null;
}

function opportunityDecision({ score, existingPageMatch, officialConfidence, cluster }) {
  const minScore = DEFAULT_MIN_OPPORTUNITY_SCORE;
  if (existingPageMatch && score >= 70) {
    return {
      decision: "update_existing",
      status: "update_ready",
      contentAction: "update_existing",
      reason: `Existing page ${existingPageMatch.slug} should be refreshed with the official update.`
    };
  }
  if (score >= minScore && officialConfidence >= 30) {
    return {
      decision: "publish_now",
      status: "publish_now",
      contentAction: cluster.category === "exam-jobs" ? "create_update" : "create_guide_or_update",
      reason: `Score ${score} >= ${minScore} with strong official source confidence.`
    };
  }
  if (score >= 65) {
    return {
      decision: "needs_review",
      status: "needs_review",
      contentAction: "review",
      reason: `Score ${score} is promising but below auto-publish threshold or needs editorial routing.`
    };
  }
  return {
    decision: "watch",
    status: "watch",
    contentAction: "watch",
    reason: `Score ${score} below review threshold.`
  };
}

async function persistOpportunityQueue(env, opportunities, now) {
  const state = getStateBinding(env);
  const updates = [];
  const index = await readOpportunityIndex(state);

  for (const opportunity of opportunities) {
    const storageKey = `${OPPORTUNITY_PREFIX}${opportunity.key}`;
    const previousRaw = await state.get(storageKey);
    const previous = previousRaw ? JSON.parse(previousRaw) : null;
    const seenFingerprints = [...new Set([
      ...(previous?.seenFingerprints || []),
      ...opportunity.evidence.map(item => item.fingerprint).filter(Boolean)
    ])].slice(-30);
    const merged = {
      ...previous,
      ...opportunity,
      status: previous?.status && ["dispatched", "generated", "updated", "update_skipped", "rejected"].includes(previous.status)
        ? previous.status
        : opportunity.status,
      firstSeenAt: previous?.firstSeenAt || now,
      lastSeenAt: now,
      seenCount: Number(previous?.seenCount || 0) + 1,
      highestScore: Math.max(Number(previous?.highestScore || 0), opportunity.score),
      seenFingerprints,
      evidence: mergeEvidence(previous?.evidence || [], opportunity.evidence || [])
    };
    await state.put(storageKey, JSON.stringify(merged));
    if (!index.includes(opportunity.key)) index.unshift(opportunity.key);
    updates.push({ key: opportunity.key, status: previous ? "updated" : "created", queueStatus: merged.status, score: merged.score });
  }

  await state.put(OPPORTUNITY_INDEX_KEY, JSON.stringify(index.slice(0, MAX_OPPORTUNITIES)));
  await state.put(OPPORTUNITY_RUN_KEY, JSON.stringify({ scannedAt: now, count: opportunities.length, summary: summarizeOpportunities(opportunities) }));
  return updates;
}

async function claimOpportunitiesForGeneration(env, opportunities) {
  const state = getStateBinding(env);
  const claimed = [];

  for (const opportunity of opportunities) {
    if (!opportunity.dispatchEligible) continue;
    const storageKey = `${OPPORTUNITY_PREFIX}${opportunity.key}`;
    const raw = await state.get(storageKey);
    const current = raw ? JSON.parse(raw) : opportunity;
    if (["dispatched", "generated", "updated", "update_skipped", "rejected"].includes(current.status)) continue;

    const detection = opportunityToDetection(current);
    const existingProcess = await state.get(`${PROCESS_PREFIX}${detection.fingerprint}`);
    if (existingProcess) continue;

    await putProcessStatus(state, detection.fingerprint, {
      status: "queued",
      detection,
      opportunityKey: current.key,
      score: current.score,
      decision: current.decision,
      queuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await state.put(storageKey, JSON.stringify({
      ...current,
      status: "dispatched",
      dispatchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    claimed.push(detection);
  }

  return claimed;
}

function opportunityToDetection(opportunity) {
  return {
    id: opportunity.key,
    title: opportunity.title,
    url: opportunity.url,
    canonicalUrl: canonicalizeUrl(opportunity.url),
    date: opportunity.date,
    type: "opportunity",
    stage: classifyStage(`${opportunity.title} ${opportunity.url}`),
    sourceId: opportunity.sourceId,
    sourceName: opportunity.sourceName,
    strategy: "opportunity_queue",
    detectedAt: opportunity.detectedAt,
    category: opportunity.category,
    terms: opportunity.terms,
    score: opportunity.score,
    decision: opportunity.decision,
    existingPageMatch: opportunity.existingPageMatch,
    evidence: opportunity.evidence,
    confidence: Math.min(0.98, Number((0.65 + opportunity.score / 300).toFixed(2))),
    fingerprint: opportunity.fingerprint
  };
}

async function readOpportunityQueue(env, { status } = {}) {
  const state = getStateBinding(env);
  const index = await readOpportunityIndex(state);
  const items = [];
  for (const key of index.slice(0, MAX_OPPORTUNITIES)) {
    const raw = await state.get(`${OPPORTUNITY_PREFIX}${key}`);
    if (!raw) continue;
    const item = JSON.parse(raw);
    if (status && item.status !== status) continue;
    items.push(item);
  }
  return items.sort((a, b) => {
    const scoreDiff = Number(b.highestScore || b.score || 0) - Number(a.highestScore || a.score || 0);
    if (scoreDiff) return scoreDiff;
    return String(b.lastSeenAt || b.updatedAt || "").localeCompare(String(a.lastSeenAt || a.updatedAt || ""));
  });
}

async function readOpportunityIndex(state) {
  const raw = await state.get(OPPORTUNITY_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function markOpportunityStatuses(env, keys, status, details = {}) {
  const state = getStateBinding(env);
  for (const key of keys.slice(0, 100)) {
    const raw = await state.get(`${OPPORTUNITY_PREFIX}${key}`);
    if (!raw) continue;
    const previous = JSON.parse(raw);
    await state.put(`${OPPORTUNITY_PREFIX}${key}`, JSON.stringify({
      ...previous,
      ...details,
      status,
      updatedAt: new Date().toISOString()
    }));
  }
}

function summarizeOpportunities(opportunities) {
  const summary = {
    total: opportunities.length,
    publishNow: 0,
    updateReady: 0,
    needsReview: 0,
    updateExisting: 0,
    watch: 0,
    rejected: 0,
    top: []
  };
  for (const item of opportunities) {
    if (item.status === "publish_now") summary.publishNow++;
    else if (item.status === "update_ready") summary.updateReady++;
    else if (item.status === "needs_review") summary.needsReview++;
    else if (item.status === "watch") summary.watch++;
    else if (item.status === "rejected") summary.rejected++;
    if (item.decision === "update_existing") summary.updateExisting++;
  }
  summary.top = [...opportunities]
    .sort((a, b) => Number(b.highestScore || b.score || 0) - Number(a.highestScore || a.score || 0))
    .slice(0, 8)
    .map(item => ({
      key: item.key,
      title: item.title,
      score: item.highestScore || item.score,
      status: item.status,
      decision: item.decision,
      existingPage: item.existingPageMatch?.slug || null
    }));
  return summary;
}

async function maybeSendOpportunitySummaryEmail(env, opportunities, updates, now) {
  if (env.OPPORTUNITY_SUMMARY_EMAIL !== "1") {
    return { skipped: true, reason: "OPPORTUNITY_SUMMARY_EMAIL is not enabled" };
  }
  if (!updates.length) {
    return { skipped: true, reason: "no queue updates" };
  }
  const summary = summarizeOpportunities(opportunities);
  if (summary.publishNow === 0 && summary.updateReady === 0 && summary.needsReview === 0) {
    return { skipped: true, reason: "no publish/review opportunities" };
  }

  const state = getStateBinding(env);
  const day = now.slice(0, 10);
  const digestKey = `opportunity:summary-email:${day}`;
  const alreadySent = await state.get(digestKey);
  if (alreadySent) {
    return { skipped: true, reason: "daily opportunity summary already sent", day };
  }

  const result = await sendOpportunitySummaryEmail(env, summary);
  if (result.ok || result.skipped) {
    await state.put(digestKey, JSON.stringify({ sentAt: now, result }), { expirationTtl: 172800 });
  }
  return result;
}

async function sendOpportunitySummaryEmail(env, summary) {
  const to = env.PAGE_CREATED_EMAIL_TO || "admin@citizennest.com";
  const from = env.PAGE_CREATED_EMAIL_FROM || "monitor@citizennest.com";
  const subject = `CitizenNest opportunity queue: ${summary.publishNow} publish, ${summary.updateReady} update, ${summary.needsReview} review`;
  const top = summary.top.slice(0, 8);
  const text = [
    "CitizenNest Opportunity Queue summary:",
    "",
    `Publish now: ${summary.publishNow}`,
    `Update ready: ${summary.updateReady}`,
    `Needs review: ${summary.needsReview}`,
    `Update existing: ${summary.updateExisting}`,
    `Watch: ${summary.watch}`,
    "",
    ...top.map(item => `- [${item.status}] ${item.score} ${item.title} ${item.existingPage ? `(existing: ${item.existingPage})` : ""}`),
    "",
    "Queue endpoint: https://citizennest-detection.citizennest.workers.dev/opportunities/queue"
  ].join("\n");

  if (!env.EMAIL?.send) {
    return { ok: false, skipped: true, reason: "EMAIL binding is not configured", to, from, summary };
  }

  await env.EMAIL.send({
    to,
    from: { email: from, name: "CitizenNest Monitor" },
    subject,
    text,
    html: `<p>CitizenNest Opportunity Queue summary:</p>
      <ul>
        <li>Publish now: ${summary.publishNow}</li>
        <li>Update ready: ${summary.updateReady}</li>
        <li>Needs review: ${summary.needsReview}</li>
        <li>Update existing: ${summary.updateExisting}</li>
        <li>Watch: ${summary.watch}</li>
      </ul>
      <ol>${top.map(item => `<li><strong>${escapeHtml(String(item.score))}</strong> ${escapeHtml(item.title || item.key)} ${item.existingPage ? `(existing: ${escapeHtml(item.existingPage)})` : ""}</li>`).join("")}</ol>
      <p>Queue endpoint: <code>/opportunities/queue</code></p>`
  });

  return { ok: true, emailed: true, to, from, summary };
}

async function scanSource(source, env) {
  if (usesUrlFallbacks(source)) {
    return scanSourceWithUrlFallbacks(source, env);
  }

  try {
    if (source.strategy === "ssc_api") return { items: await scanSscApi(source, env) };
    if (source.strategy === "nta_notice_pdf") return { items: await scanNta(source, env) };
    if (source.strategy === "rss") return { items: await scanRss(source, env) };
    if (source.strategy === "google_trends_rss") return { items: await scanGoogleTrendsRss(source, env) };
    return await scanOfficialLinks(source, env);
  } catch (error) {
    return { items: [], error: error.message || String(error) };
  }
}

async function scanSourceWithUrlFallbacks(source, env) {
  const errors = [];
  for (const url of getSourceUrls(source)) {
    const scopedSource = { ...source, url };
    try {
      const result = normalizeScanResult(await scanFallbackSource(scopedSource, env));
      if (result.items.length > 0) return { ...result, urlUsed: url };
      errors.push(`${url}: no actionable items`);
    } catch (error) {
      errors.push(`${url}: ${error.message || String(error)}`);
    }
  }
  return { items: [], error: errors.join(" | ") || "no source URLs configured" };
}

async function scanFallbackSource(source, env) {
  if (source.strategy === "upsc_whats_new") return scanUpscWhatsNew(source, env);
  if (source.strategy === "kea_announcements") return scanKeaAnnouncements(source, env);
  if (source.strategy === "cbse_results") return scanCbseResults(source, env);
  return scanOfficialLinks(source, env);
}

function normalizeScanResult(result) {
  if (Array.isArray(result)) return { items: result };
  return { items: result?.items || [], ...result };
}

function usesUrlFallbacks(source) {
  return Array.isArray(source.fallbackUrls) && source.fallbackUrls.length > 0
    || ["upsc_whats_new", "kea_announcements", "cbse_results"].includes(source.strategy);
}

function getSourceUrls(source) {
  return [...new Set([source.url, ...(source.fallbackUrls || [])].filter(Boolean))];
}

async function scanSscApi(source, env) {
  const data = await fetchJson(source.url, env);
  const notices = Array.isArray(data?.data) ? data.data : [];
  return notices.map(notice => {
    const attachment = notice.attachments?.[0]?.path;
    const url = attachment
      ? `https://ssc.gov.in/api/attachment/${String(attachment).replace(/\\/g, "/")}`
      : source.homepage;
    return makeItem(source, {
      id: notice.id,
      title: decodeHtml(notice.headline || "SSC notice"),
      url,
      date: notice.createdAt || notice.startDate || null,
      type: "notice"
    });
  }).filter(item => item && isSourceFilterMatch(source, item.title, item.url));
}

async function scanNta(source, env) {
  const html = await fetchText(source.url, env, { maxChars: 350_000 });
  const items = [];
  const seen = new Set();
  const noticeHref = /href=["']([^"']*Download\/Notice\/Notice_(\d{14})\.pdf)["']/gi;
  let match;

  while ((match = noticeHref.exec(html)) !== null && items.length < 30) {
    const url = absolutize(match[1], source.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const title = ntaNoticeTitleFromContext(html, match.index, match[2]);
    items.push(makeItem(source, {
      id: match[2],
      title: title || `NTA notice ${match[2]}`,
      url,
      date: timestampDate(match[2]),
      type: "pdf"
    }));
  }

  return items.filter(Boolean).sort(sortByDateDesc).slice(0, 30);
}

function ntaNoticeTitleFromContext(html, hrefIndex, id) {
  const start = Math.max(0, hrefIndex - 1200);
  const end = Math.min(html.length, hrefIndex + 500);
  const context = html.slice(start, end)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const candidates = [
    context.match(/<td[^>]*>([\s\S]{8,420}?)<\/td>\s*<td[^>]*>[\s\S]{0,300}?href=["'][^"']*Notice_/i)?.[1],
    context.match(/<p[^>]*>([\s\S]{8,420}?)<\/p>/i)?.[1],
    context.match(/<span[^>]*>([\s\S]{8,420}?)<\/span>/i)?.[1]
  ].map(value => cleanText(value || ""))
    .filter(value => value && !/^download$/i.test(value) && !/^view$/i.test(value));
  return candidates[0] || `NTA notice ${id}`;
}

async function scanRss(source, env) {
  const xml = await fetchText(source.url, env);
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = stripCdata(extractTag(block, "title"));
    const link = decodeHtml(stripCdata(extractTag(block, "link")));
    const date = stripCdata(extractTag(block, "pubDate")) || null;
    if (!title || !link || isNoise(`${title} ${link}`)) continue;
    items.push(makeItem(source, { title, url: link, date, type: "rss" }));
  }
  return items.filter(Boolean).slice(0, 40);
}

async function scanGoogleTrendsRss(source, env) {
  const xml = await fetchText(source.url, env);
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = stripCdata(extractTag(block, "title"));
    const traffic = stripCdata(extractNamespacedTag(block, "approx_traffic"));
    const date = stripCdata(extractTag(block, "pubDate")) || null;
    const news = extractTrendNewsItems(block);
    if (!title || isNoise(`${title} ${news.map(item => item.title).join(" ")}`)) continue;

    items.push({
      id: `trend:${normalizeTitleForId(title)}:${normalizeDate(date) || "current"}`,
      title,
      url: source.url,
      canonicalUrl: canonicalizeUrl(source.url),
      date: normalizeDate(date),
      type: "trend-rss",
      traffic,
      news,
      stage: classifyStage(`${title} ${news.map(item => item.title).join(" ")}`),
      canonicalId: `trend:${normalizeTitleForId(title)}:${normalizeDate(date) || "current"}`,
      fingerprintSchemaVersion: FINGERPRINT_SCHEMA_VERSION,
      confidence: 0.65,
      fingerprint: sha256HexSync(`${source.id}|${normalizeTitleForId(title)}|${normalizeDate(date) || "current"}|${traffic}`)
    });
  }

  return items.slice(0, 40);
}

function extractTrendNewsItems(block) {
  const news = [];
  const newsRegex = /<[^:>]*:?news_item\b[^>]*>([\s\S]*?)<\/[^:>]*:?news_item>/gi;
  let match;
  while ((match = newsRegex.exec(block)) !== null) {
    const itemBlock = match[1];
    const title = stripCdata(extractNamespacedTag(itemBlock, "news_item_title"));
    const url = stripCdata(extractNamespacedTag(itemBlock, "news_item_url"));
    const source = stripCdata(extractNamespacedTag(itemBlock, "news_item_source"));
    if (!title) continue;
    news.push({ title, url, source });
  }
  return news;
}

async function scanOfficialLinks(source, env) {
  const html = await fetchText(source.url, env, {
    maxChars: source.maxHtmlChars || DEFAULT_MAX_HTML_CHARS,
    timeoutMs: source.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS
  });
  const scoped = extractAnchorsFromSelectors(html, source.url, source.selectors || [], {
    maxAnchors: source.maxAnchors || DEFAULT_MAX_ANCHORS
  });
  const scopedItems = officialItemsFromAnchors(source, scoped.anchors);
  if (scopedItems.length > 0) {
    return {
      items: scopedItems.filter(Boolean).sort(sortByDateDesc).slice(0, 50),
      extractionMode: "selector",
      matchedSelectors: scoped.matchedSelectors
    };
  }

  const anchors = extractAnchors(html, source.url, { maxAnchors: source.maxAnchors || DEFAULT_MAX_ANCHORS });
  return {
    items: officialItemsFromAnchors(source, anchors).filter(Boolean).sort(sortByDateDesc).slice(0, 50),
    extractionMode: "fallback",
    matchedSelectors: scoped.matchedSelectors
  };
}

function officialItemsFromAnchors(source, anchors) {
  const seen = new Set();
  const items = [];

  for (const anchor of anchors) {
    const haystack = `${anchor.title} ${anchor.url}`.toLowerCase();
    if (seen.has(anchor.url)) continue;
    if (isNoise(haystack)) continue;
    if (!isSourceFilterMatch(source, anchor.title, anchor.url)) continue;
    if (!isLikelyOfficialUrl(anchor.url, source)) continue;

    seen.add(anchor.url);
    items.push(makeItem(source, {
      title: anchor.title || linkLabel(anchor.url),
      url: anchor.url,
      date: extractDate(anchor.title) || extractDate(anchor.url),
      type: /\.pdf(\?|#|$)/i.test(anchor.url) ? "pdf" : "link"
    }));
  }

  return items;
}

function isSourceFilterMatch(source, title, url) {
  const haystack = `${title || ""} ${url || ""}`.toLowerCase();
  const include = (source.include || KEYWORDS).map(value => value.toLowerCase());
  const exclude = (source.exclude || []).map(value => value.toLowerCase());
  if (isNoise(haystack)) return false;
  if (exclude.some(term => haystack.includes(term))) return false;
  return include.length === 0 || include.some(term => haystack.includes(term));
}

async function scanUpscWhatsNew(source, env) {
  const html = await fetchText(source.url, env, { maxChars: source.maxHtmlChars || DEFAULT_MAX_HTML_CHARS });
  const anchors = extractAnchors(html, source.url, { maxAnchors: source.maxAnchors || DEFAULT_MAX_ANCHORS });
  const items = [];
  const seen = new Set();

  for (const anchor of anchors) {
    const title = anchor.title || linkLabel(anchor.url);
    const haystack = `${title} ${anchor.url}`.toLowerCase();
    if (seen.has(anchor.url)) continue;
    if (isNoise(haystack)) continue;
    if (!/(exam|notification|result|interview|schedule|admit|e-?summon|recruitment|rectt|written|marks|omr|nda|cds|civil services|capf|cse)/i.test(haystack)) continue;
    if (!isLikelyOfficialUrl(anchor.url, source)) continue;

    seen.add(anchor.url);
    items.push(makeItem(source, {
      id: upscId(anchor.url, title),
      title,
      url: anchor.url,
      date: extractDate(title) || extractDate(anchor.url),
      type: /\.pdf(\?|#|$)/i.test(anchor.url) ? "pdf" : "link"
    }));
  }

  return items.filter(Boolean).sort(sortByDateDesc).slice(0, 50);
}

async function scanKeaAnnouncements(source, env) {
  const html = await fetchText(source.url, env, { maxChars: source.maxHtmlChars || DEFAULT_MAX_HTML_CHARS });
  const anchors = extractAnchors(html, source.url, { maxAnchors: source.maxAnchors || DEFAULT_MAX_ANCHORS });
  const include = (source.include || KEYWORDS).map(value => value.toLowerCase());
  const items = [];
  const seen = new Set();

  for (const anchor of anchors) {
    const title = anchor.title || linkLabel(anchor.url);
    const haystack = `${title} ${anchor.url}`.toLowerCase();
    if (seen.has(anchor.url)) continue;
    if (isNoise(haystack)) continue;
    if (!include.some(term => haystack.includes(term))) continue;
    if (!/(kea|cet|ugcet|pgcet|dcet|keaonline|admission|seat|allotment|rank|result|notification|counselling|counseling)/i.test(haystack)) continue;
    if (!isLikelyOfficialUrl(anchor.url, source)) continue;

    seen.add(anchor.url);
    items.push(makeItem(source, {
      id: keaId(anchor.url, title),
      title,
      url: anchor.url,
      date: extractDate(title) || extractDate(anchor.url),
      type: /\.pdf(\?|#|$)/i.test(anchor.url) ? "pdf" : "link"
    }));
  }

  return items.filter(Boolean).sort(sortByDateDesc).slice(0, 50);
}

async function scanCbseResults(source, env) {
  const html = await fetchText(source.url, env, { maxChars: source.maxHtmlChars || DEFAULT_MAX_HTML_CHARS });
  const anchors = extractAnchors(html, source.url, { maxAnchors: source.maxAnchors || DEFAULT_MAX_ANCHORS });
  const textItems = extractCbseResultTextItems(html, source);
  const items = [];
  const seen = new Set();
  const seenIds = new Set();

  for (const raw of [...anchors, ...textItems]) {
    const title = raw.title || linkLabel(raw.url);
    const haystack = `${title} ${raw.url}`.toLowerCase();
    if (seen.has(`${title}|${raw.url}`)) continue;
    if (isNoise(haystack)) continue;
    if (!/(result|secondary|senior|class x|class 10|class xii|class 12|ctet|examination)/i.test(haystack)) continue;
    if (!isLikelyOfficialUrl(raw.url, source)) continue;

    const item = makeItem(source, {
      id: cbseId(raw.url, title),
      title,
      url: raw.url,
      date: extractDate(title) || extractDate(raw.url),
      type: "link"
    });
    if (!item || seenIds.has(item.canonicalId)) continue;
    seen.add(`${title}|${raw.url}`);
    seenIds.add(item.canonicalId);
    items.push(item);
  }

  return items.filter(Boolean).sort(sortByDateDesc).slice(0, 30);
}

function extractCbseResultTextItems(html, source) {
  const text = cleanText(html).replace(/\s+/g, " ");
  const regex = /((?:Senior School Certificate|Secondary School|CENTRAL TEACHER ELIGIBILITY TEST|CTET)[^.;|]{0,140}?(?:20\d{2})[^.;|]{0,120}?(?:Announced on [^.;|]{3,40})?)/gi;
  const items = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const title = cleanText(match[1]);
    if (!title) continue;
    items.push({ title, url: source.url });
  }
  return items;
}

function extractAnchors(html, baseUrl, options = {}) {
  const anchors = [];
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    if (options.maxAnchors && anchors.length >= options.maxAnchors) break;
    const href = match[1].match(/\bhref=["']([^"']+)["']/i)?.[1];
    const url = absolutize(href, baseUrl);
    if (!url) continue;
    anchors.push({ url, title: cleanText(match[2]) });
  }
  return anchors;
}

function extractAnchorsFromSelectors(html, baseUrl, selectors, options = {}) {
  const anchors = [];
  const matchedSelectors = [];
  const seen = new Set();

  for (const selector of selectors) {
    if (options.maxAnchors && anchors.length >= options.maxAnchors) break;
    const selectorAnchors = extractAnchorsForSelector(html, baseUrl, selector, {
      maxAnchors: options.maxAnchors ? options.maxAnchors - anchors.length : null
    });
    if (selectorAnchors.length === 0) continue;
    matchedSelectors.push(selector);
    for (const anchor of selectorAnchors) {
      const key = `${anchor.url}|${anchor.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      anchors.push(anchor);
      if (options.maxAnchors && anchors.length >= options.maxAnchors) break;
    }
  }

  return { anchors, matchedSelectors };
}

function extractAnchorsForSelector(html, baseUrl, selector, options = {}) {
  const value = String(selector || "").trim();
  if (!value) return [];
  if (/^a(?:[.#][a-z0-9_-]+)?$/i.test(value)) {
    return filterAnchorsByAnchorSelector(extractAnchors(html, baseUrl, options), value);
  }

  const containerSelector = value.replace(/\s*>\s*a\s*$/i, "").replace(/\s+a\s*$/i, "").trim();
  if (!containerSelector || containerSelector === value) return [];

  const blocks = extractBlocksBySimpleSelector(html, containerSelector);
  const anchors = [];
  for (const block of blocks) {
    if (options.maxAnchors && anchors.length >= options.maxAnchors) break;
    anchors.push(...extractAnchors(block, baseUrl, {
      maxAnchors: options.maxAnchors ? options.maxAnchors - anchors.length : null
    }));
  }
  return anchors;
}

function filterAnchorsByAnchorSelector(anchors, selector) {
  const requiredClass = selector.match(/\.([a-z0-9_-]+)/i)?.[1];
  const requiredId = selector.match(/#([a-z0-9_-]+)/i)?.[1];
  if (!requiredClass && !requiredId) return anchors;
  return anchors.filter(anchor => {
    const text = `${anchor.title} ${anchor.url}`.toLowerCase();
    return (!requiredClass || text.includes(requiredClass.toLowerCase()))
      && (!requiredId || text.includes(requiredId.toLowerCase()));
  });
}

function extractBlocksBySimpleSelector(html, selector) {
  const parsed = parseSimpleSelector(selector);
  if (!parsed) return [];
  const blocks = [];
  const tagPattern = parsed.tag || "[a-z][\\w:-]*";
  const openTagRegex = new RegExp(`<(${tagPattern})\\b([^>]*)>`, "gi");
  let match;

  while ((match = openTagRegex.exec(html)) !== null) {
    const tag = match[1];
    const attrs = match[2] || "";
    if (!attributesMatchSelector(attrs, parsed)) continue;
    const block = extractElementBlock(html, match.index, tag);
    if (!block) continue;
    blocks.push(block.html);
    openTagRegex.lastIndex = block.endIndex;
  }

  return blocks;
}

function extractElementBlock(html, startIndex, tag) {
  const pattern = new RegExp(`<\\/?${escapeRegex(tag)}\\b[^>]*>`, "gi");
  pattern.lastIndex = startIndex;
  let depth = 0;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const isClosing = /^<\//.test(match[0]);
    depth += isClosing ? -1 : 1;
    if (depth === 0) {
      return {
        html: html.slice(startIndex, pattern.lastIndex),
        endIndex: pattern.lastIndex
      };
    }
  }

  return null;
}

function parseSimpleSelector(selector) {
  const value = String(selector || "").trim();
  const match = value.match(/^(?:(?<tag>[a-z][\w:-]*)?)?(?:(?<id>#[a-z0-9_-]+)|(?<class>\.[a-z0-9_-]+))?$/i);
  if (!match) return null;
  const tag = match.groups?.tag || null;
  const id = match.groups?.id ? match.groups.id.slice(1) : null;
  const className = match.groups?.class ? match.groups.class.slice(1) : null;
  if (!tag && !id && !className) return null;
  return { tag, id, className };
}

function attributesMatchSelector(attrs, selector) {
  if (selector.id) {
    const idValue = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    if (idValue !== selector.id) return false;
  }
  if (selector.className) {
    const classValue = attrs.match(/\bclass\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    const classes = classValue.toLowerCase().split(/\s+/);
    if (!classes.includes(selector.className.toLowerCase())) return false;
  }
  return true;
}

function escapeRegex(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeItem(source, raw) {
  const title = cleanText(raw.title || "");
  const url = normalizeUrl(raw.url || source.homepage);
  if (!title && !url) return null;
  const canonicalUrl = canonicalizeUrl(url);
  const stage = classifyStage(`${title} ${canonicalUrl}`);
  const canonicalId = canonicalItemId(source, raw, title, canonicalUrl);
  const fingerprintBase = `${source.id}|${stage}|${canonicalId}`;
  return {
    id: raw.id || null,
    title: title || linkLabel(url),
    url,
    canonicalUrl,
    date: normalizeDate(raw.date),
    type: raw.type || "item",
    stage,
    canonicalId,
    fingerprintSchemaVersion: FINGERPRINT_SCHEMA_VERSION,
    confidence: confidenceFor(raw, title, url),
    fingerprint: sha256HexSync(fingerprintBase)
  };
}

function confidenceFor(raw, title, url) {
  const text = `${title} ${url}`.toLowerCase();
  let score = 0.55;
  if (raw.type === "rss") score += 0.2;
  if (raw.type === "pdf") score += 0.2;
  if (KEYWORDS.some(k => text.includes(k))) score += 0.15;
  if (classifyStage(text) !== "other") score += 0.05;
  if (raw.id) score += 0.05;
  if (/\b20\d{2}\b/.test(text)) score += 0.05;
  return Math.min(0.98, Number(score.toFixed(2)));
}

function classifyStage(text) {
  const value = String(text || "");
  for (const [stage, pattern] of STAGE_PATTERNS) {
    if (pattern.test(value)) return stage;
  }
  return "other";
}

function canonicalItemId(source, raw, title, canonicalUrl) {
  if (raw.id) return `${raw.type || "item"}:${String(raw.id).toLowerCase()}`;
  const officialId = officialIdFromUrl(source, canonicalUrl);
  if (officialId) return officialId;
  return `${normalizeTitleForId(title)}|${canonicalUrl.toLowerCase()}`;
}

function officialIdFromUrl(source, url) {
  const value = String(url || "");
  const nta = value.match(/Notice_(\d{14})\.pdf/i);
  if (nta) return `nta-notice:${nta[1]}`;
  const ssc = value.match(/\/api\/attachment\/(.+)$/i);
  if (ssc) return `ssc-attachment:${ssc[1].toLowerCase()}`;
  const rbi = value.match(/\/PDFs\/([^/?#]+)\.PDF/i);
  if (rbi) return `rbi-pdf:${rbi[1].toLowerCase()}`;
  const rrbCen = `${value} ${source.id}`.match(/\b(CEN|C\.E\.N\.?)\s*[-_/ ]?\s*(\d{1,2})\s*[-_/ ]?\s*(20\d{2})\b/i);
  if (rrbCen) return `rrb-cen:${rrbCen[2].padStart(2, "0")}-${rrbCen[3]}`;
  return null;
}

function upscId(url, title) {
  const value = `${url} ${title}`;
  const file = value.match(/\/([^/]+?)(?:\.pdf|$)/i);
  if (file && /\.pdf/i.test(value)) return `upsc-file:${file[1].toLowerCase()}`;
  const exam = value.match(/\b(NDA|CDS|CAPF|CISF|Civil Services|CSE|Engineering Services|Combined Medical Services|CMS|Geo-Scientist|IES|ISS)[^|]{0,80}?\b(20\d{2})\b/i);
  if (exam) return `upsc:${normalizeTitleForId(exam[1])}-${exam[2]}-${classifyStage(value)}`;
  return `upsc:${normalizeTitleForId(title)}|${canonicalizeUrl(url).toLowerCase()}`;
}

function keaId(url, title) {
  const value = `${url} ${title}`;
  const course = value.match(/\b(UGCET|KCET|PGCET|DCET|KEA|NEET|CET)\s*[- ]?\s*(20\d{2})?\b/i);
  const dated = extractDate(value);
  if (course) return `kea:${course[1].toLowerCase()}-${course[2] || dated || "current"}-${classifyStage(value)}`;
  const file = value.match(/\/([^/]+?)(?:\.pdf|$)/i);
  if (file && /\.pdf/i.test(value)) return `kea-file:${file[1].toLowerCase()}`;
  return `kea:${normalizeTitleForId(title)}|${canonicalizeUrl(url).toLowerCase()}`;
}

function cbseId(url, title) {
  const value = `${url} ${title}`;
  const classMatch = value.match(/\b(Class\s*(XII|12|X|10)|Senior School Certificate|Secondary School|CTET)[^|]{0,80}?\b(20\d{2})\b/i);
  if (classMatch) {
    return `cbse-result:${normalizeTitleForId(classMatch[1])}-${classMatch[3]}`;
  }
  const resultPath = value.match(/\/([^/]*(?:result|class)[^/?#]*)/i);
  if (resultPath) return `cbse-result:${normalizeTitleForId(resultPath[1])}`;
  return `cbse:${normalizeTitleForId(title)}|${canonicalizeUrl(url).toLowerCase()}`;
}

function normalizeTitleForId(title) {
  return cleanText(title)
    .toLowerCase()
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, "")
    .replace(/\b(visitor|counter|updated on|last updated)\b.*$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

async function persistDetections(env, detections) {
  const state = getStateBinding(env);
  const recent = await readRecent(env);
  const merged = [...detections, ...recent].slice(0, MAX_RECENT);
  await state.put(RECENT_KEY, JSON.stringify(merged));

  for (const detection of detections) {
    await state.put(`${DETECTION_PREFIX}${detection.detectedAt}:${detection.fingerprint}`, JSON.stringify(detection));
  }
}

async function claimDetectionsForGeneration(env, detections) {
  const state = getStateBinding(env);
  const minConfidence = Number(env.MIN_DISPATCH_CONFIDENCE || DEFAULT_MIN_DISPATCH_CONFIDENCE);
  const claimed = [];

  for (const detection of detections) {
    if (detection.strategy === "google_trends_rss" || detection.sourceId === "google-trends-in") {
      await putProcessStatus(state, detection.fingerprint, {
        status: "trend_signal_only",
        reason: "Google Trends RSS is demand evidence only; official-source confirmation is required before generation.",
        detection,
        updatedAt: new Date().toISOString()
      });
      continue;
    }

    if (requiresOpportunityQueue(detection)) {
      await putProcessStatus(state, detection.fingerprint, {
        status: "opportunity_queue_required",
        reason: "Official RSS scheme/digital-service detections are scored and deduped through the Opportunity Queue before generation.",
        detection,
        updatedAt: new Date().toISOString()
      });
      continue;
    }

    if ((detection.confidence || 0) < minConfidence) {
      await putProcessStatus(state, detection.fingerprint, {
        status: "held_low_confidence",
        reason: `confidence ${detection.confidence} < ${minConfidence}`,
        detection,
        updatedAt: new Date().toISOString()
      });
      continue;
    }

    const existing = await state.get(`${PROCESS_PREFIX}${detection.fingerprint}`);
    if (existing) continue;

    const status = {
      status: "queued",
      detection,
      queuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await putProcessStatus(state, detection.fingerprint, status);
    claimed.push(detection);
  }

  return claimed;
}

function requiresOpportunityQueue(detection) {
  if (!["pib", "rbi-notifications"].includes(detection.sourceId)) return false;
  const category = classifyOpportunity(`${detection.title} ${detection.url}`.toLowerCase());
  return ["scheme", "policy-change", "digital-service"].includes(category);
}

async function dispatchToGitHub(env, detections) {
  if (!env.GITHUB_DISPATCH_TOKEN || !env.GITHUB_REPO) return;

  const eventType = detections.every(isEvergreenUpdateDetection)
    ? "cloudflare_evergreen_update_batch"
    : detections.every(isSchemeDetection)
    ? "cloudflare_scheme_batch"
    : detections.every(isPrepositionDetection)
    ? "cloudflare_preposition_batch"
    : "cloudflare_detection_batch";

  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "CitizenNest-Monitor/1.0"
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: {
        source: "cloudflare-worker",
        detectedAt: new Date().toISOString(),
        detections
      }
    })
  });

  const status = response.ok ? "dispatched" : "dispatch_failed";
  const details = response.ok ? null : await response.text().catch(() => null);
  await markProcessStatuses(env, detections.map(detection => detection.fingerprint), status, {
    githubStatus: response.status,
    details: details?.slice(0, 500)
  });
}

async function dispatchClaimedDetections(env, detections) {
  const evergreen = detections.filter(isEvergreenUpdateDetection);
  const scheme = detections.filter(detection => !isEvergreenUpdateDetection(detection) && isSchemeDetection(detection));
  const preposition = detections.filter(detection => !isEvergreenUpdateDetection(detection) && !isSchemeDetection(detection) && isPrepositionDetection(detection));
  const exam = detections.filter(detection => !isEvergreenUpdateDetection(detection) && !isSchemeDetection(detection) && !isPrepositionDetection(detection));
  if (evergreen.length > 0) await dispatchToGitHub(env, evergreen);
  if (scheme.length > 0) await dispatchToGitHub(env, scheme);
  if (preposition.length > 0) await dispatchToGitHub(env, preposition);
  if (exam.length > 0) await dispatchToGitHub(env, exam);
}

function isEvergreenUpdateDetection(detection) {
  return detection.decision === "update_existing" && Boolean(detection.existingPageMatch?.slug);
}

function isSchemeDetection(detection) {
  if (!["pib", "rbi-notifications"].includes(detection.sourceId)) return false;
  const category = classifyOpportunity(`${detection.title} ${detection.url}`.toLowerCase());
  return ["scheme", "policy-change", "digital-service"].includes(category);
}

function isPrepositionDetection(detection) {
  return detection.strategy === "trend_preposition" || detection.safeContentMode === "preposition_only";
}

async function notifyWebhook(env, detections) {
  if (!env.DETECTION_WEBHOOK_URL) return;
  await fetch(env.DETECTION_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.DETECTION_WEBHOOK_SECRET ? { "X-CitizenNest-Secret": env.DETECTION_WEBHOOK_SECRET } : {})
    },
    body: JSON.stringify({ detections })
  }).catch(() => null);
}

async function readProcessStatuses(env, fingerprints) {
  const state = getStateBinding(env);
  const statuses = {};
  for (const fingerprint of fingerprints) {
    const raw = await state.get(`${PROCESS_PREFIX}${fingerprint}`);
    statuses[fingerprint] = raw ? JSON.parse(raw) : null;
  }
  return statuses;
}

async function markProcessStatuses(env, fingerprints, status, details = {}) {
  const state = getStateBinding(env);
  for (const fingerprint of fingerprints.slice(0, 100)) {
    const raw = await state.get(`${PROCESS_PREFIX}${fingerprint}`);
    const previous = raw ? JSON.parse(raw) : {};
    await putProcessStatus(state, fingerprint, {
      ...previous,
      ...details,
      status,
      updatedAt: new Date().toISOString()
    });
  }
}

async function putProcessStatus(state, fingerprint, value) {
  await state.put(`${PROCESS_PREFIX}${fingerprint}`, JSON.stringify(value));
}

async function sendPageCreatedEmail(env, body) {
  const to = env.PAGE_CREATED_EMAIL_TO || "admin@citizennest.com";
  const from = env.PAGE_CREATED_EMAIL_FROM || "monitor@citizennest.com";
  const urls = body.urls.slice(0, 20);
  const subject = `CitizenNest: ${urls.length} page${urls.length === 1 ? "" : "s"} created`;
  const text = [
    "New CitizenNest page(s) were generated and pushed:",
    "",
    ...urls,
    "",
    body.runUrl ? `GitHub run: ${body.runUrl}` : null
  ].filter(Boolean).join("\n");

  if (!env.EMAIL?.send) {
    return { ok: false, skipped: true, reason: "EMAIL binding is not configured", to, from, urls };
  }

  await env.EMAIL.send({
    to,
    from: { email: from, name: "CitizenNest Monitor" },
    subject,
    text,
    html: `<p>New CitizenNest page(s) were generated and pushed:</p><ul>${urls.map(url => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`).join("")}</ul>${body.runUrl ? `<p>GitHub run: <a href="${escapeHtml(body.runUrl)}">${escapeHtml(body.runUrl)}</a></p>` : ""}`
  });

  return { ok: true, emailed: true, to, from, count: urls.length };
}

async function readRecent(env) {
  const state = getStateBinding(env);
  const raw = await state.get(RECENT_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function readSourcesStatus(env) {
  const state = getStateBinding(env);
  const now = Date.now();
  const statuses = [];

  for (const source of config.sources) {
    const current = await readSourceState(state, source.id);
    const lastSuccessAgeMinutes = current.lastSuccessAt
      ? Math.round((now - Date.parse(current.lastSuccessAt)) / 60000)
      : null;
    const stale = lastSuccessAgeMinutes === null || lastSuccessAgeMinutes > HEALTH_STALE_MINUTES;
    const health = current.error
      ? (current.lastSuccessAt ? "degraded" : "failing")
      : (stale ? "stale" : "ok");

    statuses.push({
      id: source.id,
      name: source.name,
      tier: source.tier,
      strategy: source.strategy,
      url: source.url,
      health,
      scannedAt: current.scannedAt || null,
      lastSuccessAt: current.lastSuccessAt || null,
      lastSuccessAgeMinutes,
      itemCount: current.itemCount || 0,
      lastGoodItemCount: current.lastGoodItemCount || current.itemCount || 0,
      fingerprintCount: current.fingerprints?.length || 0,
      consecutiveErrors: current.consecutiveErrors || 0,
      durationMs: current.durationMs || null,
      error: current.error || null
    });
  }

  return statuses;
}

async function readSourceState(state, sourceId) {
  const raw = await state.get(`${STATE_PREFIX}${sourceId}`);
  return raw ? JSON.parse(raw) : {};
}

function getStateBinding(env) {
  if (!env.MONITOR_STATE) throw new Error("MONITOR_STATE KV binding is required");
  return env.MONITOR_STATE;
}

async function fetchText(url, env, options = {}) {
  const fixture = readFixture(url, env);
  if (fixture !== null) return truncateText(fixture, options.maxChars);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 CitizenNest-Monitor/1.0",
      "Accept": "text/html,application/xhtml+xml,application/xml,text/xml,*/*",
      "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      "Referer": "https://www.citizennest.com/"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return truncateText(await response.text(), options.maxChars);
}

async function fetchJson(url, env, options = {}) {
  const fixture = readFixture(url, env);
  if (fixture !== null) return JSON.parse(fixture);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 CitizenNest-Monitor/1.0",
      "Accept": "application/json,*/*",
      "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      "Referer": "https://www.citizennest.com/"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

function truncateText(text, maxChars) {
  const value = String(text || "");
  const limit = Number(maxChars || 0);
  if (!limit || value.length <= limit) return value;
  return value.slice(0, limit);
}

function readFixture(url, env) {
  if (!env?.FIXTURE_RESPONSES) return null;
  let fixtures;
  try {
    fixtures = typeof env.FIXTURE_RESPONSES === "string"
      ? JSON.parse(env.FIXTURE_RESPONSES)
      : env.FIXTURE_RESPONSES;
  } catch {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(fixtures, url)) return null;
  const fixture = fixtures[url];
  if (fixture && typeof fixture === "object" && fixture.error) {
    throw new Error(fixture.error);
  }
  return fixture;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function isAuthorized(request, env) {
  if (!env.MONITOR_ADMIN_TOKEN) return false;
  const header = request.headers.get("Authorization") || "";
  return header === `Bearer ${env.MONITOR_ADMIN_TOKEN}`;
}

function absolutize(href, baseUrl) {
  if (!href || href.startsWith("#") || /^javascript:/i.test(href)) return null;
  try { return normalizeUrl(new URL(href, baseUrl).href); } catch { return null; }
}

function normalizeUrl(url) {
  return decodeHtml(String(url || ""))
    .replace(/^(https?:\/\/)+/i, match => match.toLowerCase().startsWith("https") ? "https://" : "http://")
    .replace(/&amp;/g, "&")
    .trim();
}

function canonicalizeUrl(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_|_hs|cache|timestamp|ts$|v$)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.searchParams.sort();
    const text = parsed.toString().replace(/\/$/, "");
    return text;
  } catch {
    return normalizeUrl(url).replace(/[?#].*$/, "");
  }
}

function isLikelyOfficialUrl(url, source) {
  try {
    const itemHost = new URL(url).hostname.replace(/^www\./, "");
    const sourceHost = new URL(source.homepage || source.url).hostname.replace(/^www\./, "");
    const officialHosts = (source.officialHosts || []).map(host => String(host).replace(/^www\./, "").toLowerCase());
    if (officialHosts.some(host => itemHost === host || itemHost.endsWith(`.${host}`))) return true;
    return itemHost === sourceHost
      || itemHost.endsWith(".gov.in")
      || itemHost.endsWith(".nic.in")
      || itemHost.endsWith(".ac.in")
      || itemHost.endsWith(".edu.in")
      || itemHost.endsWith("s3waas.gov.in")
      || itemHost.endsWith("digialm.com")
      || itemHost.endsWith("bank.sbi")
      || itemHost.endsWith("rbi.org.in");
  } catch {
    return false;
  }
}

function isNoise(text) {
  const lower = String(text || "").toLowerCase();
  return NOISE.some(term => lower.includes(term));
}

function cleanText(text) {
  return decodeHtml(String(text || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim())
    .slice(0, 240);
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripCdata(text) {
  return String(text || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function extractTag(xml, tag) {
  return xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "";
}

function extractNamespacedTag(xml, tag) {
  return xml.match(new RegExp(`<(?:[a-z0-9_-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-z0-9_-]+:)?${tag}>`, "i"))?.[1] || "";
}

function normalizeSearchText(text) {
  return decodeHtml(String(text || ""))
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9\s.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchDictionary(text, dictionary) {
  const value = ` ${normalizeSearchText(text)} `;
  const matches = [];
  for (const term of dictionary) {
    const normalized = normalizeSearchText(term);
    if (!normalized) continue;
    if (value.includes(` ${normalized} `)) matches.push(term);
  }
  return [...new Set(matches)].slice(0, 12);
}

function parseTrendTraffic(value) {
  const text = String(value || "0").replace(/,/g, "").replace(/\+/g, "").trim().toLowerCase();
  if (text.endsWith("m")) return Math.round(Number(text.slice(0, -1)) * 1000000) || 0;
  if (text.endsWith("k")) return Math.round(Number(text.slice(0, -1)) * 1000) || 0;
  return Number.parseInt(text, 10) || 0;
}

function timestampDate(value) {
  const text = String(value || "");
  if (!/^\d{8}/.test(text)) return null;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function extractDate(text) {
  const value = String(text || "");
  const iso = value.match(/\b(20\d{2})[-_/](\d{1,2})[-_/](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const compact = value.match(/\b(20\d{2})(\d{2})(\d{2})\b/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return null;
}

function normalizeDate(date) {
  if (!date) return null;
  const extracted = extractDate(date);
  if (extracted) return extracted;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

function linkLabel(url) {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname)
      .replace(/[-_]+/g, " ")
      .slice(0, 120);
  } catch {
    return "Official update";
  }
}

function sortByDateDesc(a, b) {
  return String(b.date || "").localeCompare(String(a.date || ""));
}

function sha256HexSync(text) {
  // FNV-1a 64-bit is enough for monitor fingerprints and works synchronously in Workers.
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const char of text) {
    hash ^= BigInt(char.codePointAt(0));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}
