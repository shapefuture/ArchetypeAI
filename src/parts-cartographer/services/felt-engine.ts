import * as THREE from 'three';
import FeltWorker from '../../../felt-atelier/src/worker.js?worker';
import { Pool } from '../../../felt-atelier/src/pool.js';
import { makeGroup } from '../../../felt-atelier/src/assemble.js';
import { toSVG } from '../../../felt-atelier/src/flat.js';
import { feltDna } from '../pal/felt-dna';
import type { Traits, Part } from '../pal/traits';

const pool = new Pool(() => new FeltWorker(), 2);
const sewn = new Map<string, Promise<any>>();
const thumbnails = new Map<string, Promise<string>>();
export function sewFelt(traits: Traits, part?: Part) {
  const dna = feltDna(traits, part);
  const key = JSON.stringify(dna);
  if (!sewn.has(key)) {
    sewn.set(key, pool.request({ op: 'build', dna, lod: 'map' }).then((result: any) => {
      if (!result?.ok) { sewn.delete(key); throw new Error(result?.error ?? 'Felt sewing cancelled'); }
      return result;
    }));
    if (sewn.size > 100) sewn.delete(sewn.keys().next().value!);
  }
  return sewn.get(key)!;
}

/** Every universe node is real stuffed felt, stitched thread and sewn appliqué geometry. */
export async function feltGroup(part: Part): Promise<THREE.Group> {
  const result = await sewFelt(part.traits, part);
  const group = makeGroup(result.parts, result.size, { cloneMaterials: true });
  group.userData.feltSize = result.size;
  group.userData.engine = 'felt-atelier';
  group.traverse((object: any) => { if (object.isMesh) object.userData.partId = part.id; });
  return group;
}

let studio: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null = null;
let thumbnailQueue: Promise<unknown> = Promise.resolve();
function renderThumbnail(result: any): string {
  try {
    if (!studio) {
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(256, 288); renderer.setPixelRatio(1);
      renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .92;
      renderer.setClearColor(0, 0);
      const scene = new THREE.Scene();
      const key = new THREE.DirectionalLight('#fff4e6', 2.3); key.position.set(-4.5, 6, 2.6); scene.add(key);
      const fill = new THREE.DirectionalLight('#e8efff', .6); fill.position.set(4, 1, 4); scene.add(fill);
      scene.add(new THREE.HemisphereLight('#ffffff', '#cfc8bd', .7));
      const camera = new THREE.PerspectiveCamera(24, 256 / 288, .1, 100);
      camera.position.set(0, .12, 4.2); camera.lookAt(0, .08, 0);
      studio = { renderer, scene, camera };
    }
    const group = makeGroup(result.parts, result.size);
    group.rotation.set(-.12, -.18, -.025);
    studio.scene.add(group);
    studio.renderer.render(studio.scene, studio.camera);
    const png = studio.renderer.domElement.toDataURL('image/png');
    studio.scene.remove(group);
    group.traverse((object: any) => { if (object.isMesh) object.geometry.dispose(); });
    return png;
  } catch {
    // The merged engine's own sewn SVG remains available without WebGL.
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSVG(result.flat))}`;
  }
}

/** One shared renderer, never one WebGL context per card. Thumbnails use the same sewn DNA as the universe. */
export function feltThumbnail(traits: Traits): Promise<string> {
  const key = JSON.stringify(traits);
  if (!thumbnails.has(key)) {
    const job = sewFelt(traits).then((result) => {
      const next = thumbnailQueue.then(() => new Promise<string>((resolve) => {
        const render = () => resolve(renderThumbnail(result));
        // Each render is one long task (the first compiles shaders), so wait for a
        // real idle moment instead of forcing it into the first seconds of use.
        if ('requestIdleCallback' in window) window.requestIdleCallback(render, { timeout: 2500 });
        else setTimeout(render, 0);
      }));
      thumbnailQueue = next.catch(() => undefined);
      return next;
    }).catch((error) => { thumbnails.delete(key); throw error; });
    thumbnails.set(key, job);
    if (thumbnails.size > 100) thumbnails.delete(thumbnails.keys().next().value!);
  }
  return thumbnails.get(key)!;
}

export function disposeFeltEngine() {
  pool.dispose(); studio?.renderer.dispose(); studio = null;
  sewn.clear(); thumbnails.clear();
}
if (import.meta.hot) import.meta.hot.dispose(disposeFeltEngine);
