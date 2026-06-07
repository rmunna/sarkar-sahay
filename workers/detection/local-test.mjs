import worker from "./index.mjs";

class MemoryKV {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    return this.map.get(key) || null;
  }
  async put(key, value) {
    this.map.set(key, value);
  }
}

const source = process.argv.find(arg => arg.startsWith("--source="))?.split("=")[1] || "nta";
const tier = process.argv.find(arg => arg.startsWith("--tier="))?.split("=")[1] || "1";
const twice = process.argv.includes("--twice");
const kv = new MemoryKV();

async function runScan({ dryRun }) {
  const url = new URL("https://local.test/scan");
  url.searchParams.set("dryRun", dryRun ? "1" : "0");
  url.searchParams.set("tier", tier);
  if (source !== "all") url.searchParams.set("source", source);
  const request = new Request(url, {
    headers: dryRun ? {} : { Authorization: "Bearer local-test" }
  });
  const response = await worker.fetch(request, {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test"
  });
  return response.text();
}

if (twice) {
  console.log("=== pass 1: baseline ===");
  console.log(await runScan({ dryRun: false }));
  console.log("=== pass 2: should be zero new detections ===");
  console.log(await runScan({ dryRun: false }));
} else {
  console.log(await runScan({ dryRun: true }));
}
