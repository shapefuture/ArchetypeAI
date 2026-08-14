import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { buildDynamicRelationalIds, VisualizationService, Archetype } from './webxr.service';
import { TranslationService } from './translation.service';

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
    it('should contain 24 archetypes', () => {
      expect(service.allArchetypes().length).toBe(24);
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
        expect(a.invitation).toBeTruthy();
        expect(a.coreBelief).toBeTruthy();
        expect(a.attracts).toBeTruthy();
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

    it('all IDs should be unique', () => {
      const ids = service.allArchetypes().map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should contain the 4 gift archetypes', () => {
      const giftIds = ['the_sovereign', 'the_relational_fluent', 'the_embodied_wisdom', 'the_creative_synthesis'];
      const archIds = service.allArchetypes().map(a => a.id);
      for (const giftId of giftIds) {
        expect(archIds).toContain(giftId);
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
    it('should return cluster objects with id and name', () => {
      const clusters = service.allClusters();
      expect(clusters.length).toBeGreaterThan(0);
      for (const c of clusters) {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
      }
    });
  });

  describe('addArchetype()', () => {
    it('allArchetypes signal already contains all initial archetypes', () => {
      // addArchetype requires Three.js scene (init()). Test data integrity instead.
      const sovereignIds = service.allArchetypes().filter(a => a.id === 'the_sovereign');
      expect(sovereignIds.length).toBe(1); // no duplicates in initial data
    });
  });

  describe('buildDynamicRelationalIds()', () => {
    it('connects generated parts to nearby/same-cluster archetypes', () => {
      const source: Archetype = {
        id: 'studio_logic_guard',
        name: 'Logic Guard',
        coordinates: [0.7, -0.8, -0.1, -0.9],
        color: '#4A90E2',
        size: 0.8,
        symbol: '◎',
        cluster: 'avoidant_intellectual_shadows',
        invitation: 'Soften',
        coreBelief: 'Closeness is dangerous',
        attracts: 'Warm witnesses',
      };

      const ids = buildDynamicRelationalIds(source, service.allArchetypes(), 4);

      expect(ids.length).toBeGreaterThan(0);
      expect(ids).not.toContain(source.id);
      expect(ids.some(id => service.allArchetypes().find(a => a.id === id)?.cluster === source.cluster)).toBe(true);
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
