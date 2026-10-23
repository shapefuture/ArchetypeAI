import { describe, expect, it } from 'vitest';
import { ASSESSMENT_QUESTIONS } from '../../shared/core/data/assessment-questions';
import { buildItemSequence } from '../../shared/i18n/items';
import { SEED_PARTS } from '../pal/traits';
import { scoreSystem } from './scoring-v2';
import {
  ASSESSMENT_ROUTES, ROUTE_KEYS, isCanonicalProfile, isExamplePart, isSampleProfile,
  markSample, primaryRoutes, sampleSavePlan, secondaryRoutes, type AssessmentRoute,
} from './assessment-routes';
import { DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY } from './assessment-draft';

const route = (id: AssessmentRoute['id']) => ASSESSMENT_ROUTES.find((item) => item.id === id)!;

describe('assessment route contract', () => {
  it('offers exactly three primary entries in order, and labels the rest as secondary tools', () => {
    expect(primaryRoutes().map((item) => item.id)).toEqual(['situation-inquiry', 'reflection-64', 'battery-147']);
    expect(secondaryRoutes().map((item) => item.id)).toEqual(['quick-map-sample', 'quick-scan-teaser']);
  });

  it('keeps the 64-item and 147-item routes canonical with their real bank sizes', () => {
    expect(ASSESSMENT_QUESTIONS).toHaveLength(64);
    expect(buildItemSequence()).toHaveLength(147);
    expect(route('reflection-64')).toMatchObject({ canonical: true, available: true, itemCount: 64, produces: 'canonical-64' });
    expect(route('battery-147')).toMatchObject({ canonical: true, available: true, itemCount: 147, produces: 'canonical-147' });
    expect(route('reflection-64').itemCount).toBe(ASSESSMENT_QUESTIONS.length);
    expect(route('battery-147').itemCount).toBe(buildItemSequence().length);
  });

  it('offers the situation inquiry as its own route, never as a scored instrument', () => {
    expect(route('situation-inquiry')).toMatchObject({
      tier: 'primary', canonical: false, available: true, itemCount: null, produces: 'none',
      destination: { kind: 'overlay', overlay: 'checkin', focus: 'situation-inquiry' },
    });
  });

  it('only gives destinations to available routes and never marks a secondary tool canonical', () => {
    for (const item of ASSESSMENT_ROUTES) {
      expect(item.destination !== null).toBe(item.available);
    }
    for (const item of secondaryRoutes()) expect(item.canonical).toBe(false);
  });

  it('gives the 64-item and 147-item routes disjoint storage keys', () => {
    const reflection = Object.values(ROUTE_KEYS.reflection64);
    const battery = Object.values(ROUTE_KEYS.battery147);
    const all = [...reflection, ...battery, ROUTE_KEYS.quickMap.draft];
    expect(new Set(all).size).toBe(all.length);
    expect(reflection.some((key) => battery.includes(key))).toBe(false);
  });

  it('names the draft keys the 147-item screen actually reads and writes', () => {
    expect(ROUTE_KEYS.battery147.draft).toBe(DESCENT_DRAFT_KEY);
    expect(ROUTE_KEYS.battery147.legacyDraft).toBe(LEGACY_DESCENT_DRAFT_KEY);
  });

  it('labels a sample so it cannot read as a measured profile', () => {
    const parts = [{ id: 'p1', name: 'One', family: 'manager' }, { id: 'p2', name: 'Two', family: 'exile' }] as any;
    const sample = scoreSystem({ somatic: { p1: { intensity: 4, felt: 'mid' }, p2: { intensity: 2, felt: 'low' } }, statements: [5, 5, 5], parts });
    expect(isSampleProfile(sample)).toBe(true);
    expect(isSampleProfile(markSample(sample))).toBe(true);
    expect(isCanonicalProfile(markSample(sample))).toBe(false);
    expect(isSampleProfile(null)).toBe(false);
  });

  it('recognises canonical 147-item profiles as not samples', () => {
    const canonical = { version: 'v2', testModel: 'angular-v2', clinical: { parts: {} }, headlineConstellation: 'x' };
    expect(isCanonicalProfile(canonical)).toBe(true);
    expect(isSampleProfile(canonical)).toBe(false);
  });

  it('never lets a sample replace a canonical map', () => {
    expect(sampleSavePlan({ testModel: 'angular-v2', clinical: {} })).toBe('archive-only');
    expect(sampleSavePlan(null)).toBe('replace-current');
    expect(sampleSavePlan(markSample({ version: 'v2' }))).toBe('replace-current');
  });

  it('identifies the built-in example cast but not the user parts', () => {
    expect(isExamplePart(SEED_PARTS[0])).toBe(true);
    expect(isExamplePart({ id: 'p1abc' })).toBe(false);
    expect(isExamplePart(undefined)).toBe(false);
  });
});
