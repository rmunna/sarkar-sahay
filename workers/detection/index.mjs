import config from "./sources.json" with { type: "json" };

const STATE_PREFIX = "source:";
const DETECTION_PREFIX = "detection:";
const PROCESS_PREFIX = "process:";
const RECENT_KEY = "detections:recent";
const DEFAULT_TIER = 2;
const MAX_RECENT = 100;
const DEFAULT_MIN_DISPATCH_CONFIDENCE = 0.75;
const HEALTH_STALE_MINUTES = 45;
const FINGERPRINT_SCHEMA_VERSION = "2026-06-08.1";

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
  "kea", "kcet", "cet", "mht cet", "comedk", "tspsc",
  "appsc", "tnpsc", "kpsc", "mppsc", "rpsc", "gpsc", "opsc",
  "jpsc", "hpsc", "hppsc", "ukpsc", "wbpsc", "ap eamcet",
  "ts eamcet", "eamcet", "msbte", "ignou", "du", "anna university",
  "calicut university", "ktu"
];

const TREND_SIGNAL_SKIP = /\b(cricket|ipl|t20|stock market|nifty|sensex|movie|ott|song|weather|earthquake|lottery|horoscope|share price|election result|football|kabaddi)\b/i;

const NOISE = [
  "visitor", "counter", "tender", "annual report", "privacy", "terms",
  "facebook", "twitter", "instagram", "youtube", "login#", "javascript:",
  "style.css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff"
];

const STAGE_PATTERNS = [
  ["admit-card", /\b(admit card|hall ticket|call letter|city intimation|exam city)\b/i],
  ["result", /\b(result|scorecard|marksheet|merit list|shortlisted|provisional list)\b/i],
  ["answer-key", /\b(answer key|response sheet|objection|challenge)\b/i],
  ["notification", /\b(notification|advertisement|recruitment|vacancy|notice|cen|crp)\b/i],
  ["exam-schedule", /\b(schedule|exam date|time table|date sheet|written exam|interview schedule)\b/i],
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

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(scanAndPersist(env, { tier: DEFAULT_TIER, dryRun: false, sourceId: null }));
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
      const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await scanAndPersist(env, { tier, dryRun, sourceId });
      return json(result);
    }

    if (pathname === "/opportunities") {
      const tier = Number(url.searchParams.get("tier") || 2);
      const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await scanOpportunities(env, { tier, dryRun });
      return json(result);
    }

    if (pathname === "/trend-signals") {
      const dryRun = url.searchParams.get("dryRun") !== "0";
      if (!dryRun && !isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
      const result = await scanTrendSignals(env, { dryRun });
      return json(result);
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

async function scanAndPersist(env, options) {
  const state = getStateBinding(env);
  const sources = config.sources.filter(source => {
    if (options.sourceId) return source.id === options.sourceId;
    return Number(source.tier || 99) <= options.tier;
  });

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

async function scanOpportunities(env, options) {
  const startedAt = new Date().toISOString();
  const feedSources = config.sources.filter(source =>
    Number(source.tier || 99) <= options.tier &&
    source.strategy === "rss"
  );
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

  return {
    ok: true,
    dryRun: options.dryRun,
    scannedAt: startedAt,
    sourceCount: feedSources.length,
    opportunityCount: items.length,
    clusterCount: clusters.length,
    results,
    clusters
  };
}

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

  return {
    ok: true,
    dryRun: options.dryRun,
    scannedAt: startedAt,
    sourceId: source.id,
    sourceName: source.name,
    itemCount: result.length,
    signalCount: signals.length,
    note: "Trend signals are demand evidence only. Generate content only after official-source confirmation.",
    signals
  };
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
    traffic: item.traffic,
    trafficApprox: traffic,
    date: item.date,
    matchedKeywords,
    matchedOrgs,
    stage: classifyStage(text),
    score,
    officialConfirmationRequired: true,
    evidence: (item.news || []).slice(0, 5),
    fingerprint: item.fingerprint
  };
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

async function scanSource(source, env) {
  if (usesUrlFallbacks(source)) {
    return scanSourceWithUrlFallbacks(source, env);
  }

  try {
    if (source.strategy === "ssc_api") return { items: await scanSscApi(source, env) };
    if (source.strategy === "nta_notice_pdf") return { items: await scanNta(source, env) };
    if (source.strategy === "rss") return { items: await scanRss(source, env) };
    if (source.strategy === "google_trends_rss") return { items: await scanGoogleTrendsRss(source, env) };
    return { items: await scanOfficialLinks(source, env) };
  } catch (error) {
    return { items: [], error: error.message || String(error) };
  }
}

async function scanSourceWithUrlFallbacks(source, env) {
  const errors = [];
  for (const url of getSourceUrls(source)) {
    const scopedSource = { ...source, url };
    try {
      const items = await scanFallbackSource(scopedSource, env);
      if (items.length > 0) return { items, urlUsed: url };
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
  }).filter(Boolean);
}

async function scanNta(source, env) {
  const html = await fetchText(source.url, env);
  const items = [];
  const regex = /(?:<[^>]+>)*([^<]{8,220}?)(?:&nbsp;|\s)*<\/[^>]+>\s*<a[^>]+href=["']([^"']*Download\/Notice\/Notice_(\d{14})\.pdf)["'][^>]*>/gi;
  const fallback = /href=["']([^"']*Download\/Notice\/Notice_(\d{14})\.pdf)["']/gi;
  const seen = new Set();
  let match;

  while ((match = regex.exec(html)) !== null) {
    const url = absolutize(match[2], source.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push(makeItem(source, {
      id: match[3],
      title: cleanText(match[1]) || `NTA notice ${match[3]}`,
      url,
      date: timestampDate(match[3]),
      type: "pdf"
    }));
  }

  while ((match = fallback.exec(html)) !== null) {
    const url = absolutize(match[1], source.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push(makeItem(source, {
      id: match[2],
      title: `NTA notice ${match[2]}`,
      url,
      date: timestampDate(match[2]),
      type: "pdf"
    }));
  }

  return items.filter(Boolean).sort(sortByDateDesc).slice(0, 30);
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
  const html = await fetchText(source.url, env);
  const anchors = extractAnchors(html, source.url);
  const include = (source.include || KEYWORDS).map(v => v.toLowerCase());
  const exclude = (source.exclude || []).map(v => v.toLowerCase());
  const seen = new Set();
  const items = [];

  for (const anchor of anchors) {
    const haystack = `${anchor.title} ${anchor.url}`.toLowerCase();
    if (seen.has(anchor.url)) continue;
    if (isNoise(haystack)) continue;
    if (exclude.some(term => haystack.includes(term))) continue;
    if (!include.some(term => haystack.includes(term))) continue;
    if (!isLikelyOfficialUrl(anchor.url, source)) continue;

    seen.add(anchor.url);
    items.push(makeItem(source, {
      title: anchor.title || linkLabel(anchor.url),
      url: anchor.url,
      date: extractDate(anchor.title) || extractDate(anchor.url),
      type: /\.pdf(\?|#|$)/i.test(anchor.url) ? "pdf" : "link"
    }));
  }

  return items.filter(Boolean).sort(sortByDateDesc).slice(0, 50);
}

async function scanUpscWhatsNew(source, env) {
  const html = await fetchText(source.url, env);
  const anchors = extractAnchors(html, source.url);
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
  const html = await fetchText(source.url, env);
  const anchors = extractAnchors(html, source.url);
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
  const html = await fetchText(source.url, env);
  const anchors = extractAnchors(html, source.url);
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

function extractAnchors(html, baseUrl) {
  const anchors = [];
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1].match(/\bhref=["']([^"']+)["']/i)?.[1];
    const url = absolutize(href, baseUrl);
    if (!url) continue;
    anchors.push({ url, title: cleanText(match[2]) });
  }
  return anchors;
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

async function dispatchToGitHub(env, detections) {
  if (!env.GITHUB_DISPATCH_TOKEN || !env.GITHUB_REPO) return;

  const eventType = detections.every(isSchemeDetection)
    ? "cloudflare_scheme_batch"
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
  const scheme = detections.filter(isSchemeDetection);
  const exam = detections.filter(detection => !isSchemeDetection(detection));
  if (scheme.length > 0) await dispatchToGitHub(env, scheme);
  if (exam.length > 0) await dispatchToGitHub(env, exam);
}

function isSchemeDetection(detection) {
  if (!["pib", "rbi-notifications"].includes(detection.sourceId)) return false;
  const category = classifyOpportunity(`${detection.title} ${detection.url}`.toLowerCase());
  return ["scheme", "policy-change", "digital-service"].includes(category);
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

async function fetchText(url, env) {
  const fixture = readFixture(url, env);
  if (fixture !== null) return fixture;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 CitizenNest-Monitor/1.0",
      "Accept": "text/html,application/xhtml+xml,application/xml,text/xml,*/*",
      "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      "Referer": "https://www.citizennest.com/"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.text();
}

async function fetchJson(url, env) {
  const fixture = readFixture(url, env);
  if (fixture !== null) return JSON.parse(fixture);
  const response = await fetch(url, {
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
