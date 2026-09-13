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

// Guard: positive list must not grow or shrink without an explicit decision.
const EXPECTED_POSITIVE = [
  'Senior Software Engineer',
  'Software Engineer',
  'Software Development Engineer',
  'SDE',
  'Mid-Level Software Engineer',
  'Mid Level Software Engineer',
  'Software Engineer II',
  'Engineer II',
  'Backend Engineer',
  'Back End Engineer',
  'Backend Developer',
  'Java Developer',
  'Java Backend Developer',
  'Java Full Stack Developer',
  'Java Full-Stack Developer',
  'Spring Boot Developer',
  'Platform Engineer',
  'Distributed Systems Engineer',
  'API Engineer',
  'Full Stack Engineer',
  'Full-Stack Engineer',
  'Fullstack Engineer',
  'Full Stack Developer',
  'Full-Stack Developer',
  'Fullstack Developer',
  'Web Engineer',
];

const scanAcceptsTitle = (title) =>
  titleFilter(title) && !skippedTiers.has(classifyTier(title));

test('portals.yml title_filter.positive is unchanged', () => {
  assert.deepEqual(config.title_filter.positive, EXPECTED_POSITIVE);
});

test('Yash scan keeps mid-level and attainable senior engineering titles', () => {
  for (const title of [
    'Software Engineer',
    'Software Engineer II',
    'Software Engineer III',
    'Backend Engineer',
    'Senior Software Engineer',
    'Senior Backend Engineer',
    'Senior AI Software Engineer',
    'Platform Engineer',
    'Java Backend Developer',
    'Full Stack Engineer',
  ]) {
    assert.equal(scanAcceptsTitle(title), true, title);
  }
});

test('Yash scan rejects entry and upper-level engineering titles', () => {
  for (const title of [
    'Software Engineer Intern',
    'Junior Software Engineer',
    'SDE-1 (FTC)',
    'Tech Lead, Backend',
    'Technical Lead - Software Engineering',
    'Lead Software Engineer',
    'Staff Software Engineer',
    'Senior Staff Software Engineer',
    'Principal Software Engineer',
    'Software Architect',
    'Director of Software Engineering',
    'Senior Software Engineering Manager',
  ]) {
    assert.equal(scanAcceptsTitle(title), false, title);
  }
});

test('Yash scan rejects mobile, QA, data, and ML titles that match positives', () => {
  for (const title of [
    'Front-end Engineer/Web Developer (SDE 1 & 2)',
    'Senior Mobile Engineer',
    'Android Software Engineer',
    'iOS Software Engineer',
    'Senior QA Engineer',
    'Software Test Engineer',
    'SDET',
    'Senior Data Engineer',
    'Machine Learning Engineer',
    'ML Engineer',
    'Data Scientist',
    'Analytics Engineer',
    'Senior NLP Engineer',
    'Firmware Engineer',
    'Embedded Software Engineer',
  ]) {
    assert.equal(scanAcceptsTitle(title), false, title);
  }
});

test('Yash scan keeps software titles with data platform wording when not a data role title', () => {
  assert.equal(
    scanAcceptsTitle('Senior Software Engineer, Data Platform'),
    true,
  );
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
