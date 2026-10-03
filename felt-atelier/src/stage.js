// Neutral studio stage (empty void, soft light). The map supplies its own lights; this matches its light model.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function setupStage(el, W, H, { bg = '#e9e7e3', dpr = Math.max(2, Math.min(3, devicePixelRatio * 2)) } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); // no preserveDrawingBuffer: snapshots read right after render
  renderer.setPixelRatio(dpr); renderer.setSize(W, H);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
  const key = new THREE.DirectionalLight('#fff4e6', 2.3); key.position.set(-4.5, 6, 2.6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.012; key.shadow.radius = 5; key.shadow.blurSamples = 8;
  const sc = key.shadow.camera; sc.left = -1.7; sc.right = 1.7; sc.top = 1.7; sc.bottom = -1.7; sc.near = 0.5; sc.far = 20;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#e8efff', 0.35); fill.position.set(4, 1, 4); scene.add(fill);
  scene.add(new THREE.HemisphereLight('#ffffff', '#cfc8bd', 0.55));
  const camera = new THREE.PerspectiveCamera(24, W / H, 0.1, 100);
  return { renderer, scene, camera, key };
}

/**
 * Resolution scaler. The canvas never changes size; the scene is drawn into a fixed, pre-allocated 4x-MSAA half-float
 * render target using only a sub-rectangle of it, then blitted (tone mapped) to the canvas. Changing the render scale
 * is free: no buffer reallocation, so the adaptive-resolution governor can hold 60 fps without a single-frame hitch.
 */
export class Scaler {
  constructor(renderer, maxScale = 1.5) {
    this.r = renderer; this.maxScale = maxScale; this.scale = maxScale; this.w = 1; this.h = 1;
    const gl = renderer.getContext(); this.ok = !!(renderer.capabilities.isWebGL2 && (renderer.extensions.get('EXT_color_buffer_float') || renderer.extensions.get('EXT_color_buffer_half_float')));
    if (!this.ok) return;
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
    this.uv = new THREE.Vector2(1, 1);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { t: { value: this.rt.texture }, uvs: { value: this.uv } }, depthTest: false, depthWrite: false, toneMapped: true,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D t; uniform vec2 uvs; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv * uvs); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }',
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false;
    this.qs = new THREE.Scene(); this.qs.add(this.quad); this.qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    void gl;
  }
  /** css-pixel size of the stage; allocates the render target once per element resize (rare). */
  resize(w, h) { this.w = w; this.h = h; if (this.ok) this.rt.setSize(Math.ceil(w * this.maxScale), Math.ceil(h * this.maxScale)); }
  render(scene, camera) {
    const r = this.r;
    if (!this.ok) { r.render(scene, camera); return; }
    const s = Math.min(this.maxScale, Math.max(0.4, this.scale)), vw = Math.max(2, Math.round(this.w * s)), vh = Math.max(2, Math.round(this.h * s));
    this.rt.viewport.set(0, 0, vw, vh); this.rt.scissor.set(0, 0, vw, vh); this.rt.scissorTest = true;
    this.uv.set(vw / this.rt.width, vh / this.rt.height);
    r.setRenderTarget(this.rt); r.render(scene, camera);
    r.setRenderTarget(null); r.render(this.qs, this.qc);
  }
}

/** Khronos PBR Neutral tone mapping, same maths as three's shader (so we can invert it on the CPU). */
function neutral(c, E) {
  let [r, g, b] = c.map((v) => v * E); const x = Math.min(r, g, b), off = x < 0.08 ? x - 6.25 * x * x : 0.04; r -= off; g -= off; b -= off;
  const peak = Math.max(r, g, b), S = 0.76; if (peak < S) return [r, g, b];
  const d = 1 - S, np = 1 - (d * d) / (peak + d - S), k = np / peak; r *= k; g *= k; b *= k;
  const gg = 1 - 1 / (0.15 * (peak - np) + 1); return [r + (np - r) * gg, g + (np - g) * gg, b + (np - b) * gg];
}
/** Background colour that survives tone mapping unchanged: bisection on the forward curve. */
export function toneSafeBackground(hex, exposure = 1) {
  const t = new THREE.Color(hex), target = [t.r, t.g, t.b];
  const out = target.map((tv, ch) => { let lo = 0, hi = 8; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const v = target.map((q, j) => (j === ch ? mid : Math.max(0, q * (mid / Math.max(1e-6, tv))))); if (neutral(v, exposure)[ch] < tv) lo = mid; else hi = mid; } return (lo + hi) / 2; });
  return new THREE.Color().setRGB(out[0], out[1], out[2], THREE.LinearSRGBColorSpace);
}
