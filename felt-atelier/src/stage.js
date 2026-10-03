// Neutral studio stage (empty void, soft light). The map supplies its own lights; this matches its light model.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function setupStage(el, W, H, { bg = '#e9e7e3', dpr = Math.max(2, Math.min(3, devicePixelRatio * 2)) } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr); renderer.setSize(W, H);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
  const key = new THREE.DirectionalLight('#fff4e6', 2.3); key.position.set(-4.5, 6, 2.6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.012; key.shadow.radius = 9; key.shadow.blurSamples = 16;
  const sc = key.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 3; sc.bottom = -3; sc.near = 0.5; sc.far = 20;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#e8efff', 0.35); fill.position.set(4, 1, 4); scene.add(fill);
  scene.add(new THREE.HemisphereLight('#ffffff', '#cfc8bd', 0.55));
  const camera = new THREE.PerspectiveCamera(24, W / H, 0.1, 100);
  return { renderer, scene, camera, key };
}
