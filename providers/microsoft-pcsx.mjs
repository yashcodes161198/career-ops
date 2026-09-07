// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// Microsoft PCSX provider — hits the public Candidate Experience search API on
// apply.careers.microsoft.com. This is Eightfold-backed but uses a custom host
// and `/api/pcsx/*` endpoints, not the standard *.eightfold.ai `/api/apply/v2/jobs`
// shape handled by providers/eightfold.mjs.
//
// Search (GET, zero-auth):
//   https://apply.careers.microsoft.com/api/pcsx/search
//     ?domain=microsoft.com&start=<n>&num=<n>[&query=<text>][&location=<text>]
//   Response: { status, data: { positions: [...], count: <total> } }
//
// Page size is server-capped at 10 regardless of `num`.

import { BROWSER_LIKE_USER_AGENT, fetchJsonWithRetry } from './_http.mjs';

const ALLOWED_HOSTS = new Set(['apply.careers.microsoft.com']);
const ORIGIN = 'https://apply.careers.microsoft.com';

const PAGE_SIZE = 10;
const DEFAULT_MAX_PAGES = 200;
const MAX_PAGES_CAP = 500;
const RETRY_POLICY = { retries: 3, baseDelayMs: 500, maxDelayMs: 8_000 };
const INTER_PAGE_DELAY_MS = 250;

/** @param {string} url */
function assertMicrosoftPcsxUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`microsoft-pcsx: invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`microsoft-pcsx: URL must use HTTPS: ${url}`);
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(`microsoft-pcsx: untrusted hostname "${parsed.hostname}" — must be apply.careers.microsoft.com`);
  }
  return url;
}

/**
 * @param {import('./_types.js').PortalEntry & {domain?: string, microsoft_pcsx?: {query?: string, location?: string}}} entry
 * @returns {{domain: string, query: (string|null), location: (string|null)}|null}
 */
export function resolveConfig(entry) {
  const domain = (typeof entry?.domain === 'string' && entry.domain.trim())
    ? entry.domain.trim()
    : (typeof entry?.microsoft_pcsx?.domain === 'string' && entry.microsoft_pcsx.domain.trim()
      ? entry.microsoft_pcsx.domain.trim()
      : 'microsoft.com');

  const query = typeof entry?.microsoft_pcsx?.query === 'string' && entry.microsoft_pcsx.query.trim()
    ? entry.microsoft_pcsx.query.trim()
    : null;
  const location = typeof entry?.microsoft_pcsx?.location === 'string' && entry.microsoft_pcsx.location.trim()
    ? entry.microsoft_pcsx.location.trim()
    : null;

  return { domain, query, location };
}

/**
 * @param {{domain: string, query?: (string|null), location?: (string|null)}} cfg
 * @param {number} start
 * @param {number} num
 * @returns {string}
 */
export function buildSearchUrl(cfg, start = 0, num = PAGE_SIZE) {
  const params = new URLSearchParams();
  params.set('domain', cfg.domain);
  params.set('start', String(start));
  params.set('num', String(num));
  if (cfg.query) params.set('query', cfg.query);
  if (cfg.location) params.set('location', cfg.location);
  return `${ORIGIN}/api/pcsx/search?${params.toString()}`;
}

/**
 * @param {unknown} ts
 * @returns {number|undefined}
 */
function epochSecondsToMs(ts) {
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 1000);
}

/**
 * @param {unknown} json
 * @param {string} companyName
 * @returns {Array<{title: string, url: string, company: string, location: string, postedAt?: number}>}
 */
export function parseMicrosoftPcsxResponse(json, companyName) {
  const positions = json?.data?.positions;
  if (!Array.isArray(positions)) return [];

  const out = [];
  for (const p of positions) {
    if (!p || typeof p !== 'object') continue;
    const title = typeof p.name === 'string' ? p.name.trim() : '';
    if (!title) continue;

    const id = p.id != null ? `${p.id}`.trim() : '';
    let url = '';
    if (typeof p.positionUrl === 'string' && p.positionUrl.trim()) {
      try {
        url = new URL(p.positionUrl, ORIGIN).href;
      } catch {
        url = '';
      }
    }
    if (!url && id) url = `${ORIGIN}/careers/job/${id}`;
    if (!url) continue;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') continue;
    } catch {
      continue;
    }

    const locParts = [];
    if (Array.isArray(p.locations)) {
      for (const loc of p.locations) {
        if (typeof loc === 'string' && loc.trim()) locParts.push(loc.trim());
      }
    }
    if (Array.isArray(p.standardizedLocations)) {
      for (const loc of p.standardizedLocations) {
        if (typeof loc === 'string' && loc.trim()) locParts.push(loc.trim());
      }
    }

    /** @type {{title: string, url: string, company: string, location: string, postedAt?: number}} */
    const job = {
      title,
      url,
      company: companyName,
      location: [...new Set(locParts)].join(' · '),
    };
    const postedAt = epochSecondsToMs(p.postedTs) ?? epochSecondsToMs(p.creationTs);
    if (postedAt !== undefined) job.postedAt = postedAt;
    out.push(job);
  }
  return out;
}

/** @param {any} entry @param {any} ctx */
function resolveMaxPages(entry, ctx) {
  const v = entry?.max_pages;
  const fromEntry = Number.isInteger(v) && v > 0 ? Math.min(v, MAX_PAGES_CAP) : DEFAULT_MAX_PAGES;
  const hint = Number(ctx?.maxPages);
  return Number.isFinite(hint) && hint > 0 ? Math.min(fromEntry, Math.floor(hint)) : fromEntry;
}

function sleep(ms, ctx) {
  if (typeof ctx?.sleep === 'function') return ctx.sleep(ms);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @type {Provider} */
export default {
  id: 'microsoft-pcsx',

  detect(entry) {
    const hasTrustedHost = [entry?.api, entry?.careers_url].some((raw) => {
      if (typeof raw !== 'string' || !raw) return false;
      try {
        return new URL(raw).protocol === 'https:' && ALLOWED_HOSTS.has(new URL(raw).hostname);
      } catch {
        return false;
      }
    });
    if (entry?.provider === 'microsoft-pcsx' && !hasTrustedHost) return null;

    if (entry?.provider === 'microsoft-pcsx' || hasTrustedHost) {
      const cfg = resolveConfig(entry);
      return cfg ? { url: buildSearchUrl(cfg, 0, PAGE_SIZE) } : null;
    }
    for (const raw of [entry?.api, entry?.careers_url]) {
      if (typeof raw !== 'string' || !raw) continue;
      try {
        const parsed = new URL(raw);
        if (parsed.protocol !== 'https:') continue;
        if (!ALLOWED_HOSTS.has(parsed.hostname)) continue;
        const cfg = resolveConfig(entry);
        return cfg ? { url: buildSearchUrl(cfg, 0, PAGE_SIZE) } : null;
      } catch {
        continue;
      }
    }
    return null;
  },

  async fetch(entry, ctx) {
    const cfg = resolveConfig(entry);
    if (!cfg) throw new Error(`microsoft-pcsx: cannot derive search config for ${entry.name}`);

    const maxPages = resolveMaxPages(entry, ctx);
    const all = [];
    /** @type {number|null} */
    let total = null;

    for (let page = 0; page < maxPages; page++) {
      const start = page * PAGE_SIZE;
      const apiUrl = buildSearchUrl(cfg, start, PAGE_SIZE);
      assertMicrosoftPcsxUrl(apiUrl);
      if (page > 0) await sleep(INTER_PAGE_DELAY_MS, ctx);

      const json = /** @type {any} */ (await fetchJsonWithRetry(
        /** @type {any} */ (ctx),
        apiUrl,
        {
          redirect: 'error',
          headers: { 'User-Agent': BROWSER_LIKE_USER_AGENT, Accept: 'application/json' },
        },
        RETRY_POLICY,
      ));

      all.push(...parseMicrosoftPcsxResponse(json, entry.name));

      const positions = Array.isArray(json?.data?.positions) ? json.data.positions : [];
      if (total === null && typeof json?.data?.count === 'number' && Number.isFinite(json.data.count)) {
        total = json.data.count;
      }

      if (positions.length === 0 || positions.length < PAGE_SIZE) break;
      if (total !== null && start + PAGE_SIZE >= total) break;
    }

    if (total !== null && all.length < total && maxPages * PAGE_SIZE < total) {
      console.error(`⚠️  microsoft-pcsx: ${entry.name} truncated at max_pages=${maxPages} (${all.length} of ${total} jobs) — raise max_pages on this entry for more`);
    }

    return all;
  },
};
