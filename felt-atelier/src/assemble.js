// Host side: turns keyed geometry (from the builder, local or worker) into meshes with shared, cached materials.
import * as THREE from 'three';
import { feltMaterial, threadMaterial, fuzzMaterial } from './materials.js';
import { buildData } from './builder.js';

const mats = new Map();
export function material(key) {
  let m = mats.get(key); if (m) return m;
  const [kind, hex, col, vc] = key.split('|');
  if (kind === 'F') m = feltMaterial('#ffffff', { collection: hex, vertexColors: true });
  else if (kind === 'T') { m = threadMaterial('#ffffff').clone(); m.vertexColors = true; }
  else if (kind === 'f') m = feltMaterial(hex, { collection: col, vertexColors: vc === '1' });
  else if (kind === 't') m = threadMaterial(hex);
  else if (kind === 'z') m = fuzzMaterial(hex);
  else m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).lerp(new THREE.Color('#fff'), 0.15), transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, roughness: 1 });
  mats.set(key, m); return m;
}
/** Warm the material cache (felt textures are the slow part) without blocking: one key per idle slot. */
export function warm(keys) { const q = [...new Set(keys)].filter((k) => !mats.has(k)); const idle = window.requestIdleCallback || ((f) => setTimeout(f, 30)); const step = () => { const k = q.shift(); if (!k) return; material(k); idle(step); }; idle(step); }
export const hasMaterial = (k) => mats.has(k);

export function fromArrays(p) {
  const g = new THREE.BufferGeometry();
  for (const [name, arr] of Object.entries(p.attrs)) g.setAttribute(name, new THREE.BufferAttribute(arr, name === 'uv' ? 2 : 3));
  g.computeBoundingSphere(); return g;
}
export function makeGroup(parts, size, { cloneMaterials = false } = {}) {
  const group = new THREE.Group();
  for (const p of parts) {
    const geo = p.geo || fromArrays(p);
    const shared = material(p.key);
    const mat = cloneMaterials ? shared.clone() : shared;
    const mesh = new THREE.Mesh(geo, mat);
    if (p.key[0] === 'z') mesh.renderOrder = 2; else if (p.key[0] === 'e') mesh.renderOrder = 3; else { mesh.castShadow = true; mesh.receiveShadow = true; }
    group.add(mesh);
  }
  group.scale.setScalar(size); return group;
}
/** Main-thread convenience (used by the lineup harness). */
export function buildCharacter(dna, opts) { const d = buildData(dna, opts); const g = makeGroup(d.parts, d.size); g.userData = { dna, flat: d.flat }; return g; }
