#!/usr/bin/env node
/**
 * Portable smoke test — works against any website or web app.
 *
 * Zero dependencies (Node 18+). Optional console-error checks run when
 * Playwright is installed; otherwise they are skipped.
 *
 * Usage:
 *   node scripts/smoke.mjs [options]
 *
 * Options:
 *   --config <path>    Config file (default: smoke.config.json)
 *   --base-url <url>   Override the configured base URL
 *   --no-browser       Skip Playwright console checks
 *   -h, --help         Show help
 *
 * Config shape (smoke.config.json):
 * {
 *   "baseUrl": "http://localhost:3000",
 *   "budgetMs": 3000,
 *   "checkConsole": true,
 *   "ignoreConsole": ["/_vercel/"],
 *   "pages": [
 *     { "path": "/", "title": "My App" },
 *     { "path": "/login", "expect": "password", "status": 200 },
 *     { "path": "/private", "redirect": "manual", "status": [302, 307] },
 *     { "url": "https://external.example.com/health", "status": 200 }
 *   ]
 * }
 */

import fs from 'node:fs';
import process from 'node:process';

const DEFAULT_BUDGET_MS = 3000;
const NAV_TIMEOUT_MS = 15_000;

const HELP = `Portable smoke test

Usage: node scripts/smoke.mjs [--config <file>] [--base-url <url>] [--no-browser]

Checks per page: HTTP status, response-time budget, <title>/content assertions.
If Playwright is installed, also fails on console errors and uncaught page errors.`;

function fail(message) {
  console.error(`smoke: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { config: 'smoke.config.json', baseUrl: null, browser: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      opts.help = true;
    } else if (arg === '--no-browser') {
      opts.browser = false;
    } else if (arg === '--config' || arg === '--base-url') {
      const value = argv[++i];
      if (!value) fail(`${arg} requires a value`);
      if (arg === '--config') opts.config = value;
      else opts.baseUrl = value;
    } else {
      fail(`unknown argument: ${arg} (see --help)`);
    }
  }
  return opts;
}

function loadConfig(opts) {
  const hasConfig = fs.existsSync(opts.config);

  if (!hasConfig && !opts.baseUrl) {
    fail(`config file not found: ${opts.config} (pass --base-url or --config)`);
  }

  let config = {};
  if (hasConfig) {
    try {
      config = JSON.parse(fs.readFileSync(opts.config, 'utf8'));
    } catch (error) {
      fail(`cannot parse ${opts.config}: ${error.message}`);
    }
  }

  const baseUrl = (opts.baseUrl ?? config.baseUrl ?? '').replace(/\/+$/, '');
  if (!baseUrl) fail('no base URL configured (set baseUrl or pass --base-url)');
  if (!Array.isArray(config.pages) || config.pages.length === 0) {
    config.pages = [{ path: '/' }];
  }

  return {
    baseUrl,
    budgetMs: config.budgetMs ?? DEFAULT_BUDGET_MS,
    checkConsole: config.checkConsole !== false,
    ignoreConsole: config.ignoreConsole ?? [],
    pages: config.pages,
  };
}

function pageUrl(page, baseUrl) {
  if (page.url) return page.url;
  if (!page.path) fail('each page needs a "path" or "url"');
  return baseUrl + (page.path.startsWith('/') ? page.path : `/${page.path}`);
}

function pageName(page) {
  return page.path ?? page.url;
}

function matchStatus(actual, expected) {
  if (expected == null) return actual >= 200 && actual < 400;
  if (Array.isArray(expected)) return expected.includes(actual);
  return actual === expected;
}

function extractTitle(html) {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return match ? match[1].trim() : null;
}

async function checkPage(page, config, baseUrl) {
  const url = pageUrl(page, baseUrl);
  const expectedBudget = page.budgetMs ?? config.budgetMs;
  const failures = [];
  const notes = [];

  let status = 0;
  let elapsed = 0;
  let body = null;
  const needsBody = Boolean(page.title || page.expect);

  try {
    const started = Date.now();
    const response = await fetch(url, {
      redirect: page.redirect === 'manual' ? 'manual' : 'follow',
      headers: { 'user-agent': 'smoke-script/1.0' },
      signal: AbortSignal.timeout(NAV_TIMEOUT_MS),
    });
    elapsed = Date.now() - started;
    status = response.status;
    if (needsBody) body = await response.text();
  } catch (error) {
    return { name: pageName(page), url, failures: [`request failed: ${error.message}`], notes };
  }

  if (!matchStatus(status, page.status)) {
    const expected = page.status == null ? '2xx/3xx' : JSON.stringify(page.status);
    failures.push(`status ${status} (expected ${expected})`);
  }

  if (elapsed > expectedBudget) {
    failures.push(`${elapsed}ms over budget of ${expectedBudget}ms`);
  }

  if (page.title) {
    const actualTitle = body === null ? null : extractTitle(body);
    if (!actualTitle || !actualTitle.toLowerCase().includes(String(page.title).toLowerCase())) {
      failures.push(`title "${actualTitle ?? '(none)'}" does not contain "${page.title}"`);
    } else {
      notes.push('title ok');
    }
  }

  if (page.expect && !body.toLowerCase().includes(String(page.expect).toLowerCase())) {
    failures.push(`body does not contain "${page.expect}"`);
  } else if (page.expect) {
    notes.push(`content ok`);
  }

  return { name: pageName(page), url, status, elapsed, failures, notes };
}

async function loadChromium() {
  for (const id of ['@playwright/test', 'playwright']) {
    try {
      const mod = await import(id);
      if (mod.chromium && typeof mod.chromium.launch === 'function') return mod.chromium;
    } catch {
      // not installed — try next
    }
  }
  return null;
}

function isIgnored(message, patterns) {
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(message);
    } catch {
      return message.includes(pattern);
    }
  });
}

async function checkConsole(pageConfig, config, baseUrl, chromium) {
  const url = pageUrl(pageConfig, config.baseUrl || baseUrl);
  const failures = [];
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const messages = [];
    page.on('console', (message) => {
      if (message.type() === 'error') messages.push(message.text());
    });
    page.on('pageerror', (error) => messages.push(String(error)));

    await page.goto(url, {
      waitUntil: pageConfig.waitUntil ?? 'load',
      timeout: NAV_TIMEOUT_MS,
    });
    // allow late client-side errors (hydration, delayed fetches) to surface
    await page.waitForTimeout(500);

    const relevant = messages.filter((message) => !isIgnored(message, config.ignoreConsole));
    for (const message of relevant) failures.push(`console error: ${message}`);
    await context.close();
  } catch (error) {
    failures.push(`browser check failed: ${error.message}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  return failures;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }

  const config = loadConfig(opts);
  const useBrowser = opts.browser && config.checkConsole;

  let chromium = null;
  if (useBrowser) {
    chromium = await loadChromium();
    if (!chromium) {
      console.log('smoke: Playwright not installed — skipping console error checks\n');
    }
  }

  console.log(`Smoke test → ${config.baseUrl}\n`);

  let failedPages = 0;
  let totalPages = 0;

  for (const pageConfig of config.pages) {
    totalPages += 1;
    const result = await checkPage(pageConfig, config, config.baseUrl);

    if (chromium && result.failures.length === 0) {
      const consoleFailures = await checkConsole(pageConfig, config, config.baseUrl, chromium);
      result.failures.push(...consoleFailures);
      if (consoleFailures.length === 0) result.notes.push('console clean');
    }

    const ok = result.failures.length === 0;
    if (!ok) failedPages += 1;

    const status = result.status ? String(result.status) : '-';
    const timing = result.elapsed != null ? `${result.elapsed}ms` : '-';
    console.log(
      `  ${ok ? '✓' : '✗'} GET ${result.name}`.padEnd(42) +
        `${status}`.padStart(5) +
        `  ${timing.padStart(7)}  ${result.notes.join(', ')}`,
    );
    for (const failure of result.failures) {
      console.log(`      → ${failure}`);
    }
  }

  const browserNote = chromium ? 'browser: chromium' : 'browser: skipped';
  console.log(
    `\n${totalPages} page${totalPages === 1 ? '' : 's'} checked, ${failedPages} failed (${browserNote})`,
  );

  if (failedPages > 0) process.exit(1);
}

main().catch((error) => fail(error.stack || String(error)));
