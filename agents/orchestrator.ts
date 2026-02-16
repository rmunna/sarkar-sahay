/**
 * SarkarSahay Content Pipeline — Topic List Manager
 * 
 * This file defines the topics to process and the content schema.
 * The actual pipeline runs via OpenClaw sessions_spawn from the main agent (Midas).
 * 
 * The orchestrator is Midas itself — calling sessions_spawn for each pipeline stage.
 */

// High-traffic topics for initial content generation
export const INITIAL_TOPICS = [
  // Identity Documents
  "How to apply for PAN card online",
  "How to apply for Voter ID card online",
  "How to apply for Passport online",
  "How to apply for Driving License online",

  // Government Schemes
  "PM Jan Dhan Yojana — how to open account",
  "PM Kisan Samman Nidhi — registration and eligibility",
  "Ayushman Bharat health card — how to apply",
  "Sukanya Samriddhi Yojana — how to open account",

  // Ration & Food
  "How to apply for new Ration Card online",
  "How to add name to existing Ration Card",

  // Tax & Finance
  "How to file Income Tax Return (ITR) online",
  "How to link Aadhaar with PAN card",

  // Education & Jobs
  "How to check SSC exam results and download hall ticket",
  "How to apply for government jobs on SSC portal",

  // Property & Legal
  "How to get Caste Certificate online",
  "How to get Income Certificate online",
  "How to get Domicile Certificate online",

  // Utilities
  "How to apply for new electricity connection online",
  "How to apply for new water connection",
  "How to register property online in India",
];

// Content schema for guides
export interface GuideSchema {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  lastUpdated: string;
  readingTime: string;
  officialLinks: string[];
  content: string; // markdown body
}
