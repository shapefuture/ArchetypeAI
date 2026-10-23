import { afterEach, describe, expect, it, vi } from 'vitest';

const renderer = vi.hoisted(() => ({ loops: [] as unknown[] }));

// Explicit stubs for the three.js exports the scene touches at init. The renderer records animation-loop calls.
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
    add() { return this; }
    remove() { return this; }
    traverse() {}
  }
  class Material { dispose() {} }
  class Geometry { setAttribute() {} dispose() {} }
  class Light extends Object3D {}
  class Scene extends Object3D {}
  class Group extends Object3D {}
  class Camera extends Object3D {
    aspect = 1;
    updateProjectionMatrix() {}
  }
  class PerspectiveCamera extends Camera {}
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

vi.mock('./felt-engine', () => ({ feltGroup: vi.fn(async () => ({})) }));

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
