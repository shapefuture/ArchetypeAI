// The merged Felt Atelier supplies true stuffed-felt meshes, sewn patches and stitched seams.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Part } from '../pal/traits';
import { sceneClockStep, type MotionMode } from '../core/sensory-preferences';
import { feltGroup } from './felt-engine';
import { bindReducedMotionDamping } from './reduced-motion';
import { ambience } from './ambience-gate';
import {
  archetypeCoordinatePosition,
  sanitizeArchetypeCoordinates,
  ZERO_DIMENSIONS,
  coordinateAffinity, DEFAULT_AXES, normalizeAxes,
  type UniverseAxes, type DimensionKey,
  type ArchetypeCoordinates,
  type UniverseDimensions,
} from './universe-lens';
import { GHOST_FACTOR, isolationUnknown, overlapOffsets, presentationFor } from './universe-3plus1';

/** The words at each end of a plotted axis, and its colour (a CSS hex string), in the reader's language. */
export type GuideSpec = Partial<Record<DimensionKey, { low: string; high: string; color: string }>>;

export interface UniverseAPI {
  wake(): void;
  sleep(): void;
  setParts(parts: Part[]): void;
  setDimensions(dimensions: UniverseDimensions): void;
  setView(options: { axes?: UniverseAxes; isolation?: DimensionKey | null; selectedId?: string | null; unknownText?: string }): void;
  setGuides(guides: GuideSpec): void;
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
  /** An axis the person has not set yet: the part is drawn faded. */
  ghost: boolean;
  /** The +1 channel: a ring for blending, absent when blending is not known. */
  halo: THREE.Mesh | null;
  /** The "unknown" tag in the isolation view, present when this part has no value on the isolated axis (G31, G38). */
  unknownTag?: THREE.Sprite;
  unknownTagText?: string;
  /** The sewn felt character, once it has loaded. */
  felt?: THREE.Object3D;
};
let api: UniverseAPI | null = null;
let dimensionalExpressions: UniverseDimensions = { ...ZERO_DIMENSIONS };
const HALO_RADIUS = 2.3;
const HALO_TUBE = 0.07;
/** How far the axis guides reach from the origin. Parts sit within ±10. */
const GUIDE_REACH = 10.6;
/** Where the end words sit. The canvas is phone-width, so they stay inside about ±13 at the middle distance. */
const GUIDE_LABEL_AT = 9;

function disposeGroup(group: THREE.Object3D) {
  group.traverse((object: any) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    materials.forEach((material: any) => { material.map?.dispose?.(); material.dispose?.(); });
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

/**
 * Camera framing. A narrow lens keeps parts near the camera from ballooning; the distance is chosen so the axes and
 * their end words fit the narrower side of the canvas, which on a phone in portrait is the width.
 */
export const CAMERA_FOV = 38;
/** The radius that must stay in view: the guide reach (10.6) plus room for the end words. */
export const FRAME_RADIUS = 12.5;
/** How far a focused part sits from the camera, at the same apparent size as before the lens change. */
const FOCUS_DISTANCE = 21;
/** The distance the end words were sized for, and the most they grow beyond it. */
const GUIDE_LABEL_BASE_DISTANCE = 45;
const GUIDE_LABEL_GROW_MAX = 1.6;
/** Slightly oblique, so the direction axis does not point straight at the viewer and its words stay clear of the centre. */
const HOME_DIRECTION: [number, number, number] = (() => {
  const length = Math.hypot(13, 9, 42);
  return [13 / length, 9 / length, 42 / length];
})();

/** The most the frame grows to take in outlying parts, so one stray part cannot shrink the whole map. */
export const FRAME_RADIUS_MAX = 18;

/** The radius to keep in view for these part positions: at least FRAME_RADIUS, at most FRAME_RADIUS_MAX. */
export function contentRadius(positions: Array<[number, number, number]>): number {
  const farthest = positions.reduce((max, [x, y, z]) => Math.max(max, Math.hypot(x, y, z) + 1.5), 0);
  return Math.min(FRAME_RADIUS_MAX, Math.max(FRAME_RADIUS, farthest));
}

/** The camera distance at which a sphere of this radius fills the narrower field of view, for this aspect. */
export function frameDistance(aspect: number, radius = FRAME_RADIUS): number {
  const vertical = (CAMERA_FOV * Math.PI) / 360;
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const horizontal = Math.atan(Math.tan(vertical) * safeAspect);
  return radius / Math.sin(Math.min(vertical, horizontal));
}

export function homePosition(aspect: number, radius = FRAME_RADIUS): [number, number, number] {
  const distance = frameDistance(aspect, radius);
  return [HOME_DIRECTION[0] * distance, HOME_DIRECTION[1] * distance, HOME_DIRECTION[2] * distance];
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
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 500);
  camera.position.set(...homePosition(camera.aspect));
  renderer.xr.enabled = true;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 8;
  controls.maxDistance = 180;
  // Until the person turns or zooms the view, a resize re-frames it for the new shape (rotation, a canvas sized late).
  let framed = true;
  let frameRadius = FRAME_RADIUS;
  (controls as any).addEventListener?.('start', () => { framed = false; });
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let motionMode = initialMotionMode;
  const motionDamping = bindReducedMotionDamping(controls, motion, motionMode);
  let axes: UniverseAxes = [...DEFAULT_AXES];
  let isolation: DimensionKey | null = null;
  let unknownText = 'unknown';
  let selectedId: string | null = null;
  let layoutOffsets = new Map<string, [number, number, number]>();
  let guides: GuideSpec = {};
  const guideGroup = new THREE.Group();
  scene.add(guideGroup);
  const labelColour = isDark ? 0xf4efe6 : 0x2b2640;

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

  function clearGuides() {
    for (const child of [...guideGroup.children]) {
      guideGroup.remove(child);
      disposeGroup(child);
    }
  }

  function labelSprite(text: string, colour: number, at: [number, number, number], size: [number, number] = [6.4, 1.2]): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 112;
    const context = canvas.getContext('2d');
    if (context) {
      context.font = '600 46px system-ui, sans-serif';
      context.fillStyle = `#${colour.toString(16).padStart(6, '0')}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
    }
    const material = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false, opacity: 0.92 });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(...at);
    sprite.scale.set(size[0], size[1], 1);
    return sprite;
  }

  /** The three plotted axes with their end words. Hidden in isolation, where the view is one axis against another. */
  function rebuildGuides() {
    clearGuides();
    if (isolation) return;
    axes.forEach((key, index) => {
      const copy = guides[key];
      if (!copy) return;
      const colour = Number.parseInt(copy.color.replace('#', ''), 16);
      const along = (value: number): [number, number, number] => {
        const point: [number, number, number] = [0, 0, 0];
        point[index] = value;
        return point;
      };
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...along(-GUIDE_REACH), ...along(GUIDE_REACH)]), 3));
      guideGroup.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.5 })));
      // Labels sit beside the line, not on it: to the right of the vertical axis, above the others.
      const labelAt = (value: number): [number, number, number] => {
        const point = along(value);
        return index === 1 ? [point[0] + 1.6, point[1], point[2]] : [point[0], point[1] + 0.9, point[2]];
      };
      // The end words grow with the framing distance, so they stay readable when the frame pulls back on a phone.
      const grow = Math.max(1, Math.min(GUIDE_LABEL_GROW_MAX, frameDistance(camera.aspect, frameRadius) / GUIDE_LABEL_BASE_DISTANCE));
      const size: [number, number] = [6.4 * grow, 1.2 * grow];
      guideGroup.add(labelSprite(copy.high, labelColour, labelAt(GUIDE_LABEL_AT), size));
      guideGroup.add(labelSprite(copy.low, labelColour, labelAt(-GUIDE_LABEL_AT), size));
    });
  }

  /**
   * In the isolation view, a part with no value on the isolated axis gets an "unknown" tag. Its position on that axis is a
   * placeholder, so the tag says it is not a value (B12, G31, G38). A part with a value on that axis gets no tag.
   */
  function refreshUnknownTags() {
    for (const node of nodes) {
      const wanted = isolationUnknown(node.part.archetype?.unmeasuredAxes, isolation);
      if (node.unknownTag && (!wanted || node.unknownTagText !== unknownText)) {
        node.group.remove(node.unknownTag);
        disposeGroup(node.unknownTag);
        node.unknownTag = undefined;
      }
      if (wanted && !node.unknownTag) {
        node.unknownTag = labelSprite(unknownText, labelColour, [0, 2.4, 0], [3.6, 0.72]);
        node.unknownTagText = unknownText;
        node.group.add(node.unknownTag);
      }
    }
  }

  /** Where each part sits, with overlapping parts spread for display. Stored coordinates are never changed. */
  function relayout() {
    const placed = nodes.map((node) => ({
      id: node.part.id,
      position: node.coordinates ? archetypeCoordinatePosition(node.coordinates, axes, isolation) : node.basePosition,
    }));
    layoutOffsets = overlapOffsets(placed);
    const radius = contentRadius(placed.map((entry) => entry.position as [number, number, number]));
    const changed = radius !== frameRadius;
    frameRadius = radius;
    if (framed) camera.position.set(...homePosition(camera.aspect, frameRadius));
    if (changed) rebuildGuides();
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
      // Parts with no map coordinates orbit just outside the axes, inside the frame, instead of off the screen.
      const radius = 12 + (index % 4) * 1.4;
      const angle = ring * Math.PI * 2 * 2.4;
      const coordinates = sanitizeArchetypeCoordinates(part.archetype?.coordinates);
      const projected = coordinates ? archetypeCoordinatePosition(coordinates) : null;
      const basePosition: [number, number, number] = projected
        ? projected
        : [
          Math.cos(angle) * radius + stableJitter(part.id, 0),
          Math.sin(angle * 0.7) * 6 + stableJitter(part.id, 1),
          Math.sin(angle) * radius * 0.75 + stableJitter(part.id, 2),
        ];
      group.position.set(...basePosition);
      group.userData.partId = part.id;
      const phase = stableJitter(part.id, 3, Math.PI);
      const scale = part.star ? 1.2 : 1;
      group.scale.setScalar(scale);
      partGroup.add(group);

      const presentation = presentationFor({
        coordinates: coordinates ?? null,
        unmeasuredAxes: part.archetype?.unmeasuredAxes,
        coordinateBasis: part.archetype?.coordinateBasis,
      });
      let halo: THREE.Mesh | null = null;
      if (presentation.halo) {
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: presentation.halo.color,
          transparent: true,
          opacity: presentation.halo.opacity * (presentation.ghost ? GHOST_FACTOR : 1),
          depthWrite: false,
        });
        halo = new THREE.Mesh(new THREE.TorusGeometry(HALO_RADIUS, HALO_TUBE, 8, 56), haloMaterial);
        halo.rotation.x = Math.PI / 2;
        halo.userData.halo = true;
        group.add(halo);
      }

      const node: MapNode = {
        part,
        group,
        basePosition,
        coordinates: coordinates ?? undefined,
        phase,
        ghost: presentation.ghost,
        halo,
      };
      nodes.push(node);
      void feltGroup(part).then((felt) => {
        if (disposed || version !== buildVersion || group.parent !== partGroup) { disposeGroup(felt); return; }
        felt.scale.multiplyScalar(3.2);
        felt.rotation.set(-.12, -.18, -.025);
        group.add(felt);
        node.felt = felt;
        felt.traverse((object: any) => { if (object.isMesh) meshes.push(object); });
        renderer.domElement.dataset.feltCharacters = String(nodes.filter((entry) => entry.felt).length);
      }).catch((error) => { if (!disposed) console.warn('Felt character could not be sewn', error); });

    });
    relayout();
    refreshUnknownTags();
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
    // Every release ends the press, so a drag cannot leave a start behind for a later release to complete as a tap.
    const start = pointerStart;
    pointerStart = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
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
    if (framed) camera.position.set(...homePosition(camera.aspect, frameRadius));
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
      const offset = layoutOffsets.get(node.part.id) ?? [0, 0, 0];
      node.group.position.set(position[0] + offset[0], position[1] + offset[1], position[2] + offset[2]);
      const affinity = node.coordinates ? coordinateAffinity(node.coordinates, dimensionalExpressions, node.part.family === 'resource', node.part.archetype?.unmeasuredAxes ?? []) : 0.5;
      const selected = node.part.id === selectedId;
      const scale = (node.part.archetype?.size ?? 0.8) / 0.8 * (0.6 + (node.part.archetype?.prominence ?? 40) / 100) * (selected ? 1.15 : 1);
      node.group.scale.setScalar(scale);
      node.group.traverse((object: any) => {
        if (!object.isMesh || object.userData.halo) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.transparent = true;
          material.opacity = selected ? 1 : (.45 + affinity * .55) * (node.ghost ? GHOST_FACTOR : 1);
          if ('emissiveIntensity' in material) material.emissiveIntensity = selected ? .25 : affinity * .1;
        }
      });
    });
    renderer.render(scene, camera);
  };
  // The render loop runs only while the screen is awake and ambience is not suspended (hidden page, text entry, error).
  const applyLoop = () => renderer.setAnimationLoop(running && ambience.active ? loop : null);
  const unsubscribeAmbience = ambience.subscribe(() => applyLoop());
  applyLoop();

  api = {
    wake() { if (!running) { running = true; applyLoop(); } },
    sleep() { running = false; applyLoop(); },
    setParts: build,
    setView(options) {
      if (options.axes) axes = normalizeAxes(options.axes);
      if ('isolation' in options) isolation = options.isolation ?? null;
      if ('selectedId' in options) selectedId = options.selectedId ?? null;
      if ('unknownText' in options) unknownText = options.unknownText ?? 'unknown';
      if (options.axes || 'isolation' in options) {
        relayout();
        rebuildGuides();
      }
      refreshUnknownTags();
    },
    setGuides(next) {
      guides = next;
      rebuildGuides();
    },
    focus(id) {
      selectedId = id;
      const node = nodes.find((entry) => entry.part.id === id);
      const target = node ? node.group.position : new THREE.Vector3(0, 0, 0);
      controls.target.copy(target);
      camera.position.copy(target).add(node ? new THREE.Vector3(0, 0, FOCUS_DISTANCE) : new THREE.Vector3(...homePosition(camera.aspect, frameRadius)));
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
        ENERGY: Math.max(-1, Math.min(1, Number(dimensions.ENERGY) || 0)),
        DIRECTION: Math.max(-1, Math.min(1, Number(dimensions.DIRECTION) || 0)),
        DEPTH: Math.max(-1, Math.min(1, Number(dimensions.DEPTH) || 0)),
        BLENDING: Math.max(-1, Math.min(1, Number(dimensions.BLENDING) || 0)),
      };
    },
    onPick(callback) { pickCb = callback; },
    resize: onResize,
    setMotionMode(mode) { motionMode = mode; motionDamping.setMode(mode); },
    dispose() {
      running = false;
      unsubscribeAmbience();
      renderer.setAnimationLoop(null);
      void renderer.xr.getSession()?.end();
      disposed = true;
      motionDamping.dispose();
      controls.dispose();
      clearParts();
      clearGuides();
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
