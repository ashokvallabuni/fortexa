#!/usr/bin/env node

const TIMEOUT_MS = Number(process.env.ROUTE_TEST_TIMEOUT_MS || 2000);
const productionBaseUrl = process.env.ROUTE_TEST_PRODUCTION_URL;
const baseUrls = [
  process.env.ROUTE_TEST_LOCAL_URL || 'http://localhost:3000',
  ...(productionBaseUrl ? [productionBaseUrl] : []),
];

const checks = [
  {
    path: '/',
    label: 'public home',
    expectedStatuses: [200],
  },
  {
    path: '/auth/callback',
    label: 'callback without code',
    expectedStatuses: [302, 303, 307, 308],
    expectedLocation: '/login',
  },
  {
    path: '/auth/callback?error=access_denied&error_description=User+denied',
    label: 'callback OAuth denial',
    expectedStatuses: [302, 303, 307, 308],
    expectedLocation: '/login',
  },
  {
    path: '/dashboard',
    label: 'protected dashboard',
    expectedStatuses: [302, 303, 307, 308],
    expectedLocation: '/login',
  },
];

function normalizeBaseUrl(value) {
  return new URL(value).toString().replace(/\/$/, '');
}

function locationPath(location, baseUrl) {
  if (!location) return null;
  try {
    return new URL(location, baseUrl).pathname;
  } catch {
    return location.split('?')[0];
  }
}

async function checkUrl(baseUrl, check) {
  const url = new URL(check.path, `${baseUrl}/`);
  const startedAt = performance.now();
  let response;

  try {
    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'text/html' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${check.label} ${url}: request failed (${message})`);
  }

  const durationMs = Math.round(performance.now() - startedAt);
  const location = response.headers.get('location');
  const failures = [];

  if (response.status >= 500) {
    failures.push(`unexpected HTTP ${response.status}`);
  }
  if (!check.expectedStatuses.includes(response.status)) {
    failures.push(`expected HTTP ${check.expectedStatuses.join('/')} but received ${response.status}`);
  }
  if (durationMs >= TIMEOUT_MS) {
    failures.push(`response took ${durationMs}ms (limit ${TIMEOUT_MS}ms)`);
  }
  if (check.expectedLocation && locationPath(location, baseUrl) !== check.expectedLocation) {
    failures.push(`expected Location ${check.expectedLocation} but received ${location || '<missing>'}`);
  }

  const result = `${check.label}: HTTP ${response.status} in ${durationMs}ms${location ? ` -> ${location}` : ''}`;
  if (failures.length) {
    throw new Error(`${result}\n  ${failures.join('\n  ')}`);
  }

  console.log(`PASS ${result}`);
}

async function main() {
  if (productionBaseUrl && productionBaseUrl.includes('yourdomain.com')) {
    throw new Error('ROUTE_TEST_PRODUCTION_URL still points to the placeholder yourdomain.com');
  }

  const failures = [];
  for (const rawBaseUrl of baseUrls) {
    let baseUrl;
    try {
      baseUrl = normalizeBaseUrl(rawBaseUrl);
    } catch {
      failures.push(`invalid base URL: ${rawBaseUrl}`);
      continue;
    }

    console.log(`\nChecking ${baseUrl}`);
    for (const check of checks) {
      try {
        await checkUrl(baseUrl, check);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
        console.error(`FAIL ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} route check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAll route checks passed.');
}

await main();
