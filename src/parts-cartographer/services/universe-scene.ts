// Lazy Three.js map for the Parts Cartographer UI.
// The same plush Character SVG used by the 2D screens is textured onto a
// shape-matched, lightly extruded 3D body for each map node.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BodyShape, Part } from '../pal/traits';
import { Character, bodyPath } from '../pal/Character';
import {
  archetypeCoordinatePosition,
  archetypeLensOffset,
  dimensionalLensOffset,
  sanitizeArchetypeCoordinates,
  ZERO_DIMENSIONS,
  type ArchetypeCoordinates,
  type UniverseDimensions,
} from './universe-lens';

const BODY_SCALE = 0.0075;
const FAMILY_COLOR: Record<string, string> = {
  manager: '#3B9BFF', firefighter: '#FF8A1F', exile: '#FF2D8A', resource: '#3EE0B0',
};
export interface UniverseAPI {
  wake(): void;
  sleep(): void;
  setParts(parts: Part[]): void;
  setDimensions(dimensions: UniverseDimensions): void;
  onPick(cb: (id: string) => void): void;
  resize(): void;
  dispose(): void;
}

type MapNode = {
  part: Part;
  group: THREE.Group;
  body: THREE.Mesh;
  basePosition: [number, number, number];
  coordinates?: ArchetypeCoordinates;
  phase: number;
  faceMaterial?: THREE.MeshBasicMaterial;
  texture?: THREE.Texture;
};

let api: UniverseAPI | null = null;
let dimensionalExpressions: UniverseDimensions = { ...ZERO_DIMENSIONS };

function makeBodyGeometry(shape: BodyShape): THREE.ExtrudeGeometry {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460"><path fill="#fff" d="${bodyPath(shape)}"/></svg>`;
  const paths = new SVGLoader().parse(svg).paths;
  const shapes = paths.flatMap((path) => SVGLoader.createShapes(path));
  if (!shapes.length) throw new Error(`No 3D body outline for ${shape}`);

  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 22,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 4,
    bevelThickness: 5,
    curveSegments: 12,
    steps: 1,
  });
  geometry.scale(BODY_SCALE, -BODY_SCALE, BODY_SCALE);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function characterSvg(part: Part): string {
  const markup = renderToStaticMarkup(React.createElement(Character, {
    traits: part.traits,
    showShadow: false,
    lite: true,
    textured: false,
  }));
  // React's static renderer omits the XML namespace for inline SVG; image
  // decoding requires it when the markup is used as a standalone document.
  return markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
}

function loadSvgTexture(svg: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      resolve(texture);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode plush character SVG'));
    };
    image.src = objectUrl;
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

export function initUniverse(host: HTMLElement, isDark: boolean): UniverseAPI {
  if (api) { api.resize(); return api; }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 400);
  camera.position.set(0, 0, 46);

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
  const geoCache = new Map<BodyShape, THREE.ExtrudeGeometry>();
  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  let buildVersion = 0;

  function clearParts() {
    buildVersion++;
    for (const node of nodes) {
      partGroup.remove(node.group);
      node.faceMaterial?.dispose();
      node.texture?.dispose();
    }
    nodes.length = 0;
    meshes.length = 0;
  }

  function geometryFor(shape: BodyShape): THREE.ExtrudeGeometry {
    let geometry = geoCache.get(shape);
    if (!geometry) {
      geometry = makeBodyGeometry(shape);
      geoCache.set(shape, geometry);
    }
    return geometry;
  }

  function materialFor(part: Part): THREE.MeshStandardMaterial {
    const color = part.traits.color || FAMILY_COLOR[part.family] || '#ffffff';
    let material = matCache.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.78,
        metalness: 0.02,
        emissive: new THREE.Color(color).multiplyScalar(0.12),
      });
      matCache.set(color, material);
    }
    return material;
  }

  function build(parts: Part[]) {
    clearParts();
    const version = buildVersion;
    parts.forEach((part, index) => {
      let geometry: THREE.ExtrudeGeometry;
      try {
        geometry = geometryFor(part.traits.shape);
      } catch (error) {
        console.warn(`Could not extrude ${part.name}; using a plush placeholder`, error);
        geometry = new THREE.ExtrudeGeometry(new THREE.Shape().absellipse(0, 0, 1.1, 1.3, 0, Math.PI * 2, false, 0), { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 3 });
      }

      const group = new THREE.Group();
      const body = new THREE.Mesh(geometry, materialFor(part));
      const ring = index / Math.max(parts.length, 1);
      const radius = 14 + (index % 4) * 5.2;
      const angle = ring * Math.PI * 2 * 2.4;
      const coordinates = sanitizeArchetypeCoordinates(part.archetype?.coordinates);
      const projected = coordinates ? archetypeCoordinatePosition(coordinates) : null;
      const basePosition: [number, number, number] = projected
        ? projected.map((value, axis) => value + stableJitter(part.id, axis)) as [number, number, number]
        : [
          Math.cos(angle) * radius + (Math.random() - 0.5) * 4,
          Math.sin(angle * 0.7) * 9 + (Math.random() - 0.5) * 5,
          Math.sin(angle) * radius * 0.75 + (Math.random() - 0.5) * 4,
        ];
      group.position.set(...basePosition);
      group.userData.partId = part.id;
      const phase = Math.random() * Math.PI * 2;
      const scale = part.star ? 1.2 : 1;
      group.scale.setScalar(scale);
      body.userData.partId = part.id;
      group.add(body);
      partGroup.add(group);

      const node: MapNode = {
        part,
        group,
        body,
        basePosition,
        coordinates: coordinates ?? undefined,
        phase,
      };
      nodes.push(node);
      meshes.push(body);

      // Generate the exact same plush artwork as the 2D Character component;
      // decode it asynchronously so the map can appear immediately.
      void loadSvgTexture(characterSvg(part)).then((texture) => {
        if (version !== buildVersion || group.parent !== partGroup) {
          texture.dispose();
          return;
        }
        const faceMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.015,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const face = new THREE.Mesh(new THREE.PlaneGeometry(400 * BODY_SCALE, 460 * BODY_SCALE), faceMaterial);
        face.position.set(0, -13 * BODY_SCALE, 0.17);
        face.renderOrder = 1;
        group.add(face);
        node.texture = texture;
        node.faceMaterial = faceMaterial;
      }).catch((error) => console.warn(`Could not texture the map character ${part.id}:`, error));
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
  let raf = 0;
  let t = 0;
  let dragX = 0;

  const onPointer = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (hit && pickCb) pickCb(hit.object.userData.partId);
  };
  renderer.domElement.addEventListener('pointerdown', onPointer);
  const onPointerMove = (event: PointerEvent) => {
    if (event.buttons) dragX += event.movementX * 0.0035;
  };
  renderer.domElement.addEventListener('pointermove', onPointerMove);

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
    raf = requestAnimationFrame(loop);
    t += 0.006;
    partGroup.rotation.y = t * 0.45 + dragX;
    stars.rotation.y = t * 0.05;
    nodes.forEach((node) => {
      const [dx, dy, dz] = node.coordinates
        ? archetypeLensOffset(node.coordinates, dimensionalExpressions)
        : dimensionalLensOffset(node.part.family, dimensionalExpressions);
      node.group.position.x = node.basePosition[0] + dx;
      node.group.position.y = node.basePosition[1] + dy + Math.sin(t * 2 + node.phase) * 0.48;
      node.group.position.z = node.basePosition[2] + dz;
      node.group.rotation.y = Math.sin(t * 0.42 + node.phase) * 0.08;
      node.group.rotation.x = Math.sin(t * 0.33 + node.phase) * 0.035;
    });
    renderer.render(scene, camera);
  };
  loop();

  api = {
    wake() { if (!running) { running = true; loop(); } },
    sleep() { running = false; cancelAnimationFrame(raf); },
    setParts: build,
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
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      clearParts();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointer);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      geoCache.forEach((geometry) => geometry.dispose());
      matCache.forEach((material) => material.dispose());
      starGeo.dispose();
      (stars.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api = null;
    },
  };
  return api;
}
