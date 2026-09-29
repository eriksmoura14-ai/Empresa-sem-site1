import dns from 'node:dns/promises';

const COMMON_TLDS = ['com', 'ca', 'net', 'org'];

function slugify(value) {
  return value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function domainCandidates(name, city = '') {
  const words = slugify(name).split(' ').filter(Boolean);
  const compact = words.join('');
  const hyphenated = words.join('-');
  const citySlug = slugify(city).replace(/\s+/g, '');

  const bases = new Set([compact, hyphenated]);

  if (citySlug) {
    bases.add(`${compact}${citySlug}`);
    bases.add(`${hyphenated}-${citySlug}`);
  }

  return [...bases].flatMap(base =>
    COMMON_TLDS.map(tld => `${base}.${tld}`)
  );
}

async function dnsExists(domain) {
  try {
    const records = await dns.lookup(domain, { all: true });
    return records.length > 0;
  } catch {
    return false;
  }
}

async function checkHttp(domain) {
  for (const protocol of ['https', 'http']) {
    const url = `${protocol}://${domain}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'ProspectAI/0.1 website verifier'
        }
      });

      clearTimeout(timer);

      const contentType =
        response.headers.get('content-type') || '';

      const text = contentType.includes('text/html')
        ? (await response.text()).slice(0, 50000)
        : '';

      return {
        url: response.url,
        status: response.status,
        ok: response.ok,
        contentType,
        title:
          (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
            .trim()
      };
    } catch {}
  }

  return null;
}

export async function verifyBusiness({
  name,
  city,
  knownDomains = []
}) {
  const candidates = [
    ...new Set([
      ...knownDomains,
      ...domainCandidates(name, city)
    ])
  ];

  const checks = [];

  for (const domain of candidates) {
    const dns = await dnsExists(domain);

    if (!dns) continue;

    const http = await checkHttp(domain);

    checks.push({
      domain,
      dns: true,
      http
    });
  }

  if (checks.some(x => x.http?.ok)) {
    const live = checks.find(x => x.http?.ok);

    return {
      status: 'WEBSITE_FOUND',
      confidence: 0.99,
      domain: live.domain,
      website: live.http.url,
      evidence: checks
    };
  }

  if (checks.length) {
    return {
      status: 'UNCERTAIN',
      confidence: 0.55,
      domain: checks[0].domain,
      website: null,
      evidence: checks
    };
  }

  return {
    status: 'NO_DOMAIN_FOUND',
    confidence: 0.72,
    domain: null,
    website: null,
    evidence: []
  };
}
