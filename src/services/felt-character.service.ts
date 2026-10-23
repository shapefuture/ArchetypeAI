import { Injectable } from '@angular/core';
import type { Group } from 'three';
import { IV_PARTS, loadLooks, type IvPart } from '../shared/features/landing/stickers';
import type { Archetype } from './universe-state.service';
import { generate, generateSet, hashStr } from '../../felt-atelier/src/dna.js';
import type {
  FeltCharacterBuildResponse,
  FeltCharacterPayload,
  FeltLOD,
} from './felt-character.types';

const ROSTER_SEED = 20261003;
/**
 * Shared bridge from the Felt Atelier generator to the application.
 *
 * The generator produces one deterministic DNA per IFS part, then sews that
 * same DNA into both a 2D SVG and a low-poly 3D map character. Geometry is
 * built in an Angular Web Worker; the Three.js scene only assembles the
 * finished buffers, so opening the map never blocks on 18 sewing jobs.
 */
@Injectable({ providedIn: 'root' })
export class FeltCharacterService {
  private worker: Worker | null = null;
  private workerUnavailable = false;
  private nextRequestId = 1;
  private readonly pending = new Map<number, (value: FeltCharacterPayload | null) => void>();
  private readonly payloads = new Map<string, FeltCharacterPayload>();
  private readonly payloadJobs = new Map<string, Promise<FeltCharacterPayload | null>>();
  private readonly coreDna = new Map<string, Record<string, unknown>>();
  private readonly dynamicDna = new Map<string, Record<string, unknown>>();

  /** Returns the stable generator DNA used by both the 2D and 3D renderers. */
  dnaFor(archetype: Archetype): Record<string, unknown> {
    const core = this.coreRoster().get(archetype.id);
    if (core) return core;

    const signature = `${archetype.id}:${archetype.coordinates.join(',')}:${archetype.cluster ?? ''}`;
    const cached = this.dynamicDna.get(signature);
    if (cached) return cached;

    const seed = hashStr(`felt-atelier:${signature}`) || 1;
    const dna = generate({
      seed,
      collection: 'wool',
      profile: {
        role: this.roleFor(archetype.cluster),
        axes: {
          agency: archetype.coordinates[0] ?? 0,
          temperature: archetype.coordinates[1] ?? 0,
          focus: archetype.coordinates[2] ?? 0,
          attachment: archetype.coordinates[3] ?? 0,
        },
      },
      existing: [...this.coreRoster().values(), ...this.dynamicDna.values()].slice(-12),
    }) as Record<string, unknown>;
    this.dynamicDna.set(signature, dna);
    return dna;
  }

  /** A generated 2D sticker. `null` means keep the app's editable legacy look. */
  async svgFor(archetype: Archetype): Promise<string | null> {
    if (loadLooks()[archetype.id]) return null;
    const payload = await this.payloadFor(archetype, 'map');
    return payload?.svg || null;
  }

  /** Build the generated felt character for a Three.js map node. */
  async buildMapCharacter(archetype: Archetype): Promise<Group | null> {
    if (loadLooks()[archetype.id]) return null;
    const payload = await this.payloadFor(archetype, 'map');
    if (!payload) return null;

    // Keep Three.js materials and assembly out of the landing-page chunk.
    const { makeGroup } = await import('../../felt-atelier/src/assemble.js');
    return makeGroup(payload.parts as any, payload.size, { cloneMaterials: true }) as Group;
  }

  private async payloadFor(archetype: Archetype, lod: FeltLOD): Promise<FeltCharacterPayload | null> {
    const dna = this.dnaFor(archetype);
    const key = `${archetype.id}:${hashStr(JSON.stringify(dna)).toString(36)}:${lod}`;
    const cached = this.payloads.get(key);
    if (cached) return cached;

    const existing = this.payloadJobs.get(key);
    if (existing) return existing;

    const worker = this.ensureWorker();
    if (!worker) return null;

    const requestId = this.nextRequestId++;
    const job = new Promise<FeltCharacterPayload | null>((resolve) => {
      this.pending.set(requestId, (payload) => resolve(payload));
      try {
        worker.postMessage({
          requestId,
          characterId: archetype.id,
          dna,
          lod,
        });
      } catch {
        this.pending.delete(requestId);
        resolve(null);
      }
    }).then((payload) => {
      this.payloadJobs.delete(key);
      if (payload) this.payloads.set(key, payload);
      return payload;
    });

    this.payloadJobs.set(key, job);
    return job;
  }

  private ensureWorker(): Worker | null {
    if (this.worker) return this.worker;
    if (this.workerUnavailable || typeof Worker === 'undefined') return null;

    try {
      this.worker = new Worker(new URL('./felt-character.worker', import.meta.url), {
        type: 'module',
        name: 'felt-character-sewing',
      });
      this.worker.onmessage = (event: MessageEvent<FeltCharacterBuildResponse>) => {
        const { requestId, ok, error, ...payload } = event.data;
        const finish = this.pending.get(requestId);
        if (!finish) return;
        this.pending.delete(requestId);
        finish(ok ? payload : null);
        if (!ok) console.warn('Felt character could not be sewn:', error);
      };
      this.worker.onerror = () => {
        this.workerUnavailable = true;
        this.worker?.terminate();
        this.worker = null;
        for (const finish of this.pending.values()) finish(null);
        this.pending.clear();
      };
      return this.worker;
    } catch {
      this.workerUnavailable = true;
      this.worker = null;
      return null;
    }
  }

  private coreRoster(): Map<string, Record<string, unknown>> {
    if (this.coreDna.size) return this.coreDna;

    const profiles = IV_PARTS.map((part) => ({
      role: part.fam,
      axes: {
        agency: (part.ax.ag - 50) / 50,
        temperature: (part.ax.te - 50) / 50,
        focus: (part.ax.fo - 50) / 50,
        attachment: (part.ax.at - 50) / 50,
      },
    }));
    const constellation = generateSet({
      seed: ROSTER_SEED,
      collection: 'wool',
      n: IV_PARTS.length,
      profiles,
    }) as Record<string, unknown>[];

    // generateSet puts the Self character at index 0; the following entries
    // line up with the 18-part taxonomy passed in as profiles.
    IV_PARTS.forEach((part, index) => {
      const dna = constellation[index + 1];
      if (dna) this.coreDna.set(part.id, dna);
    });

    // Defensive deterministic fallback if a future roster edit changes the
    // generator's returned set length.
    IV_PARTS.forEach((part) => {
      if (this.coreDna.has(part.id)) return;
      this.coreDna.set(part.id, generate({
        seed: hashStr(`felt-atelier:${part.id}`) || 1,
        collection: 'wool',
        profile: {
          role: part.fam,
          axes: {
            agency: (part.ax.ag - 50) / 50,
            temperature: (part.ax.te - 50) / 50,
            focus: (part.ax.fo - 50) / 50,
            attachment: (part.ax.at - 50) / 50,
          },
        },
      }) as Record<string, unknown>);
    });

    return this.coreDna;
  }

  private roleFor(cluster?: string): IvPart['fam'] {
    if (cluster === 'firefighters' || cluster === 'firefighter') return 'firefighter';
    if (cluster === 'exiles' || cluster === 'exile') return 'exile';
    if (cluster === 'managers' || cluster === 'manager') return 'manager';
    return 'resource';
  }
}
