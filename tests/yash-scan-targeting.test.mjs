import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import * as yaml from 'js-yaml';
import {
  buildContentFilter,
  buildExperienceFilter,
  buildLocationFilter,
  buildTitleFilter,
} from '../scan.mjs';
import { classifyTier } from '../classify-tier.mjs';

const root = join(import.meta.dirname, '..');
const config = yaml.load(readFileSync(join(root, 'portals.yml'), 'utf8'));
const titleFilter = buildTitleFilter(config.title_filter);
const contentFilter = buildContentFilter(config.content_filter);
const experienceFilter = buildExperienceFilter(config.experience_filter);
const locationFilter = buildLocationFilter(config.location_filter);
const skippedTiers = new Set(config.skip_tiers ?? []);

const scanAcceptsTitle = (title) =>
  titleFilter(title) && !skippedTiers.has(classifyTier(title));

test('Yash scan keeps mid-level and attainable senior engineering titles', () => {
  for (const title of [
    'Software Engineer',
    'Software Engineer II',
    'Backend Engineer',
    'Senior Software Engineer',
    'Senior Backend Engineer',
  ]) {
    assert.equal(scanAcceptsTitle(title), true, title);
  }
});

test('Yash scan rejects upper-level engineering titles', () => {
  for (const title of [
    'Tech Lead, Backend',
    'Technical Lead - Software Engineering',
    'Lead Software Engineer',
    'Staff Software Engineer',
    'Senior Staff Software Engineer',
    'Principal Software Engineer',
    'Software Architect',
    'Director of Software Engineering',
    'Senior Software Engineering Manager',
    'Front-end Engineer/Web Developer (SDE 1 & 2)',
    'SDE-1 (FTC)',
  ]) {
    assert.equal(scanAcceptsTitle(title), false, title);
  }
});

test('Yash scan keeps India/global remote locations and rejects explicit foreign remote locations', () => {
  for (const location of [
    'Bengaluru, Karnataka, India',
    'Remote - India',
    'Anywhere in the World',
    'Remote',
  ]) {
    assert.equal(locationFilter(location), true, location);
  }

  for (const location of [
    'Remote - USA',
    'Chicago, Illinois, United States, Remote',
    'Remote - Ireland',
    'Remote, Poland',
  ]) {
    assert.equal(locationFilter(location), false, location);
  }
});

test('Yash scan rejects descriptions with an explicit 8+ year minimum', () => {
  for (const description of [
    'Requires 8+ years of software engineering experience.',
    'You have at least 8 years of professional experience.',
    'A minimum of 10 years of software development experience is required.',
  ]) {
    assert.equal(
      contentFilter(description) && experienceFilter(description),
      false,
      description,
    );
  }

  assert.equal(
    contentFilter('Requires 6-7 years of software engineering experience.') &&
      experienceFilter('Requires 6-7 years of software engineering experience.'),
    true,
  );
});
