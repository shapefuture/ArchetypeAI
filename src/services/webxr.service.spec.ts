import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { buildDynamicRelationalIds, VisualizationService, Archetype } from './webxr.service';
import { TranslationService } from './translation.service';
import { IV_PARTS } from '../shared/features/landing/stickers';

const CLUSTER_BY_FAM: Record<string, string> = {
  manager: 'managers',
  firefighter: 'firefighters',
  exile: 'exiles',
  resource: 'resources',
};

const SIZE_BY_FAM: Record<string, number> = {
  manager: 0.75,
  firefighter: 0.7,
  exile: 0.6,
  resource: 0.8,
};

describe('VisualizationService', () => {
  let service: VisualizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), VisualizationService, TranslationService],
    });
    service = TestBed.inject(VisualizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('allArchetypes', () => {
    it('should contain one entry per IFS part (18 archetypes)', () => {
      expect(service.allArchetypes().length).toBe(18);
      expect(IV_PARTS.length).toBe(18);
    });

    it('every archetype should have required fields', () => {
      const archetypes = service.allArchetypes();
      for (const a of archetypes) {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.coordinates).toBeDefined();
        expect(a.coordinates.length).toBe(4);
        expect(a.color).toBeTruthy();
        expect(a.size).toBeGreaterThan(0);
        expect(a.symbol).toBeTruthy();
        expect(a.description).toBeTruthy();
        expect(a.invitation).toBeTruthy();
        expect(a.coreBelief).toBeTruthy();
        expect(a.attracts).toBeTruthy();
        expect(a.shadow).toBeTruthy();
        // sticker rendering fields for the satellite labels
        expect(a.shape).toBeTruthy();
        expect(a.glyph).toBeDefined();
        expect(a.glyph!.e).toBeTruthy();
        expect(a.glyph!.m).toBeTruthy();
      }
    });

    it('ids should match the IV_PARTS roster exactly', () => {
      const archIds = service.allArchetypes().map(a => a.id);
      expect(archIds).toEqual(IV_PARTS.map(p => p.id));
    });

    it('names should be the Russian part names', () => {
      const byId = new Map(service.allArchetypes().map(a => [a.id, a.name]));
      for (const p of IV_PARTS) {
        expect(byId.get(p.id)).toBe(p.name[1]);
      }
    });

    it('all coordinates should be between -1 and 1', () => {
      const archetypes = service.allArchetypes();
      for (const a of archetypes) {
        for (const c of a.coordinates) {
          expect(c).toBeGreaterThanOrEqual(-1);
          expect(c).toBeLessThanOrEqual(1);
        }
      }
    });

    it('coordinates should map 0..100 axes to -1..1 ((v - 50) / 50)', () => {
      const taskmaster = service.allArchetypes().find(a => a.id === 'taskmaster')!;
      const part = IV_PARTS.find(p => p.id === 'taskmaster')!;
      expect(taskmaster.coordinates[0]).toBeCloseTo((part.ax.ag - 50) / 50, 10);
      expect(taskmaster.coordinates[1]).toBeCloseTo((part.ax.te - 50) / 50, 10);
      expect(taskmaster.coordinates[2]).toBeCloseTo((part.ax.fo - 50) / 50, 10);
      expect(taskmaster.coordinates[3]).toBeCloseTo((part.ax.at - 50) / 50, 10);
    });

    it('all IDs should be unique', () => {
      const ids = service.allArchetypes().map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('clusters should be the four IFS families derived from part families', () => {
      const byId = new Map(service.allArchetypes().map(a => [a.id, a.cluster]));
      for (const p of IV_PARTS) {
        expect(byId.get(p.id)).toBe(CLUSTER_BY_FAM[p.fam]);
      }
      const clusters = new Set(service.allArchetypes().map(a => a.cluster));
      expect(clusters).toEqual(new Set(['managers', 'firefighters', 'exiles', 'resources']));
    });

    it('sizes should follow the family scale (manager .75, firefighter .7, exile .6, resource .8)', () => {
      const byId = new Map(service.allArchetypes().map(a => [a.id, a.size]));
      for (const p of IV_PARTS) {
        expect(byId.get(p.id)).toBe(SIZE_BY_FAM[p.fam]);
      }
    });

    it('colors and sticker looks should come from the roster', () => {
      const byId = new Map(service.allArchetypes().map(a => [a.id, a]));
      for (const p of IV_PARTS) {
        const a = byId.get(p.id)!;
        expect(a.color).toBe(p.color);
        expect(a.shape).toBe(p.shape);
        expect(a.glyph).toEqual(p.glyph);
      }
    });
  });

  describe('dimensions', () => {
    it('should return 4 dimensions', () => {
      expect(service.dimensions().length).toBe(4);
    });

    it('each dimension should have key and labels', () => {
      for (const dim of service.dimensions()) {
        expect(dim.key).toBeTruthy();
        expect(dim.labels.hypo).toBeTruthy();
        expect(dim.labels.hyper).toBeTruthy();
      }
    });
  });

  describe('allClusters', () => {
    it('should return the four family clusters with non-key names', () => {
      const clusters = service.allClusters();
      expect(clusters.map(c => c.id).sort()).toEqual(['exiles', 'firefighters', 'managers', 'resources']);
      for (const c of clusters) {
        expect(c.name).toBeTruthy();
        expect(c.name).not.toBe(c.id); // inline family label, not the raw key
      }
    });
  });

  describe('addArchetype()', () => {
    it('allArchetypes signal already contains all initial archetypes', () => {
      // addArchetype requires Three.js scene (init()). Test data integrity instead.
      const sageIds = service.allArchetypes().filter(a => a.id === 'sage');
      expect(sageIds.length).toBe(1); // no duplicates in initial data
    });
  });

  describe('buildDynamicRelationalIds()', () => {
    it('connects a part to related parts including its own family', () => {
      const source: Archetype = {
        id: 'studio_logic_guard',
        name: 'Logic Guard',
        coordinates: [0.7, -0.8, -0.1, -0.9],
        color: '#4A90E2',
        size: 0.8,
        symbol: '◎',
        cluster: 'managers',
        invitation: 'Soften',
        coreBelief: 'Closeness is dangerous',
        attracts: 'Warm witnesses',
      };

      const ids = buildDynamicRelationalIds(source, service.allArchetypes(), 4);

      expect(ids.length).toBeGreaterThan(0);
      expect(ids).not.toContain(source.id);
      expect(ids.some(id => service.allArchetypes().find(a => a.id === id)?.cluster === source.cluster)).toBe(true);
    });

    it('keeps the curated guard pair for a known part at the front', () => {
      const pleaser = service.allArchetypes().find(a => a.id === 'pleaser')!;
      const ids = buildDynamicRelationalIds(pleaser, service.allArchetypes(), 4);
      // RELATIONAL_MAP pairs the Pleaser with the exile it guards
      expect(ids[0]).toBe('abandoned');
    });
  });

  describe('destroy()', () => {
    it('should not throw when called without init', () => {
      expect(() => service.destroy()).not.toThrow();
    });
  });

  describe('signals', () => {
    it('focusedArchetype should default to null', () => {
      expect(service.focusedArchetype()).toBeNull();
    });

    it('selectedArchetype should default to null', () => {
      expect(service.selectedArchetype()).toBeNull();
    });

    it('personalConstellation should default to null', () => {
      expect(service.personalConstellation()).toBeNull();
    });

    it('isolatedDimension should default to null', () => {
      expect(service.isolatedDimension()).toBeNull();
    });
  });
});
