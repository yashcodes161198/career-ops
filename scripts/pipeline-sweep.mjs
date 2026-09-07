#!/usr/bin/env node
/**
 * Apply liveness sweep results + location-based pre-screen to data/pipeline.md
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PIPELINE = join(ROOT, 'data', 'pipeline.md');
const DISCARD = join(ROOT, 'data', 'discard.log');
const LIVENESS = process.argv[2] || '/tmp/liveness-results.txt';

const US_GEO = /\b(remote[,\s-]*(?:usa|us\b)|united states|san diego|california,\s*united states|remote,\s*canada(?:\s*;\s*remote,\s*united states)?|remote,\s*united kingdom|remote,\s*poland|remote,\s*israel|us-ca-remote|us-remote|us-wa-remote|finland-remote|sweden-remote)\b/i;
const INDIA_OK = /\b(india|hyderabad|bengaluru|bangalore|chennai|mumbai|pune|noida|delhi|kolkata|work from home,\s*india|anywhere in the world)\b/i;
const FIRMWARE_MISMATCH = /firmware|ufs validation|c and c\+\+/i;

function ts() {
  return new Date().toISOString();
}

function logDiscard(url, reason) {
  appendFileSync(DISCARD, `${ts()}\t${url}\t${reason}\n`);
}

function parseExpired(text) {
  const urls = [];
  for (const line of text.split('\n')) {
    const m = line.match(/❌\s+expired\s+(https?:\/\/\S+)/);
    if (m) urls.push(m[1]);
  }
  return urls;
}

function parseLine(line) {
  const m = line.match(/^- \[ \]\s+(https?:\/\/\S+)(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?/);
  if (!m) return null;
  return { url: m[1], company: (m[2] || '').trim(), role: (m[3] || '').trim(), location: (m[4] || '').trim(), raw: line };
}

function prescreenReason(entry) {
  const loc = entry.location;
  const role = entry.role;
  if (loc && US_GEO.test(loc) && !INDIA_OK.test(loc)) {
    return `pre-screen mismatch: location restricts hiring outside India (${loc})`;
  }
  if (FIRMWARE_MISMATCH.test(role)) {
    return 'pre-screen mismatch: firmware/embedded C++ role outside backend/full-stack target';
  }
  if (/senior manager/i.test(role) && !INDIA_OK.test(loc)) {
    return `pre-screen mismatch: management role with non-India location (${loc})`;
  }
  return null;
}

const livenessText = readFileSync(LIVENESS, 'utf-8');
const expiredUrls = new Set(parseExpired(livenessText));

let lines = readFileSync(PIPELINE, 'utf-8').split('\n');
const processed = [];
let expiredCount = 0;
let skipCount = 0;

const newLines = lines.map((line) => {
  if (!line.trim().startsWith('- [ ]')) return line;
  const entry = parseLine(line);
  if (!entry) return line;

  if (expiredUrls.has(entry.url)) {
    expiredCount++;
    const label = entry.company && entry.role ? `${entry.url} | ${entry.company} | ${entry.role}` : entry.url;
    processed.push({ type: 'expired', entry, line: `- [x] ~~${label}~~ — posting expired (liveness sweep)` });
    return processed[processed.length - 1].line;
  }

  const reason = prescreenReason(entry);
  if (reason) {
    skipCount++;
    logDiscard(entry.url, reason);
    const label = entry.company && entry.role ? `${entry.url} | ${entry.company} | ${entry.role}` : entry.url;
    processed.push({ type: 'skip', entry, reason });
    return `- [x] #-- | ${label} | skipped (${reason})`;
  }

  return line;
});

writeFileSync(PIPELINE, newLines.join('\n'), 'utf-8');

const pending = newLines.filter((l) => l.trim().startsWith('- [ ]')).length;
console.log(JSON.stringify({ expiredCount, skipCount, pending, processed: processed.length }, null, 2));
