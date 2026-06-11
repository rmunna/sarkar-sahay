import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import type { SchemeRecord } from "./schemes";

// Server-only filesystem loaders for the scheme database. Kept separate from
// schemes.ts so the pure matcher/types there stay importable by client
// components without pulling `fs` into the client bundle.

const DATA_DIR = () => path.join(process.cwd(), "data", "schemes");

let _all: SchemeRecord[] | null = null;

export function getAllSchemes(): SchemeRecord[] {
  if (!_all) {
    const dir = DATA_DIR();
    if (!existsSync(dir)) return (_all = []);
    _all = readdirSync(dir)
      .filter(f => f.endsWith(".json") && f !== "index.json")
      .flatMap(f => JSON.parse(readFileSync(path.join(dir, f), "utf-8")) as SchemeRecord[]);
  }
  return _all;
}

export function getSchemeStates(): string[] {
  const states = new Set<string>();
  for (const s of getAllSchemes()) if (s.state) states.add(s.state);
  return [...states].sort();
}
