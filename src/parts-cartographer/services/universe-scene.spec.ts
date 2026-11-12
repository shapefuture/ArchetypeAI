import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Part } from '../pal/traits';
import * as THREE from 'three';
import { feltGroup } from './felt-engine';

const renderer = vi.hoisted(() => ({ loops: [] as unknown[], scenes: [] as any[], hits: [] as any[], sizes: [] as Array<[number, number]> }));

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
    children: any[] = [];
    add(child: any) { child.parent = this; this.children.push(child); return this; }
    remove(child: any) { const index = this.children.indexOf(child); if (index >= 0) { this.children.splice(index, 1); child.parent = undefined; } return this; }
    traverse() {}
  }
  class Material { dispose() {} }
  class Geometry { setAttribute() {} dispose() {} }
  class Light extends Object3D {}
  class Scene extends Object3D {
    constructor() { super(); renderer.scenes.push(this); }
  }
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
    intersectObjects() { return renderer.hits; }
  }
  class Vector2 extends Vector {}
  class Vector3 extends Vector {}
  class WebGLRenderer {
    domElement = document.createElement('canvas');
    xr = { enabled: false, getSession: () => null };
    toneMapping = 0;
    toneMappingExposure = 1;
    setPixelRatio() {}
    setSize(width: number, height: number) { renderer.sizes.push([width, height]); }
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
  renderer.scenes.length = 0;
  renderer.hits.length = 0;
  renderer.sizes.length = 0;
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

/** The group a part is drawn in, found by its id in the scene the test built. */
function groupOf(root: any, id: string): any {
  if (root.userData?.partId === id) return root;
  for (const child of root.children ?? []) {
    const found = groupOf(child, id);
    if (found) return found;
  }
  return undefined;
}

describe('the unknown tag in the isolation view (G31, G38)', () => {
  it('tags a part with no value on the isolated axis, and only while that axis is isolated', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'gentle');
    try {
      api.setParts([
        part('measured', [0.2, 0.1, 0.3, 0.5], 'self-placed-2', []),
        part('no-blending', [0.2, 0.1, 0.3, 0], 'fixed-reference-147', ['BLENDING']),
      ]);
      const scene = renderer.scenes[renderer.scenes.length - 1];
      const tagsOf = (id: string) => (groupOf(scene, id)?.children ?? []).filter((child: unknown) => child instanceof THREE.Sprite);
      expect(tagsOf('no-blending')).toHaveLength(0);
      api.setView({ isolation: 'BLENDING', unknownText: 'unknown' });
      expect(tagsOf('no-blending')).toHaveLength(1);
      expect(tagsOf('measured')).toHaveLength(0);
      api.setView({ isolation: 'DIRECTION' });
      expect(tagsOf('no-blending')).toHaveLength(0);
    } finally {
      api.dispose();
      host.remove();
    }
  });
});

describe('the felt counter (N2)', () => {
  it('does not count a part whose felt character has not loaded, even when it carries a tag', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'gentle');
    // The first part's character loads. The second part's character never does, and it carries an unknown tag.
    vi.mocked(feltGroup)
      .mockImplementationOnce(async () => ({ scale: { multiplyScalar() {} }, rotation: { set() {} }, traverse() {} }) as any)
      .mockImplementationOnce(() => new Promise(() => {}));
    try {
      api.setParts([
        part('measured', [0.2, 0.1, 0.3, 0.5], 'self-placed-2', []),
        part('no-blending', [0.2, 0.1, 0.3, 0], 'fixed-reference-147', ['BLENDING']),
      ]);
      api.setView({ isolation: 'BLENDING', unknownText: 'unknown' });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(host.querySelector('canvas')?.dataset.feltCharacters).toBe('1');
    } finally {
      api.dispose();
      host.remove();
    }
  });

  it('counts the parts whose felt character is sewn in, and not the tags on them', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'gentle');
    try {
      api.setParts([
        part('measured', [0.2, 0.1, 0.3, 0.5], 'self-placed-2', []),
        part('no-blending', [0.2, 0.1, 0.3, 0], 'fixed-reference-147', ['BLENDING']),
      ]);
      api.setView({ isolation: 'BLENDING', unknownText: 'unknown' });
      // The felt characters are sewn in after a promise resolves, so wait for the queued callbacks to run.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(host.querySelector('canvas')?.dataset.feltCharacters).toBe('2');
    } finally {
      api.dispose();
      host.remove();
    }
  });
});

describe('the unknown tag text follows the language (N3)', () => {
  it('replaces the tag when the text changes, and keeps one tag on the part', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = initUniverse(host, false, 'gentle');
    try {
      api.setParts([part('no-blending', [0.2, 0.1, 0.3, 0], 'fixed-reference-147', ['BLENDING'])]);
      const scene = renderer.scenes[renderer.scenes.length - 1];
      const tagsOf = () => (groupOf(scene, 'no-blending')?.children ?? []).filter((child: unknown) => child instanceof THREE.Sprite);
      api.setView({ isolation: 'BLENDING', unknownText: 'unknown' });
      const [english] = tagsOf();
      api.setView({ unknownText: 'неизвестно' });
      expect(tagsOf()).toHaveLength(1);
      expect(tagsOf()[0]).not.toBe(english);
    } finally {
      api.dispose();
      host.remove();
    }
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

describe('universe interaction', () => {
  /** A host with a real size, and a canvas whose box is 200 × 100 at the origin. */
  const mount = (width = 200, height = 100) => {
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { configurable: true, get: () => width });
    Object.defineProperty(host, 'clientHeight', { configurable: true, get: () => height });
    document.body.appendChild(host);
    const api = initUniverse(host, true, 'gentle');
    const canvas = host.querySelector('canvas')!;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON() {} }) as DOMRect;
    return { host, api, canvas };
  };
  const pointer = (canvas: HTMLCanvasElement, type: string, x: number, y: number) =>
    canvas.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));

  it('picks the part under a tap, and not after a drag or without a press', () => {
    const { host, api, canvas } = mount();
    const picked = vi.fn();
    api.onPick(picked);
    renderer.hits.push({ object: { userData: { partId: 'critic' } } });

    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointerup', 55, 54); // within 8 px: a tap
    expect(picked).toHaveBeenCalledWith('critic');

    picked.mockClear();
    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointerup', 70, 50); // 20 px: a drag that turns the view
    expect(picked).not.toHaveBeenCalled();

    pointer(canvas, 'pointerup', 50, 50); // a release with no press on the canvas
    expect(picked).not.toHaveBeenCalled();
    api.dispose();
    host.remove();
  });

  it('picks nothing when the tap hits no part, or the canvas has no size', () => {
    const { host, api, canvas } = mount();
    const picked = vi.fn();
    api.onPick(picked);
    pointer(canvas, 'pointerdown', 10, 10);
    pointer(canvas, 'pointerup', 10, 10);
    expect(picked).not.toHaveBeenCalled();

    renderer.hits.push({ object: { userData: { partId: 'critic' } } });
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect;
    pointer(canvas, 'pointerdown', 10, 10);
    pointer(canvas, 'pointerup', 10, 10);
    expect(picked).not.toHaveBeenCalled();
    api.dispose();
    host.remove();
  });

  it('follows the host size on resize, and ignores a host with no size', () => {
    let width = 200;
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { configurable: true, get: () => width });
    Object.defineProperty(host, 'clientHeight', { configurable: true, get: () => 100 });
    document.body.appendChild(host);
    const api = initUniverse(host, true, 'gentle');
    renderer.sizes.length = 0;
    width = 320;
    window.dispatchEvent(new Event('resize'));
    expect(renderer.sizes).toEqual([[320, 100]]);
    width = 0;
    api.resize();
    expect(renderer.sizes).toEqual([[320, 100]]);
    api.dispose();
    host.remove();
  });

  it('returns the running universe on a second init, resized, instead of a second renderer', () => {
    const { host, api } = mount();
    const scenes = renderer.scenes.length;
    renderer.sizes.length = 0;
    expect(initUniverse(host, true, 'gentle')).toBe(api);
    expect(renderer.scenes.length).toBe(scenes);
    expect(renderer.sizes).toEqual([[200, 100]]);
    api.dispose();
    host.remove();
  });

  it('reports VR as unsupported without WebXR or when the check fails, and refuses to enter it without WebXR', async () => {
    const { host, api } = mount();
    const nav = navigator as any;
    const before = nav.xr;
    try {
      nav.xr = undefined;
      expect(await api.xrSupported()).toBe(false);
      await expect(api.enterXR()).rejects.toThrow('WebXR is unavailable');
      nav.xr = { isSessionSupported: async () => { throw new Error('denied'); } };
      expect(await api.xrSupported()).toBe(false);
      nav.xr = { isSessionSupported: async (mode: string) => mode === 'immersive-vr' };
      expect(await api.xrSupported()).toBe(true);
    } finally {
      nav.xr = before;
      api.dispose();
      host.remove();
    }
  });
});
