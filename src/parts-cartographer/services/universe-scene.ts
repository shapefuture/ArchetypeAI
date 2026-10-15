// The merged Felt Atelier supplies true stuffed-felt meshes, sewn patches and stitched seams.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Part } from '../pal/traits';
import { sceneClockStep, type MotionMode } from '../core/sensory-preferences';
import { feltGroup } from './felt-engine';
import { bindReducedMotionDamping } from './reduced-motion';
import {
  archetypeCoordinatePosition,
  dimensionalLensOffset,
  sanitizeArchetypeCoordinates,
  ZERO_DIMENSIONS,
  coordinateAffinity, DEFAULT_AXES,
  type UniverseAxes, type DimensionKey,
  type ArchetypeCoordinates,
  type UniverseDimensions,
} from './universe-lens';

export interface UniverseAPI {
  wake(): void;
  sleep(): void;
  setParts(parts: Part[]): void;
  setDimensions(dimensions: UniverseDimensions): void;
  setView(options: { axes?: UniverseAxes; isolation?: DimensionKey | null; selectedId?: string | null }): void;
  focus(id: string | null): void;
  xrSupported(): Promise<boolean>;
  enterXR(): Promise<void>;
  onPick(cb: (id: string) => void): void;
  resize(): void;
  setMotionMode(mode: MotionMode): void;
  dispose(): void;
}

type MapNode = {
  part: Part;
  group: THREE.Group;
  basePosition: [number, number, number];
  coordinates?: ArchetypeCoordinates;
  phase: number;
};
let api: UniverseAPI | null = null;
let dimensionalExpressions: UniverseDimensions = { ...ZERO_DIMENSIONS };

function disposeGroup(group: THREE.Group) {
  group.traverse((object: any) => {
    if (object.isMesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: THREE.Material) => material.dispose());
    }
  });
}

function stableJitter(id: string, axis: number, amplitude = 2.2): number {
  let hash = (axis + 1) * 374761393;
  for (let index = 0; index < id.length; index++) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 668265263);
    hash = (hash << 13) | (hash >>> 19);
  }
  const unit = ((hash >>> 0) / 0xffffffff) * 2 - 1;
  return unit * amplitude;
}

export function initUniverse(host: HTMLElement, isDark: boolean, initialMotionMode: MotionMode = 'lively'): UniverseAPI {
  if (api) { api.resize(); return api; }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 400);
  camera.position.set(0, 0, 46);
  renderer.xr.enabled = true;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 8;
  controls.maxDistance = 110;
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let motionMode = initialMotionMode;
  const motionDamping = bindReducedMotionDamping(controls, motion, motionMode);
  let axes: UniverseAxes = [...DEFAULT_AXES];
  let isolation: DimensionKey | null = null;
  let selectedId: string | null = null;

  // --- star dust ---
  const starGeo = new THREE.BufferGeometry();
  const starCount = 900;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 220;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 160;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 220;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: isDark ? 0xf4efe6 : 0x5a5470,
    size: 0.42,
    sizeAttenuation: true,
    transparent: true,
    opacity: isDark ? 0.85 : 0.55,
  }));
  scene.add(stars);

  const partGroup = new THREE.Group();
  scene.add(partGroup);
  const nodes: MapNode[] = [];
  const meshes: THREE.Mesh[] = [];
  let buildVersion = 0;
  let partsSignature = '';
  let disposed = false;
  function clearParts() {
    buildVersion++;
    for (const node of nodes) { partGroup.remove(node.group); disposeGroup(node.group); }
    nodes.length = 0; meshes.length = 0;
  }

  function build(parts: Part[]) {
    const signature = JSON.stringify(parts);
    if (signature === partsSignature) return;
    partsSignature = signature;
    clearParts();
    const version = buildVersion;
    parts.forEach((part, index) => {
      const group = new THREE.Group();
      const ring = index / Math.max(parts.length, 1);
      const radius = 14 + (index % 4) * 5.2;
      const angle = ring * Math.PI * 2 * 2.4;
      const coordinates = sanitizeArchetypeCoordinates(part.archetype?.coordinates);
      const projected = coordinates ? archetypeCoordinatePosition(coordinates) : null;
      const basePosition: [number, number, number] = projected
        ? projected
        : [
          Math.cos(angle) * radius + stableJitter(part.id, 0),
          Math.sin(angle * 0.7) * 9 + stableJitter(part.id, 1),
          Math.sin(angle) * radius * 0.75 + stableJitter(part.id, 2),
        ];
      group.position.set(...basePosition);
      group.userData.partId = part.id;
      const phase = stableJitter(part.id, 3, Math.PI);
      const scale = part.star ? 1.2 : 1;
      group.scale.setScalar(scale);
      partGroup.add(group);

      const node: MapNode = {
        part,
        group,
        basePosition,
        coordinates: coordinates ?? undefined,
        phase,
      };
      nodes.push(node);
      void feltGroup(part).then((felt) => {
        if (disposed || version !== buildVersion || group.parent !== partGroup) { disposeGroup(felt); return; }
        felt.scale.multiplyScalar(3.2);
        felt.rotation.set(-.12, -.18, -.025);
        group.add(felt);
        felt.traverse((object: any) => { if (object.isMesh) meshes.push(object); });
        renderer.domElement.dataset.feltCharacters = String(nodes.filter((node) => node.group.children.length).length);
      }).catch((error) => { if (!disposed) console.warn('Felt character could not be sewn', error); });

    });
  }

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.72 : 1.0));
  const key = new THREE.DirectionalLight(0xfff3c4, isDark ? 1.35 : 1.1);
  key.position.set(12, 18, 20);
  scene.add(key);
  const rim = new THREE.PointLight(0x8b6cff, 48, 120);
  rim.position.set(-30, -10, -20);
  scene.add(rim);

  // interaction
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pickCb: ((id: string) => void) | null = null;
  let running = true;
  let t = 0;
  let pointerStart: { x: number; y: number } | null = null;

  const onPointerStart = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };

  const onPointer = (event: PointerEvent) => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) return;
    pointerStart = null;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (hit && pickCb) pickCb(hit.object.userData.partId);
  };
  renderer.domElement.addEventListener('pointerdown', onPointerStart);
  renderer.domElement.addEventListener('pointerup', onPointer);

  const onResize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', onResize);

  const loop = () => {
    if (!running) return;
    t += sceneClockStep(motionMode, !!motion?.matches);
    controls.update();
    stars.rotation.y = t * 0.05;
    nodes.forEach((node) => {
      const position = node.coordinates ? archetypeCoordinatePosition(node.coordinates, axes, isolation) : node.basePosition;
      const [dx, dy, dz] = node.coordinates ? [0, 0, 0] : dimensionalLensOffset(node.part.family, dimensionalExpressions);
      node.group.position.set(position[0] + dx, position[1] + dy, position[2] + dz);
      const affinity = node.coordinates ? coordinateAffinity(node.coordinates, dimensionalExpressions, node.part.family === 'resource') : 0.5;
      const selected = node.part.id === selectedId;
      const scale = (node.part.archetype?.size ?? 0.8) / 0.8 * (0.6 + (node.part.archetype?.prominence ?? 40) / 100) * (selected ? 1.15 : 1);
      node.group.scale.setScalar(scale);
      node.group.traverse((object: any) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.transparent = true;
          material.opacity = selected ? 1 : .45 + affinity * .55;
          if ('emissiveIntensity' in material) material.emissiveIntensity = selected ? .25 : affinity * .1;
        }
      });
    });
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  api = {
    wake() { if (!running) { running = true; renderer.setAnimationLoop(loop); } },
    sleep() { running = false; renderer.setAnimationLoop(null); },
    setParts: build,
    setView(options) {
      if (options.axes) axes = options.axes;
      if ('isolation' in options) isolation = options.isolation ?? null;
      if ('selectedId' in options) selectedId = options.selectedId ?? null;
    },
    focus(id) {
      selectedId = id;
      const node = nodes.find((entry) => entry.part.id === id);
      const target = node ? node.group.position : new THREE.Vector3(0, 0, 0);
      controls.target.copy(target);
      camera.position.copy(target).add(new THREE.Vector3(0, 0, node ? 14 : 46));
      controls.update();
    },
    async xrSupported() {
      try { return !!(await (navigator as any).xr?.isSessionSupported('immersive-vr')); } catch { return false; }
    },
    async enterXR() {
      if (!(navigator as any).xr) throw new Error('WebXR is unavailable');
      const session = await (navigator as any).xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
      await renderer.xr.setSession(session);
    },
    setDimensions(dimensions) {
      dimensionalExpressions = {
        AGENCY: Math.max(-1, Math.min(1, Number(dimensions.AGENCY) || 0)),
        TEMPERATURE: Math.max(-1, Math.min(1, Number(dimensions.TEMPERATURE) || 0)),
        FOCUS: Math.max(-1, Math.min(1, Number(dimensions.FOCUS) || 0)),
        ATTACHMENT: Math.max(-1, Math.min(1, Number(dimensions.ATTACHMENT) || 0)),
      };
    },
    onPick(callback) { pickCb = callback; },
    resize: onResize,
    setMotionMode(mode) { motionMode = mode; motionDamping.setMode(mode); },
    dispose() {
      running = false;
      renderer.setAnimationLoop(null);
      void renderer.xr.getSession()?.end();
      disposed = true;
      motionDamping.dispose();
      controls.dispose();
      clearParts();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerStart);
      renderer.domElement.removeEventListener('pointerup', onPointer);
      starGeo.dispose();
      (stars.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api = null;
    },
  };
  return api;
}
