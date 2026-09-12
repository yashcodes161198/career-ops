#!/usr/bin/env node
import { chromium } from 'playwright-core';

const URL = process.argv[2];
if (!URL) {
  console.error('Usage: node batch/inspect-greenhouse-form.mjs <url>');
  process.exit(1);
}

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}
const page = await (await browser.newContext()).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const labels = await page.locator('label').allTextContents();
const textboxes = await page.getByRole('textbox').evaluateAll((els) =>
  els.map((el) => el.getAttribute('aria-label') || el.name || el.id).filter(Boolean),
);
const combos = await page.getByRole('combobox').evaluateAll((els) =>
  els.map((el) => el.getAttribute('aria-label') || el.name || el.id).filter(Boolean),
);
console.log(JSON.stringify({ url: page.url(), labels: labels.filter((t) => t.trim()).slice(0, 40), textboxes, combos }, null, 2));
await browser.close();
