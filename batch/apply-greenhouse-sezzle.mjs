#!/usr/bin/env node
/** Apply to Sezzle #024 via Greenhouse with resume upload. */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'fs';

const URL = 'https://job-boards.greenhouse.io/sezzle/jobs/7775223003';
const CV = 'C:\\Users\\yash\\Desktop\\Code\\career-ops\\Resume\\Yash_Resume.pdf';
const SUBMIT = process.argv.includes('--submit');

if (!existsSync(CV)) {
  console.error('Resume not found:', CV);
  process.exit(1);
}
mkdirSync('output', { recursive: true });

async function pickCombobox(page, labelRe, optionText) {
  const combo = page.getByRole('combobox', { name: labelRe }).first();
  await combo.scrollIntoViewIfNeeded();
  await combo.click({ timeout: 15000 });
  await page.waitForTimeout(300);
  const esc = optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opt = page.getByRole('option', { name: new RegExp(`^\\s*${esc}\\s*$`, 'i') }).first();
  if (await opt.count()) {
    await opt.click({ timeout: 8000 });
    return;
  }
  await page.locator('[class*="select__option"], [role="option"]').filter({ hasText: new RegExp(esc, 'i') }).first().click({ timeout: 8000 });
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
    browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1280,900'] });
  } catch {
    browser = await chromium.launch({ headless: false, args: ['--window-size=1280,900'] });
  }
  const page = await (await browser.newContext()).newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('textbox', { name: /^First Name/i }).waitFor({ state: 'visible', timeout: 45000 });

  await fillLabel(page, /^First Name/i, 'Yash');
  await fillLabel(page, /^Last Name/i, 'Yash');
  await fillLabel(page, /^Email/i, 'yashk.code@gmail.com');
  await pickCombobox(page, /Country/i, 'India');
  await fillLabel(page, /^Phone/i, '9113358078');

  const loc = page.getByRole('combobox', { name: /Location \(City\)/i }).first();
  await loc.click();
  await loc.fill('Bengaluru');
  await page.waitForTimeout(600);
  await page.getByRole('option', { name: /Bengaluru/i }).first().click({ timeout: 8000 }).catch(async () => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  });

  await page.locator('input[type="file"]').first().setInputFiles(CV);

  await pickCombobox(page, /eligible work authorization to work in India/i, 'Yes');
  await fillLabel(page, /What city do you reside in/i, 'Bengaluru');
  await pickCombobox(page, /more than 8 years of experience/i, 'No');
  await fillLabel(page, /full-stack software engineering experience/i, '4');
  await pickCombobox(page, /Bachelor's in computer science/i, 'Yes');
  await fillLabel(page, /university did you graduate from/i, 'Indian Institute of Technology Ropar');
  await pickCombobox(page, /undergraduate GPA/i, 'NA');
  await fillLabel(page, /monthly GROSS salary expectation in USD/i, '6000');
  await pickCombobox(page, /How did you hear about this opportunity/i, 'LinkedIn');
  await pickCombobox(page, /English level/i, 'C1');
  await fillLabel(page, /Linkedin profile/i, 'https://linkedin.com/in/yash-5a56a4234');

  const checks = {
    first: await page.getByRole('textbox', { name: /^First Name/i }).inputValue(),
    email: await page.getByRole('textbox', { name: /^Email/i }).inputValue(),
    resumeFiles: await page.locator('input[type="file"]').first().evaluate((el) => el.files?.length ?? 0).catch(() => 0),
  };
  console.log('Verification:', checks);
  await page.screenshot({ path: 'output/sezzle-024-prefill.png', fullPage: true });

  if (!checks.first || !checks.email || !checks.resumeFiles) {
    console.error('Required fields missing — not submitting.');
    await browser.close();
    process.exit(1);
  }

  if (SUBMIT) {
    await page.getByRole('button', { name: /Submit application/i }).click({ timeout: 15000 });
    await page.waitForTimeout(10000);
    const body = await page.locator('body').innerText();
    await page.screenshot({ path: 'output/sezzle-024-after-submit.png', fullPage: true });
    console.log('Final URL:', page.url());
    console.log('Success signals:', {
      confirmation: /thank you for applying|application has been received|confirmation/i.test(body),
      securityCode: /security code|verification code|enter the code/i.test(body),
      stillOnForm: /Submit application/i.test(body),
    });
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
