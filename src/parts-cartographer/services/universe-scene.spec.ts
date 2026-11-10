import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Part } from '../pal/traits';

const renderer = vi.hoisted(() => ({ loops: [] as unknown[] }));

// Explicit stubs for the three.js exports the scene touches. The renderer records animation-loop calls.
vi.mock('three', () => {
  class Vector {
    x = 0; y = 0; z = 0;
    set() { return this; }
    copy() { return this; }
    add() { return this; }
    setScalar() { return this; }
  }
  class Object3D {
    position = new Vector();
    rotation = { x: 0, y: 0, z: 0 };
    scale = new Vector();
    userData: Record<string, unknown> = {};
    children: unknown[] = [];
    add() { return this; }
    remove() { return this; }
    traverse() {}
  }
  class Material { dispose() {} }
  class Geometry { setAttribute() {} dispose() {} }
  class Light extends Object3D {}
  class Scene extends Object3D {}
  class Group extends Object3D {}
  class Mesh extends Object3D {
    geometry: unknown;
    material: unknown;
    constructor(geometry?: unknown, material?: unknown) { super(); this.geometry = geometry; this.material = material; }
  }
  class Line extends Object3D {
    geometry: unknown;
    material: unknown;
    constructor(geometry?: unknown, material?: unknown) { super(); this.geometry = geometry; this.material = material; }
  }
  class Sprite extends Object3D {
    material: unknown;
    constructor(material?: unknown) { super(); this.material = material; }
  }
  class CanvasTexture { dispose() {} }
  class SpriteMaterial extends Material {
    map: unknown;
    constructor(options: { map?: unknown } = {}) { super(); this.map = options.map; }
  }
  class MeshBasicMaterial extends Material { constructor(options: Record<string, unknown> = {}) { super(); Object.assign(this, options); } }
  class LineBasicMaterial extends Material { constructor(options: Record<string, unknown> = {}) { super(); Object.assign(this, options); } }
  class TorusGeometry extends Geometry {}
  class PerspectiveCamera extends Object3D {
    aspect = 1;
    updateProjectionMatrix() {}
  }
  class Points extends Object3D {
    material: Material;
    constructor(_geometry?: unknown, material?: Material) { super(); this.material = material ?? new Material(); }
  }
  class Raycaster {
    setFromCamera() {}
    intersectObjects() { return []; }
  }
  class Vector2 extends Vector {}
  class Vector3 extends Vector {}
  class WebGLRenderer {
    domElement = document.createElement('canvas');
    xr = { enabled: false, getSession: () => null };
    toneMapping = 0;
    toneMappingExposure = 1;
    setPixelRatio() {}
    setSize() {}
    render() {}
    dispose() {}
    setAnimationLoop(loop: unknown) { renderer.loops.push(loop); }
  }
  return {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    BufferGeometry: Geometry,
    BufferAttribute: class {},
    PointsMaterial: Material,
    Points,
    Group,
    Mesh,
    Line,
    Sprite,
    CanvasTexture,
    SpriteMaterial,
    MeshBasicMaterial,
    LineBasicMaterial,
    TorusGeometry,
    Raycaster,
    Vector2,
    Vector3,
    AmbientLight: Light,
    DirectionalLight: Light,
    PointLight: Light,
    NeutralToneMapping: 0,
  };
});

vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: class {
    target = { copy() {}, add() {} };
    enableDamping = false;
    dampingFactor = 0;
    minDistance = 0;
    maxDistance = 0;
    update() {}
    dispose() {}
  },
}));

// Felt characters are sewn in later; the stub is a bare object with the methods the scene calls on it.
vi.mock('./felt-engine', () => ({
  feltGroup: vi.fn(async () => ({ scale: { multiplyScalar() {} }, rotation: { set() {} }, traverse() {} })),
}));

// jsdom has no canvas. The axis labels draw without a context, so the stub returns null and nothing is drawn.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { configurable: true, value: () => null });

import { ambience } from './ambience-gate';
import { initUniverse } from './universe-scene';

afterEach(() => {
  Reflect.deleteProperty(document, 'hidden');
  renderer.loops.length = 0;
  ambience.set('hidden', false);
  ambience.set('typing', false);
  ambience.set('error', false);
});

const lastLoop = () => renderer.loops[renderer.loops.length - 1];

const part = (id: string, coordinates: number[], coordinateBasis: string, unmeasuredAxes: string[]) => ({
  id,
  name: id,
  family: 'manager',
  traits: {},
  energy: 40,
  star: false,
  archetype: {
    schema: 'archetype-map.v1',
    sourceAssessment: 'parts-2',
    coordinateBasis,
    coordinates,
    unmeasuredAxes,
    axisVersion: 2,
    depthRecord: 2,
    cluster: 'test',
    prominence: 40,
    size: 0.8,
  },
}) as unknown as Part;

describe('universe render loop and ambience', () => {
  it('stops rendering while the page is hidden, text is typed, or an error is shown, then resumes', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'gentle');

    expect(typeof lastLoop()).toBe('function');
    ambience.set('typing', true);
    expect(lastLoop()).toBeNull();
    ambience.set('typing', false);
    expect(typeof lastLoop()).toBe('function');

    ambience.set('hidden', true);
    expect(lastLoop()).toBeNull();
    ambience.set('hidden', false);
    expect(typeof lastLoop()).toBe('function');

    ambience.set('error', true);
    expect(lastLoop()).toBeNull();
    ambience.set('error', false);
    expect(typeof lastLoop()).toBe('function');

    api.dispose();
    host.remove();
  });

  it('keeps the loop stopped after sleep even when ambience is active, and restarts on wake', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'lively');

    api.sleep();
    expect(lastLoop()).toBeNull();
    ambience.set('error', true);
    ambience.set('error', false);
    expect(lastLoop()).toBeNull();
    api.wake();
    expect(typeof lastLoop()).toBe('function');

    api.dispose();
    host.remove();
  });

  it('stops following ambience once disposed', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'gentle');
    api.dispose();
    const calls = renderer.loops.length;

    ambience.set('typing', true);
    ambience.set('typing', false);
    expect(renderer.loops.length).toBe(calls);
    host.remove();
  });
});

describe('the 3+1 scene', () => {
  it('lays out a mixed scene with guides, relayouts when the axes or isolation change, and renders a frame', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, true, 'gentle');
    api.setGuides({
      ENERGY: { low: 'Shut down', high: 'Mobilised', color: '#6ED6FF' },
      DEPTH: { low: 'Deep, hidden', high: 'Surface, visible', color: '#8BE03A' },
      DIRECTION: { low: 'Away from people', high: 'Toward people', color: '#FF8A1F' },
      BLENDING: { low: 'I can be with it', high: 'It runs me', color: '#FFD000' },
    });
    api.setParts([
      part('placed', [0.2, 0.1, 0.3, 0.5], 'self-placed-2', []),
      part('twin', [0.2, 0.1, 0.3, 0.5], 'self-placed-2', ['DEPTH']),
      part('reference', [0, 0, 0, 0], 'fixed-reference-147', ['BLENDING']),
    ]);
    api.setView({ axes: ['ENERGY', 'DIRECTION', 'DEPTH'] });
    api.setView({ isolation: 'DIRECTION' });
    api.setView({ isolation: null });
    lastLoop()?.();
    expect(typeof lastLoop()).toBe('function');
    api.dispose();
    host.remove();
  });
});
