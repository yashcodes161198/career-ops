// tests/providers/microsoft-pcsx.test.mjs
import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — microsoft-pcsx');

try {
  const mod = await import(pathToFileURL(join(ROOT, 'providers/microsoft-pcsx.mjs')).href);
  const provider = mod.default;
  const { resolveConfig, buildSearchUrl, parseMicrosoftPcsxResponse } = mod;

  if (provider.id === 'microsoft-pcsx') pass('microsoft-pcsx.id is "microsoft-pcsx"');
  else fail(`microsoft-pcsx.id is ${JSON.stringify(provider.id)}`);

  const hit = provider.detect({
    name: 'Microsoft',
    provider: 'microsoft-pcsx',
    careers_url: 'https://apply.careers.microsoft.com/careers',
    domain: 'microsoft.com',
  });
  if (hit?.url?.startsWith('https://apply.careers.microsoft.com/api/pcsx/search?')) {
    pass('microsoft-pcsx.detect() resolves branded careers host to PCSX search API');
  } else {
    fail(`microsoft-pcsx.detect() returned ${JSON.stringify(hit)}`);
  }

  if (provider.detect({ name: 'Evil', provider: 'microsoft-pcsx', careers_url: 'https://evil.example/jobs' }) === null) {
    pass('microsoft-pcsx.detect() rejects untrusted careers host');
  } else {
    fail('microsoft-pcsx.detect() must reject untrusted host');
  }

  const cfg = resolveConfig({ name: 'Microsoft', domain: 'microsoft.com', microsoft_pcsx: { query: 'backend', location: 'India' } });
  const url = buildSearchUrl(cfg, 20, 10);
  if (url.includes('start=20') && url.includes('num=10') && url.includes('query=backend') && url.includes('location=India')) {
    pass('buildSearchUrl() encodes pagination and optional filters');
  } else {
    fail(`buildSearchUrl() returned ${url}`);
  }

  const jobs = parseMicrosoftPcsxResponse({
    data: {
      positions: [{
        id: 1970393556984391,
        name: 'Senior Software Engineer - Backend',
        locations: ['India, Telangana, Hyderabad'],
        standardizedLocations: ['Hyderabad, TS, IN'],
        postedTs: 1788511121,
        positionUrl: '/careers/job/1970393556984391',
      }],
    },
  }, 'Microsoft');

  if (jobs.length === 1
      && jobs[0].title === 'Senior Software Engineer - Backend'
      && jobs[0].url === 'https://apply.careers.microsoft.com/careers/job/1970393556984391'
      && jobs[0].location.includes('Hyderabad')
      && typeof jobs[0].postedAt === 'number') {
    pass('parseMicrosoftPcsxResponse() normalizes title, url, location, postedAt');
  } else {
    fail(`parseMicrosoftPcsxResponse() returned ${JSON.stringify(jobs)}`);
  }

  if (parseMicrosoftPcsxResponse(null, 'Microsoft').length === 0
      && parseMicrosoftPcsxResponse({ data: { positions: [{ id: 1 }] } }, 'Microsoft').length === 0) {
    pass('parseMicrosoftPcsxResponse() drops malformed rows');
  } else {
    fail('parseMicrosoftPcsxResponse() should drop malformed rows');
  }

  console.log('\nAll microsoft-pcsx provider tests passed.');
} catch (err) {
  fail(`microsoft-pcsx provider tests threw: ${err.message}`);
  process.exitCode = 1;
}
