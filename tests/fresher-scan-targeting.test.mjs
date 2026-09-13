import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import * as yaml from 'js-yaml';
import {
  buildExperienceFilter,
  buildLocationFilter,
  buildTitleFilter,
} from '../scan.mjs';
import { classifyTier } from '../classify-tier.mjs';

const root = join(import.meta.dirname, '..');
const config = yaml.load(readFileSync(join(root, 'portals.yml'), 'utf8'));
const titleFilter = buildTitleFilter(config.title_filter);
const experienceFilter = buildExperienceFilter(config.experience_filter);
const locationFilter = buildLocationFilter(config.location_filter);
const skippedTiers = new Set(config.skip_tiers ?? []);

const scanAcceptsTitle = (title) =>
  titleFilter(title) && !skippedTiers.has(classifyTier(title));

test('Freshers scan keeps priority and expanded entry-level technical titles', () => {
  for (const title of [
    'Associate Software Engineer',
    'Junior Software Engineer',
    'Software Engineer I',
    'Graduate Engineer Trainee',
    'Engineer Trainee',
    'SDE-1',
    'Junior DevOps Engineer',
    'Associate QA Engineer',
    'Graduate Data Engineer',
    'Junior ML Engineer',
    'Associate AI Engineer',
    'Junior Cloud Engineer',
    'Associate Security Engineer',
    'Junior Network Engineer',
  ]) {
    assert.equal(scanAcceptsTitle(title), true, title);
  }
});

test('Freshers scan rejects senior, mid-level, and internship titles', () => {
  for (const title of [
    'Senior Software Engineer',
    'Staff Software Engineer',
    'Software Engineer II',
    'Software Engineer III',
    'SDE-2',
    'Tech Lead, Backend',
    'Software Engineering Manager',
    'Software Engineer Intern',
    'Summer Intern, Software Engineering',
  ]) {
    assert.equal(scanAcceptsTitle(title), false, title);
  }
});

test('Freshers scan rejects explicit 3+ year JD minimums', () => {
  for (const description of [
    'Requires 3+ years of software engineering experience.',
    'Minimum of 4 years experience required.',
    'You must have at least 5 years of professional experience.',
  ]) {
    assert.equal(experienceFilter(description), false, description);
  }

  assert.equal(
    experienceFilter('Requires 0-2 years of software engineering experience.'),
    true,
  );
  assert.equal(
    experienceFilter('Requires 2 years of relevant experience.'),
    true,
  );
});

test('Freshers scan keeps India-friendly locations and blocks foreign-only remote', () => {
  for (const location of [
    'Bengaluru, Karnataka, India',
    'Remote - India',
    'Hyderabad, India',
    'Remote',
  ]) {
    assert.equal(locationFilter(location), true, location);
  }

  for (const location of [
    'Remote - USA',
    'Chicago, Illinois, United States, Remote',
    'Remote, Poland',
  ]) {
    assert.equal(locationFilter(location), false, location);
  }
});

test('Freshers skip_tiers is senior only', () => {
  assert.deepEqual(config.skip_tiers, ['senior']);
  assert.equal(config.experience_filter?.max_required_years, 2);
});
