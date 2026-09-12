#!/usr/bin/env node
/** Prefill Okta #8185311 Greenhouse application in headed Google Chrome. Never submits unless --submit. */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'fs';

const START_URL =
  process.argv.find((a) => a.startsWith('http')) ||
  'https://job-boards.greenhouse.io/okta/jobs/8185311';
const CV = 'C:\\Users\\yash\\Desktop\\Code\\career-ops\\Resume\\Yash_Resume.pdf';
const SUBMIT = process.argv.includes('--submit');

if (!existsSync(CV)) {
  console.error('Resume not found:', CV);
  process.exit(1);
}
mkdirSync('output', { recursive: true });

async function pickCombobox(page, labelRe, optionText) {
  const combo = page.getByRole('combobox', { name: labelRe }).first();
  if (!(await combo.count())) return false;
  await combo.scrollIntoViewIfNeeded();
  await combo.click({ timeout: 15000 });
  await page.waitForTimeout(400);
  const esc = optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opt = page.getByRole('option', { name: new RegExp(`^\\s*${esc}\\s*$`, 'i') }).first();
  if (await opt.count()) {
    await opt.click({ timeout: 8000 });
    return true;
  }
  await page
    .locator('[class*="select__option"], [role="option"]')
    .filter({ hasText: new RegExp(esc, 'i') })
    .first()
    .click({ timeout: 8000 });
  return true;
}

async function pickComboboxSafe(page, labelRe, optionText) {
  try {
    return await pickCombobox(page, labelRe, optionText);
  } catch (err) {
    console.warn(`Skipped dropdown ${labelRe}: ${err.message.split('\n')[0]}`);
    return false;
  }
}

async function fillLabel(page, labelRe, value) {
  const input = page.getByRole('textbox', { name: labelRe }).first();
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill(value);
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      args: ['--window-size=1400,900'],
    });
  } catch (err) {
    console.warn('Chrome channel unavailable, falling back to bundled Chromium:', err.message);
    browser = await chromium.launch({ headless: false, args: ['--window-size=1400,900'] });
  }

  const page = await (await browser.newContext()).newPage();
  await page.goto(START_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.getByRole('textbox', { name: /^First Name/i }).waitFor({ state: 'visible', timeout: 60000 });

  await fillLabel(page, /^First Name/i, 'Yash');
  await fillLabel(page, /^Last Name/i, 'Yash');
  await fillLabel(page, /^Email/i, 'yashk.code@gmail.com');
  await fillLabel(page, /^Phone/i, '+91 9113358078');

  await pickComboboxSafe(page, /Country/i, 'India');

  await page.locator('input[type="file"]').first().setInputFiles(CV);

  await fillLabel(page, /LinkedIn Profile/i, 'https://linkedin.com/in/yash-5a56a4234');
  const website = page.getByRole('textbox', { name: /^Website/i });
  if (await website.count()) {
    await website.fill('https://github.com/yashcodes161198');
  }

  await pickComboboxSafe(page, /legally authorized to work in the country you reside/i, 'Yes');
  await pickComboboxSafe(page, /require Visa Sponsorship/i, 'No');
  await pickComboboxSafe(page, /family members.*Okta/i, 'No');
  await pickComboboxSafe(page, /outside business activity/i, 'No');
  await pickComboboxSafe(page, /employed by Okta/i, 'No');

  const acknowledge = page.getByRole('checkbox', { name: /I acknowledge/i });
  if (await acknowledge.count()) {
    await acknowledge.check();
  }

  const checks = {
    first: await page.getByRole('textbox', { name: /^First Name/i }).inputValue(),
    email: await page.getByRole('textbox', { name: /^Email/i }).inputValue(),
    resumeFiles: await page
      .locator('input[type="file"]')
      .first()
      .evaluate((el) => el.files?.length ?? 0)
      .catch(() => 0),
    url: page.url(),
  };
  console.log('Verification:', checks);
  await page.screenshot({ path: 'output/okta-8185311-prefill.png', fullPage: true });

  if (!checks.first || !checks.email || !checks.resumeFiles) {
    console.error('Required fields missing — not submitting.');
    await page.waitForTimeout(5 * 60 * 1000).catch(() => {});
    await browser.close().catch(() => {});
    process.exit(1);
  }

  if (SUBMIT) {
    await page.getByRole('button', { name: /Submit application/i }).click({ timeout: 15000 });
    await page.waitForTimeout(10000);
    console.log('Final URL:', page.url());
    await page.screenshot({ path: 'output/okta-8185311-after-submit.png', fullPage: true });
    await browser.close();
    return;
  }

  console.log('\nChrome is open with the prefilled Okta form.');
  console.log('Review every field, then click Submit application yourself.');
  console.log('Screenshot: output/okta-8185311-prefill.png');
  console.log('Chrome stays open for 30 minutes (or close the window to end).\n');
  await page.waitForTimeout(30 * 60 * 1000).catch(() => {});
  await browser.close().catch(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
