import { Injectable, signal, computed, effect, inject, NgZone } from '@angular/core';

import * as THREE from 'three';
import { Timer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { TranslationService } from './translation.service';
import { FeltCharacterService } from './felt-character.service';
import { loadLooks, sticker } from '../shared/features/landing/stickers';
import { gsap } from 'gsap';



// --- TYPES + DATA live in universe-state.service (eager, three-free) ---
// Re-exported here so existing imports keep resolving; the renderer below
// consumes the same UniverseStateService signals every pre-universe panel does.
import {
  UniverseStateService,
  ALL_ARCHETYPES,
  DIMENSIONS_DATA,
  DIMENSION_KEYS,
  FAMILY_META,
  POSITION_SCALE,
  GENESIS_ANCHOR_ID,
  buildDynamicRelationalIds,
  effectiveLook,
  type Archetype,
  type ClusterId,
  type Dimension,
  type DimensionalExpressions,
  type PartUniverseCopy,
} from './universe-state.service';
export {
  ALL_ARCHETYPES,
  buildDynamicRelationalIds,
  effectiveLook,
  type Archetype,
  type ClusterId,
  type Dimension,
  type DimensionalExpressions,
  type PartUniverseCopy,
};

// --- NIGHT-SKY OBSERVATORY SHADER SYSTEM ---
// Shared, correct simplex noise. (The previous dead shaders could never
// compile — this block is the fixed, now-wired version.)
const SNOISE3D_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
    vec4 x_ = floor(j * (1.0 / 7.0));
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * 0.142857142857 + 0.5 * 0.142857142857;
    vec4 y = y_ * 0.142857142857 + 0.5 * 0.142857142857;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

// Attachment legibility channel A — ANXIOUS side: an energetic, reaching corona.
// Noise-displaced shell whose agitation scales with anxious attachment.
const ANXIOUS_SHELL = {
  vertex: `
    uniform float uTime; uniform float uAttachment; uniform float uReveal;
    varying float vNoise;
    ${SNOISE3D_GLSL}
    void main() {
      float noise = snoise(position * 3.0 + uTime * 0.55);
      vNoise = noise;
      vec3 displaced = position + normal * noise * 0.22 * uAttachment;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }`,
  fragment: `
    uniform vec3 uColor; uniform float uAttachment; uniform float uReveal; uniform float uTime;
    varying float vNoise;
    void main() {
      float intensity = smoothstep(-0.5, 1.0, vNoise) * 0.8 + 0.2;
      float flicker = 0.85 + 0.15 * sin(uTime * 3.2 + vNoise * 6.0);
      float alpha = intensity * uAttachment * 0.5 * uReveal * flicker;
      gl_FragColor = vec4(uColor * intensity * 1.35, alpha);
    }`
};

// Attachment legibility channel B — AVOIDANT side: a smooth, absorptive veil.
// A fresnel shell that reads as a cool distance-field around the part.
const AVOIDANT_SHELL = {
  vertex: `
    varying vec3 vNormal; varying vec3 vViewDirection;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vViewDirection = normalize(cameraPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragment: `
    uniform vec3 uColor; uniform float uAttachment; uniform float uReveal; uniform float uTime;
    varying vec3 vNormal; varying vec3 vViewDirection;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float vnoise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    void main() {
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection))), 2.4);
      float shimmer = vnoise(vNormal.xy * 4.0 + uTime * 0.25) * 0.25 + 0.75;
      float rim = smoothstep(0.25, 0.9, fresnel) * shimmer;
      float alpha = rim * abs(uAttachment) * 0.55 * uReveal;
      gl_FragColor = vec4(uColor * (0.7 + rim * 0.6), alpha);
    }`
};


// --- SIGGRAPH-TIER POST-PROCESSING SHADERS ---
const SKETCHY_OUTLINE_SHADER = {
  uniforms: {
    'tDiffuse': { value: null },
    'resolution': { value: new THREE.Vector2() },
    'uTime': { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float uTime;
    varying vec2 vUv;

    // Luminance helper
    float getLuma(vec4 color) {
      return dot(color.rgb, vec3(0.299, 0.587, 0.114));
    }

    // Hash function for parchment grain
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
      vec4 baseColor = texture2D(tDiffuse, vUv);
      
      // Sobel Edge Detection (Luminance based)
      float l00 = getLuma(texture2D(tDiffuse, vUv + texel * vec2(-1, -1)));
      float l10 = getLuma(texture2D(tDiffuse, vUv + texel * vec2( 0, -1)));
      float l20 = getLuma(texture2D(tDiffuse, vUv + texel * vec2( 1, -1)));
      float l01 = getLuma(texture2D(tDiffuse, vUv + texel * vec2(-1,  0)));
      float l21 = getLuma(texture2D(tDiffuse, vUv + texel * vec2( 1,  0)));
      float l02 = getLuma(texture2D(tDiffuse, vUv + texel * vec2(-1,  1)));
      float l12 = getLuma(texture2D(tDiffuse, vUv + texel * vec2( 0,  1)));
      float l22 = getLuma(texture2D(tDiffuse, vUv + texel * vec2( 1,  1)));

      float Gx = l00 + 2.0 * l01 + l02 - (l20 + 2.0 * l21 + l22);
      float Gy = l00 + 2.0 * l10 + l20 - (l02 + 2.0 * l12 + l22);
      float G = sqrt(Gx * Gx + Gy * Gy);

      // Procedural "Ink" Wobble (Wavy edges)
      float ripple = sin(vUv.y * 400.0 + uTime * 2.0) * 0.0002 + sin(vUv.x * 400.0 - uTime * 1.5) * 0.0002;
      float edge = smoothstep(0.12 + ripple, 0.45 + ripple, G); // Softer threshold
      
      // Parchment Texture Overlay
      float noise = hash(vUv * 600.0 + sin(uTime * 0.005)) * 0.04;
      float parchment = 1.0 - noise;
      
      vec3 inkColor = vec3(0.14, 0.13, 0.19); // night ink — cool so it reads on the indigo sky
      vec3 finalColor = mix(baseColor.rgb * parchment, inkColor, edge * 0.6); 
      
      gl_FragColor = vec4(finalColor, baseColor.a);
    }`
};


// --- SIGGRAPH-TIER ILLUSTRATION SHADERS ---

const ILLUSTRATED_BLOB_SHADER = {
  vertex: `
    uniform float uTime;
    uniform float uJiggle;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;

    // Classic Perlin Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
      vec4 x_ = floor(j * (1.0 / 7.0));
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * 0.142857142857 + 0.5 * 0.142857142857;
      vec4 y = y_ * 0.142857142857 + 0.5 * 0.142857142857;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      // Increased frequency and speed for more organic wobbly feel
      float noise = snoise(position * 3.5 + uTime * 0.7);
      vNoise = noise;
      
      // Animated "Hand-drawn" wobble - increased amplitude
      vec3 pos = position + normal * noise * 0.35 * (1.0 + uJiggle);
      
      // Squash and stretch based on jiggle
      pos.y *= (1.0 + uJiggle * 0.3);
      pos.xz *= (1.0 - uJiggle * 0.15);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragment: `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;

    void main() {
      // Base color with noise-driven watercolor effect, stronger contrast
      float highlight = smoothstep(0.2, 0.8, vNoise) * 0.4;
      vec3 baseColor = uColor + highlight;
      
      // Ink outline fake (rim lighting based on normal and view vector)
      float fresnel = 1.0 - dot(vNormal, vec3(0,0,1));
      float outline = smoothstep(0.65, 0.8, fresnel);
      
      // Midnight Ink color mix
      vec3 inkColor = vec3(0.18, 0.16, 0.15);
      vec3 finalColor = mix(baseColor, inkColor, outline * 0.95); 
      
      gl_FragColor = vec4(finalColor, 1.0);
    }

  `
};



// The 3D subject — a living watercolor celestial body ("storybook blob, starlit").
// Wobbling body + wrapped two-tone shading + a luminous fresnel rim (the night-sky
// adaptation of the ink outline) + a highlight-driven heart glow that feeds bloom.
const CELESTIAL_BLOB_SHADER = {
  vertex: `
    uniform float uTime;
    uniform float uJiggle;
    uniform float uHighlight;
    varying vec3 vWorldNormal;
    varying vec3 vViewDir;
    varying float vNoise;
    ${SNOISE3D_GLSL}
    void main() {
      vNoise = snoise(position * 3.0 + uTime * 0.35);
      float amp = 0.14 + uHighlight * 0.08;
      vec3 pos = position + normal * vNoise * amp * (1.0 + uJiggle * 2.0);
      pos.y *= (1.0 + uJiggle * 0.25);
      pos.xz *= (1.0 - uJiggle * 0.12);
      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }`,
  fragment: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uHighlight;
    uniform float uTime;
    uniform vec3 uLightDir;
    varying vec3 vWorldNormal;
    varying vec3 vViewDir;
    varying float vNoise;
    void main() {
      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(vViewDir);
      vec3 L = normalize(uLightDir);
      float grain = fract(sin(dot(N.xy * 40.0 + vNoise, vec2(12.9898, 78.233))) * 43758.5453);
      float diffuse = dot(N, L) * 0.5 + 0.5;
      float mottle = smoothstep(-0.45, 0.9, vNoise) * 0.3;
      vec3 deep = uColor * 0.52;
      vec3 lit = uColor * 1.18;
      vec3 base = mix(deep, lit, diffuse * 0.72 + mottle * 0.28);
      base += (grain - 0.5) * 0.035; // paper grain in the watercolor
      float heart = 0.6 + 0.4 * sin(uTime * 2.0);
      base += uColor * uHighlight * (0.55 + 0.35 * heart);
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.4);
      vec3 rimLight = mix(uColor * 1.5, vec3(1.0, 0.93, 0.78), 0.35);
      vec3 col = mix(base, rimLight, smoothstep(0.35, 0.95, fresnel) * 0.85);
      float alpha = uOpacity * (0.92 + fresnel * 0.08);
      gl_FragColor = vec4(col, alpha);
    }`
};

// --- GPU STARFIELD (adapted from the starry-sky-visualization reference) ---
// Per-star twinkle phase, B-V color temperature, diffraction spikes on the
// brightest stars, additive blending. Buffers are magnitude-sorted so any
// drawRange cut keeps the brightest stars on screen.
const STAR_VERTEX_SHADER = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aFlag;
  uniform float uTime;
  uniform float uTwinkleAmp;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vFlag;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mvPosition.z, 1.0);
    float flicker = sin(uTime * 3.1 + aPhase) * sin(uTime * 0.9 + aPhase * 2.3);
    vTwinkle = clamp(1.0 + uTwinkleAmp * flicker * 0.6, 0.15, 1.7);
    float perspectiveSize = (uSizeScale * aSize * 380.0) / dist;
    gl_PointSize = clamp(perspectiveSize * uPixelRatio, 1.0, 56.0);
    vColor = aColor;
    vFlag = aFlag;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const STAR_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vFlag;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    float core = smoothstep(1.0, 0.0, d);
    float glow = pow(core, 1.9);
    float spike = 0.0;
    if (vFlag > 0.5) {
      float ax = abs(uv.x);
      float ay = abs(uv.y);
      spike += pow(max(0.0, 1.0 - ax * 16.0), 3.0) * step(ay, 0.05);
      spike += pow(max(0.0, 1.0 - ay * 16.0), 3.0) * step(ax, 0.05);
    }
    float alpha = clamp(glow + spike * 0.5, 0.0, 1.0) * vTwinkle;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor * alpha, alpha);
  }
`;

/** Tilted "galactic" frame shared by the sky shader and the star band. */
const GALACTIC_PLANE_NORMAL = new THREE.Vector3(0.25, 0.92, 0.3).normalize();
const GALACTIC_CORE_DIR = (() => {
  const raw = new THREE.Vector3(0.62, 0.12, -0.72).normalize();
  return raw.clone().addScaledVector(GALACTIC_PLANE_NORMAL, -raw.dot(GALACTIC_PLANE_NORMAL)).normalize();
})();

/** B-V color temperature -> sRGB (Tanner Helland fit fed by Ballesteros B-V->K). */
function bvToRGB(bvRaw: number): [number, number, number] {
  const bv = Math.min(2.0, Math.max(-0.4, bvRaw));
  const kelvin = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  const t = kelvin / 100;
  const cl = (v: number) => Math.min(1, Math.max(0, v / 255));
  let r: number, g: number, b: number;
  if (t <= 66) r = 255; else r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  if (t <= 66) g = 99.4708025861 * Math.log(t) - 161.1195681661;
  else g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  if (t >= 66) b = 255; else if (t <= 19) b = 0;
  else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [cl(r), cl(g), cl(b)];
}

/** Inverse-CDF sech^2 sample around the galactic plane -> real band shape. */
function sampleSech2(scale: number): number {
  const u = Math.random();
  const t = Math.max(-0.995, Math.min(0.995, 2 * u - 1));
  return scale * Math.atanh(t);
}

interface StarFieldBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  flags: Float32Array;
}

/** Magnitude-sorted star buffers (brightest-first, power-law magnitudes). */
function generateStarFieldBuffers(count: number, innerRadius: number, outerRadius: number): StarFieldBuffers {
  const up = Math.abs(GALACTIC_PLANE_NORMAL.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(up, GALACTIC_PLANE_NORMAL).normalize();
  const bitangent = new THREE.Vector3().crossVectors(GALACTIC_PLANE_NORMAL, tangent).normalize();
  const bandCount = Math.round(count * 0.62);

  const raw: { pos: THREE.Vector3; mag: number; bv: number }[] = [];
  for (let i = 0; i < count; i++) {
    const isBand = i < bandCount;
    let dir: THREE.Vector3;
    if (isBand) {
      const az = Math.random() * Math.PI * 2;
      const lat = sampleSech2(0.11);
      const cosLat = Math.cos(lat);
      dir = new THREE.Vector3()
        .addScaledVector(tangent, Math.cos(az) * cosLat)
        .addScaledVector(bitangent, Math.sin(az) * cosLat)
        .addScaledVector(GALACTIC_PLANE_NORMAL, Math.sin(lat))
        .normalize();
    } else {
      const phi = Math.random() * Math.PI * 2;
      const cosTheta = Math.random() * 2 - 1;
      const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
      dir = new THREE.Vector3(Math.cos(phi) * sinTheta, cosTheta, Math.sin(phi) * sinTheta);
    }
    const radius = isBand
      ? innerRadius + Math.random() * (outerRadius - innerRadius) * 0.45
      : innerRadius + (outerRadius - innerRadius) * (0.55 + Math.random() * 0.45);
    raw.push({
      pos: dir.multiplyScalar(radius),
      mag: -1.4 + Math.pow(Math.random(), 0.42) * 8.6,
      bv: -0.3 + Math.pow(Math.random(), 1.6) * 2.2,
    });
  }
  raw.sort((a, b) => a.mag - b.mag);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const flags = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const s = raw[i];
    positions[i * 3] = s.pos.x;
    positions[i * 3 + 1] = s.pos.y;
    positions[i * 3 + 2] = s.pos.z;
    const [r, g, b] = bvToRGB(s.bv);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    sizes[i] = Math.min(Math.pow(2.512, (7.0 - s.mag) / 2.5) * 0.16, 7.5);
    phases[i] = Math.random() * Math.PI * 2;
    flags[i] = s.mag < 1.2 ? 1 : 0;
  }
  return { positions, colors, sizes, phases, flags };
}


// --------------------------------------------------------------- quality governor
// zero-r-v3 PERFORMANCE.md contract: degrade in the ordered sequence
// ambient → density → blur → identity-post; recover with hysteresis once
// the device proves headroom. Metrics: p95 of rAF-to-rAF frame deltas, p95
// of pointer→frame input latency, and long-task count from
// PerformanceObserver (catches GC/JIT stalls a frame average smooths over).

/** 3 = ultra · 2 = high · 1 = standard · 0 = raw (no post chain). */
export type QualityTier = 3 | 2 | 1 | 0;

const TIER_STAR_FRACTION = [0.22, 0.4, 0.65, 1.0] as const;

class QualityGovernor {
  private static readonly FRAME_BUF = 120;
  private static readonly INTERACT_BUF = 40;

  tier: QualityTier;
  readonly maxTier: QualityTier;

  private frames: number[] = [];
  private interactions: number[] = [];
  private longTasks = 0;
  private longTaskWindowStart = 0;
  private lastChangeAt = 0;
  private goodSince = 0;
  private pendingPointerAt = 0;
  private observer: PerformanceObserver | null = null;

  constructor(maxTier: QualityTier) {
    this.maxTier = maxTier;
    this.tier = maxTier; // optimistic start at the capability ceiling
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (e.duration > 50) this.longTasks++;
        });
        this.observer.observe({ type: 'longtask', buffered: false });
      } catch { /* longtask unsupported — frame p95 still drives tiers */ }
    }
  }

  pointerDown(): void { this.pendingPointerAt = performance.now(); }

  /** Fold the pending pointer into an input→frame latency sample (once per frame). */
  collectInteraction(frameStart: number): void {
    if (this.pendingPointerAt) {
      this.push(this.interactions, frameStart - this.pendingPointerAt, QualityGovernor.INTERACT_BUF);
      this.pendingPointerAt = 0;
    }
  }

  frame(ms: number): void { this.push(this.frames, ms, QualityGovernor.FRAME_BUF); }

  private push(buf: number[], v: number, cap: number): void {
    buf.push(v);
    if (buf.length > cap) buf.shift();
  }

  private p95(buf: number[]): number {
    if (buf.length < 20) return 0; // not enough evidence yet
    const s = [...buf].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  }

  /** Evaluate transitions. Returns the new tier when it changes, else null. */
  tick(now: number): QualityTier | null {
    // Long-task window: count only the last 10s of samples.
    if (now - this.longTaskWindowStart > 10_000) {
      this.longTasks = 0;
      this.longTaskWindowStart = now;
    }
    const f = this.p95(this.frames);
    const i = this.p95(this.interactions);
    const lt = this.longTasks;

    // zero-r thresholds, extended with a raw floor.
    let indicated: QualityTier;
    if (f > 34 || lt > 12) indicated = 0;                        // crisis: drop the chain
    else if (f > 18 || i > 40 || lt > 8) indicated = 1;          // standard
    else if (f > 11 || i > 20 || lt > 4) indicated = 2;          // high
    else indicated = 3;                                           // ultra

    // Degrade immediately (protected by a short cooldown so one stall
    // doesn't ratchet through every tier), but never above the ceiling.
    if (indicated < this.tier && now - this.lastChangeAt > 1_500) {
      // degrade ONE step at a time — the ordered sequence must be walked,
      // not skipped, so the visual regression stays legible.
      return this.set(this.tier - 1 as QualityTier, now);
    }

    // Recover: only when metrics are fully clean for 3s continuous,
    // one step at a time, with a longer cooldown to prevent oscillation.
    const clean = f > 0 && f <= 11 && (i === 0 || i <= 20) && lt <= 4 && indicated === 3;
    if (clean) {
      if (!this.goodSince) this.goodSince = now;
      if (this.tier < this.maxTier && indicated > this.tier &&
          now - this.goodSince > 3_000 && now - this.lastChangeAt > 6_000) {
        return this.set(this.tier + 1 as QualityTier, now);
      }
    } else {
      this.goodSince = 0;
    }
    return null;
  }

  private set(tier: QualityTier, now: number): QualityTier {
    this.tier = tier;
    this.lastChangeAt = now;
    this.goodSince = 0;
    return tier;
  }

  stop(): void { this.observer?.disconnect(); this.observer = null; }
}


@Injectable({ providedIn: 'root' })
export class VisualizationService {
  private translationService = inject(TranslationService);
  private feltCharacters = inject(FeltCharacterService);
  private ngZone = inject(NgZone);


  // --- PUBLIC STATE (forwarded from UniverseStateService — one source of truth) ---
  private readonly universeState = inject(UniverseStateService);
  readonly allArchetypes = this.universeState.allArchetypes;
  readonly dimensions = this.universeState.dimensions;
  readonly allClusters = this.universeState.allClusters;
  readonly focusedArchetype = this.universeState.focusedArchetype;
  readonly selectedArchetype = this.universeState.selectedArchetype;
  readonly isolatedDimension = this.universeState.isolatedDimension;
  readonly personalConstellation = this.universeState.personalConstellation;
  readonly isComparing = this.universeState.isComparing;
  readonly firstComparisonArchetype = this.universeState.firstComparisonArchetype;
  readonly dimensionalExpressions = this.universeState.dimensionalExpressions;
  readonly activeClusterFilters = this.universeState.activeClusterFilters;

  // --- PRIVATE THREE.JS MEMBERS ---
  private renderer!: THREE.WebGLRenderer;
  private labelRenderer!: CSS2DRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private controls!: OrbitControls;

  private timer = new Timer();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  // Performance monitoring
  private frameCount = 0;
  readonly sceneReady = signal(false);

  // Night-sky observatory members
  private starField?: THREE.Points;
  private starMaterial?: THREE.ShaderMaterial;
  private sketchyOutlinePass?: ShaderPass;
  private bloomPass?: UnrealBloomPass;
  /** Adaptive quality governor (p95 frames + input latency + longtasks). */
  private governor?: QualityGovernor;
  private tier: QualityTier = 3;
  private starMax = 9000;
  private readonly isMobileDevice =
    typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  private readonly prefersReducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lastInteractionTime = performance.now();
  private readonly idleDriftDelayMs = 6000;

  private archetypeObjects: THREE.Group[] = [];
  private gridGroups: THREE.Group = new THREE.Group();
  private relationalTethersGroup: THREE.Group = new THREE.Group();
  private tetherMaterials: THREE.LineDashedMaterial[] = [];
  private constellationLinesGroup: THREE.Group = new THREE.Group();
  private axisLabels: { [key: string]: CSS2DObject } = {};


  private focusTag: CSS2DObject | null = null;
  private animationState = { running: false, progress: 0, duration: 4 };
  private isDragging = false;
  private isPointerDown = false;
  private readonly dragThreshold = 5;
  private pointerDownPosition = new THREE.Vector2();
  private archetypeFocusOffset = new THREE.Vector3();
  private hoverDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

  private activeCreationEffects: {
    points: THREE.Points;
    startTime: number;
    duration: number;
  }[] = [];

  // New properties for SIGGRAPH-tier visuals
  private backgroundMaterial?: THREE.ShaderMaterial;
  private dustParticles?: THREE.Points;

  // Private vectors for performance
  private vec3_1 = new THREE.Vector3();
  private vec3_2 = new THREE.Vector3();
  private vec3_3 = new THREE.Vector3();
  private vec3_origin = new THREE.Vector3(0, 0, 0);
  private animationFrameId = 0;


  private readonly labelsInfo = {
    active: { key: 'agencyHypo', pos: new THREE.Vector3(-POSITION_SCALE * 1.1, 0, 0), color: '#E1846D' },
    receptive: { key: 'agencyHyper', pos: new THREE.Vector3(POSITION_SCALE * 1.1, 0, 0), color: '#E1846D' },
    cool: { key: 'temperatureHypo', pos: new THREE.Vector3(0, -POSITION_SCALE * 1.1, 0), color: '#D989B3' },
    hot: { key: 'temperatureHyper', pos: new THREE.Vector3(0, POSITION_SCALE * 1.1, 0), color: '#D989B3' },
    self: { key: 'focusHypo', pos: new THREE.Vector3(0, 0, -POSITION_SCALE * 1.1), color: '#14B8A6' },
    other: { key: 'focusHyper', pos: new THREE.Vector3(0, 0, POSITION_SCALE * 1.1), color: '#14B8A6' },
  };

  constructor() {
    effect(() => this.handleFocusChange(this.focusedArchetype()));
    effect(() => this.updateTethers());
    effect(() => this.handleIsolationChange(this.isolatedDimension()));
    effect(() => { // Handle camera offset for docked HUD
      const selected = this.selectedArchetype() || this.firstComparisonArchetype();
      this.archetypeFocusOffset.set(selected ? 5 : 0, selected ? 2 : 0, 0);
    });
    effect(() => {
      const lang = this.translationService.getLanguage();
      Object.entries(this.labelsInfo).forEach(([key, l]) => {
        if (this.axisLabels[key]) {
          this.axisLabels[key].element.textContent = this.translationService.t(l.key, 'universe.dimensions');
        }
      });
      // Update archetype labels
      this.allArchetypes().forEach((archetype, i) => {
        const group = this.archetypeObjects[i];
        if (group) {
          const label = group.getObjectByName('archetypeLabel');
          if (label) {
            // Update only the name chip — the sticker markup must survive
            const nameEl = (group.userData.labelNameEl as HTMLElement | undefined) ?? (label as any).element;
            nameEl.textContent = this.translationService.getArchetypeField(archetype.id, 'name', archetype.name);
          }
          // Update shader colors (keep the attachment tint — raw color would wash it out)
          const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
          if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
            mesh.material.uniforms['uColor'].value.copy(this.attachmentTintedColor(archetype));
          }
        }
      });

    });
  }

  // --- HELPER METHODS FOR SIGGRAPH-TIER VISUALS ---

  private createBlobTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Procedural blob shape (hand-drawn style)
    const centerX = 128;
    const centerY = 128;
    const baseRadius = 100;

    // Create organic blob path with slight variations
    ctx.beginPath();
    for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
      const variance = Math.sin(angle * 5) * 10 + Math.cos(angle * 3) * 8;
      const radius = baseRadius + variance;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill with archetype color
    ctx.fillStyle = color;
    ctx.fill();

    // Add hand-drawn style stroke
    ctx.strokeStyle = '#4a3e35'; // --ink-main
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Add subtle inner highlight for depth
    ctx.beginPath();
    ctx.ellipse(centerX - 20, centerY - 20, 30, 20, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Add cute face (storybook style)
    // Eyes
    ctx.fillStyle = '#4a3e35';
    ctx.beginPath();
    ctx.arc(centerX - 25, centerY - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 25, centerY - 10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - 23, centerY - 12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 27, centerY - 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Simple smile
    ctx.strokeStyle = '#4a3e35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 5, 25, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Soft elliptical shadow
    const gradient = ctx.createRadialGradient(64, 32, 0, 64, 32, 60);
    gradient.addColorStop(0, 'rgba(74, 62, 53, 0.4)');
    gradient.addColorStop(0.5, 'rgba(74, 62, 53, 0.2)');
    gradient.addColorStop(1, 'rgba(74, 62, 53, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(64, 32, 60, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createIllustratedAura(archetype: Archetype): THREE.Group {
    const auraGroup = new THREE.Group();

    // Create hand-drawn circle with sketchy strokes
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const centerX = 128;
    const centerY = 128;
    const baseRadius = 100;

    // Color based on family
    const auraColor = (FAMILY_META as Record<string, { color: string }>)[archetype.cluster ?? '']?.color ?? '#D5793B';

    // Multiple sketchy circles for hand-drawn effect
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const variance = (Math.random() - 0.5) * 8;
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.2) {
        const r = baseRadius + variance + Math.sin(angle * 8) * 3;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.globalAlpha = 0.6 - i * 0.15;
      ctx.stroke();
    }

    // Add sparkles around the ring
    ctx.globalAlpha = 1;
    ctx.fillStyle = auraColor;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = baseRadius + 15;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      // Draw sparkle
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(archetype.size * 2.5, archetype.size * 2.5, 1);
    auraGroup.add(sprite);

    return auraGroup;
  }

  private createDustParticles(): void {
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Colors: white and gold dust
    const whiteColor = new THREE.Color(0xffffff);
    const goldColor = new THREE.Color(0xf4a261);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large sphere
      const radius = 200 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Mix of white and gold colors
      const color = Math.random() > 0.5 ? whiteColor : goldColor;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Random sizes
      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending, // gold dust glows on the night sky (feeds bloom)
      depthWrite: false,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'dustParticles';
    this.scene.add(particles);

    // Store for animation
    this.dustParticles = particles;
  }

  private createEnvironmentProps(): void {
    // Purged 2D Clipart Props (Islands, Clouds)
    // Focus remains on the 3D Archetype distribution
  }

  /**
   * Capability gate (zero-r CapabilityPort analogue): decide the initial
   * DPR cap, star budget, and quality ceiling BEFORE the first frame — from
   * device memory / core count / UA — so weak devices never spend their
   * first seconds ratcheting down from an unattainable ultra.
   */
  private computeCapability(): { maxTier: QualityTier; starMax: number; dprCap: number } {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const mem = nav.deviceMemory ?? 0; // GB; 0 = unknown (Safari/Firefox)
    const cores = navigator.hardwareConcurrency || 2;
    const weak = (mem > 0 && mem < 4) || cores <= (this.isMobileDevice ? 4 : 2);
    if (this.isMobileDevice) {
      return weak
        ? { maxTier: 1, starMax: 2400, dprCap: 1.15 }
        : { maxTier: 2, starMax: 4200, dprCap: 1.3 };
    }
    return weak
      ? { maxTier: 2, starMax: 6000, dprCap: 1.5 }
      : { maxTier: 3, starMax: 9000, dprCap: 1.75 };
  }

  public init(canvas: HTMLCanvasElement, isFirstVisit: boolean = false): Promise<void> {
    return new Promise(resolve => {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      
      if (isFirstVisit) {
        this.camera.position.set(25, 25, 25);
      } else {
        this.camera.position.set(15, 15, 15);
      }

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      // Capability-gated DPR budget (see computeCapability) — buttery-first.
      const cap = this.computeCapability();
      this.starMax = cap.starMax;
      this.tier = cap.maxTier;
      this.governor = new QualityGovernor(cap.maxTier);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, cap.dprCap));
      this.renderer.setClearColor(0x000000, 0);

      this.labelRenderer = new CSS2DRenderer();
      this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
      this.labelRenderer.domElement.style.position = 'absolute';
      this.labelRenderer.domElement.style.top = '0px';
      this.labelRenderer.domElement.style.left = '0px';
      this.labelRenderer.domElement.style.pointerEvents = 'none';
      this.labelRenderer.domElement.style.zIndex = '5'; // Lower than UI but higher than canvas
      this.labelRenderer.domElement.style.overflow = 'hidden';
      document.body.appendChild(this.labelRenderer.domElement);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.rotateSpeed = 0.6;
      this.controls.zoomSpeed = 0.8;
      this.controls.panSpeed = 0.5;
      this.controls.minDistance = 5;
      this.controls.maxDistance = 50;
      this.controls.enableSmoothZoom = true;
      // Idle drift: after a few still seconds the whole observatory slowly
      // rotates — the sky feels alive without stealing control from the user.
      this.controls.autoRotate = false;
      this.controls.autoRotateSpeed = 0.22;

      // Improve raycasting precision
      this.raycaster.params.Points.threshold = 0.5;
      this.raycaster.params.Line.threshold = 0.5;
      this.raycaster.params.Mesh = { threshold: 0.5 }; // Add threshold for meshes if needed (custom)


      // Post-Processing Setup — night-sky chain:
      // RenderPass → UnrealBloom (star/blob glow) → Sketchy Ink (Sobel + paper grain).
      // Bloom is desktop-only; the chain degrades tier-by-tier under sustained load.
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      if (!this.isMobileDevice) {
        this.bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.38, // strength — glow, not glare
          0.55, // radius — soft halo
          0.72  // threshold — only stars, rims and highlighted hearts bloom
        );
        this.composer.addPass(this.bloomPass);
      }

      this.sketchyOutlinePass = new ShaderPass(SKETCHY_OUTLINE_SHADER);
      this.sketchyOutlinePass.uniforms['resolution'].value.set(window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio());
      this.composer.addPass(this.sketchyOutlinePass);
      this.applyTier(this.tier);


      this.scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
      dirLight.position.set(5, 10, 7.5);
      this.scene.add(dirLight);

      this.scene.add(this.relationalTethersGroup);
      this.scene.add(this.constellationLinesGroup);
      this.scene.add(this.gridGroups);

      this.createNightSky();
      this.createStarField();
      this.createEnvironmentProps(); // Add storybook environment
      this.createAxisGrids(isFirstVisit);
      this.createAxisLabels();
      this.createArchetypes(isFirstVisit);

      window.addEventListener('resize', this.onWindowResize);
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
      this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
      this.renderer.domElement.addEventListener('wheel', this.onUserInteraction, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      window.addEventListener('keydown', this.onKeyDown);

      this.ngZone.runOutsideAngular(() => {
        this.animate();
      });

      if (isFirstVisit) {
        if (this.prefersReducedMotion) this.animationState.duration = 1.2; // shorter genesis, same story
        this.animationState.running = true;
        setTimeout(() => {
          this.animationState.running = false;
          resolve();
        }, this.animationState.duration * 1000);
      } else {
        resolve();
      }
    });
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
      if (child instanceof THREE.Line) {
        child.geometry?.dispose();
        if ((child.material as THREE.Material)) {
          (child.material as THREE.Material).dispose();
        }
      }
      if (child instanceof THREE.Points) {
        child.geometry?.dispose();
        (child.material as THREE.Material)?.dispose();
      }
      if (child instanceof THREE.Sprite) {
        (child.material as THREE.SpriteMaterial).dispose();
        if ((child.material as THREE.SpriteMaterial).map) {
          ((child.material as THREE.SpriteMaterial).map as THREE.CanvasTexture).dispose();
        }
      }
    });
    group.clear();
  }

  /**
   * Sleep instead of destroy when leaving the universe view: pause the rAF
   * loop and tuck the label layer away, but KEEP the WebGL context, scene
   * graph, geometries and materials (the canvas element is hoisted outside
   * Angular's route subtree precisely so the context survives). Re-entry
   * calls wake() and continues at full frame rate with zero rebuild cost.
   */
  public sleep(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    if (this.labelRenderer?.domElement) {
      this.labelRenderer.domElement.style.display = 'none';
    }
  }

  /** Resume after sleep(). Safe to call repeatedly; no-op before init. */
  /**
   * Re-entry repair: Angular destroys the @case('universe') block — including
   * the canvas this renderer was built on — whenever the app state leaves
   * 'universe'. On the next entry Angular renders a FRESH placeholder canvas,
   * while this renderer (WebGL context, pointer listeners, OrbitControls)
   * stays bound to the detached original: scene invisible, drag/click dead.
   * Swap the fresh placeholder for the real (still-styled) canvas so
   * everything comes back to life.
   */
  public reattachCanvas(placeholder: HTMLCanvasElement): void {
    if (!this.renderer) return;
    const real = this.renderer.domElement;
    if (real !== placeholder && !real.isConnected && placeholder.isConnected) {
      placeholder.replaceWith(real);
    }
  }

  public wake(): void {
    if (!this.renderer || !this.scene || this.animationFrameId) return;
    if (this.labelRenderer?.domElement) {
      this.labelRenderer.domElement.style.display = '';
    }
    // Re-entry safety: never wake into a locked-controls state (an
    // interrupted fly may have left controls disabled).
    if (this.controls && this.camera && !gsap.isTweening(this.camera.position)) {
      this.controls.enabled = true;
    }
    this.lastFrameStart = 0; // avoid a giant delta spike on resume
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  public destroy(): void {
    this.governor?.stop();
    this.governor = undefined;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Comprehensive memory cleanup
    this.scene?.traverse((object: any) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat: any) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    
    this.archetypeObjects = [];

    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
      this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
      this.renderer.domElement.removeEventListener('wheel', this.onUserInteraction);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    clearTimeout(this.hoverDebounceTimeout);

    // Dispose post-processing passes
    this.bloomPass?.dispose();
    this.sketchyOutlinePass?.dispose?.();

    // Dispose creation effects
    this.activeCreationEffects.forEach(effect => {
      const effectAny = effect as any;
      if (effectAny.particles) {
        effectAny.particles.forEach((particle: THREE.Sprite) => {
          (particle.material as THREE.Material).dispose();
          if ((particle.material as THREE.SpriteMaterial).map) {
            ((particle.material as THREE.SpriteMaterial).map as THREE.CanvasTexture).dispose();
          }
        });
      } else if (effect.points) {
        effect.points.geometry.dispose();
        (effect.points.material as THREE.Material).dispose();
      }
    });
    this.activeCreationEffects = [];

    // Dispose archetype objects
    this.archetypeObjects.forEach(group => this.disposeGroup(group));
    this.archetypeObjects = [];

    // Dispose tether and constellation groups
    this.disposeGroup(this.relationalTethersGroup);
    this.tetherMaterials = [];
    this.disposeGroup(this.constellationLinesGroup);
    this.disposeGroup(this.gridGroups);

    // Dispose background material
    this.backgroundMaterial?.dispose();

    // Dispose dust particles
    if (this.dustParticles) {
      this.dustParticles.geometry.dispose();
      (this.dustParticles.material as THREE.Material).dispose();
    }

    // Remove label renderer DOM element
    if (this.labelRenderer?.domElement?.parentElement) {
      this.labelRenderer.domElement.parentElement.removeChild(this.labelRenderer.domElement);
    }

    // Dispose scene children (background sphere, lights, axis labels, sprites)
    if (this.scene) {
      this.scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
        if (child instanceof THREE.Sprite) {
          (child.material as THREE.SpriteMaterial).dispose();
          if ((child.material as THREE.SpriteMaterial).map) {
            ((child.material as THREE.SpriteMaterial).map as THREE.CanvasTexture).dispose();
          }
        }
      });
      this.scene.clear();
    }

    // Dispose renderer
    this.renderer?.dispose();

    // Reset state
    this.frameCount = 0;
    this.sceneReady.set(false);
  }

  /** Show/hide the CSS2D label overlay (archetype names, focus tags) */
  public setLabelsVisible(visible: boolean): void {
    if (this.labelRenderer?.domElement) {
      this.labelRenderer.domElement.style.display = visible ? '' : 'none';
    }
    // Also hide the WebGL canvas itself when panels are fully covering it
    if (this.renderer?.domElement) {
      this.renderer.domElement.style.display = visible ? '' : 'none';
    }
  }

  public flyToArchetype(archetype: Archetype): void {
    if (!this.camera || !this.controls) return;

    this.onUserInteraction();
    this.universeState.selectedArchetype.set(archetype);
    
    // Find the object
    const obj = this.archetypeObjects.find(o => o.userData.archetype.id === archetype.id);
    if (!obj) return;

    const targetPos = obj.position.clone();
    
    // Cinematic Spline Path Calculation
    const startPos = this.camera.position.clone();
    const midPoint = new THREE.Vector3().addVectors(startPos, targetPos).multiplyScalar(0.5);
    midPoint.y += 5; // Arched path
    
    const offsetDir = new THREE.Vector3().subVectors(startPos, targetPos).normalize();
    const finalCamPos = targetPos.clone().add(offsetDir.multiplyScalar(8)).add(new THREE.Vector3(0, 3, 0));

    const curve = new THREE.CatmullRomCurve3([
      startPos,
      midPoint,
      finalCamPos
    ]);

    const objAnim = { t: 0 };
    gsap.to(objAnim, {
      t: 1,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = curve.getPoint(objAnim.t);
        this.camera!.position.copy(p);
      }
    });

    gsap.to(this.controls.target, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: 'power2.inOut'
    });
  }

  public flyToConstellation(clusterId: string): void {
    if (!this.controls || !this.camera) return;
    const members = this.archetypeObjects.filter(o => o.userData.archetype.cluster === clusterId);
    if (members.length === 0) return;

    this.cancelCameraAnimation();
    this.controls.enabled = false;

    const box = new THREE.Box3();
    members.forEach(m => box.expandByPoint(m.position));
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const targetCameraPos = center.clone().add(new THREE.Vector3(maxDim * 1.5, maxDim * 1.2, maxDim * 1.5));

    gsap.to(this.controls.target, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: 1.5,
      ease: "power2.inOut"
    });

    gsap.to(this.camera.position, {
      x: targetCameraPos.x,
      y: targetCameraPos.y,
      z: targetCameraPos.z,
      duration: 2.0,
      ease: "expo.inOut",
      onComplete: () => {
        this.controls.enabled = true;
      }
    });
  }

  public resetCamera(): void {
    if (!this.camera || !this.controls) return;
    this.universeState.selectedArchetype.set(null);

    gsap.to(this.camera.position, {
      x: 15,
      y: 15,
      z: 15,
      duration: 1.5,
      ease: 'power2.inOut'
    });

    gsap.to(this.controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.5,
      ease: 'power2.inOut'
    });
  }


  public addArchetype(archetype: Archetype): void {
    // Check if archetype with this ID already exists
    if (this.archetypeObjects.some(o => o.userData.archetype.id === archetype.id)) {
      console.warn(`Archetype with id ${archetype.id} already exists. Skipping addition.`);
      return;
    }

    const group = this.createSingleArchetypeObject(archetype);
    const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
    if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
      mesh.material.uniforms['uOpacity'].value = 0; // fades in via the update loop's damper
    }
    group.userData.isNew = true; // Flag for fade-in animation


    this.archetypeObjects.push(group);
    this.scene.add(group);
    void this.attachFeltCharacter(group, archetype);
    this.universeState.allArchetypes.update(all => [...all, archetype]);
    this.universeState.selectedArchetype.set(archetype);

    // Create storybook "poof" creation effect with stars and sparkles
    this.createCreationPoof(group.userData.targetPosition, archetype.color);
  }

  private createCreationPoof(position: THREE.Vector3, color: string): void {
    const particleCount = 50;
    const particles: THREE.Sprite[] = [];

    for (let i = 0; i < particleCount; i++) {
      const shape = Math.random();
      let texture: THREE.CanvasTexture;

      if (shape < 0.4) {
        texture = this.createStarTexture(color);
      } else if (shape < 0.7) {
        texture = this.createSparkleTexture(color);
      } else {
        texture = this.createSmallBlobTexture(color);
      }

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const particle = new THREE.Sprite(material);
      particle.position.copy(position);

      // Random burst direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 2 + Math.random() * 3;

      particle.userData = {
        velocity: new THREE.Vector3(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.sin(phi) * Math.sin(theta),
          speed * Math.cos(phi)
        ),
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        life: 1.0,
        decay: 0.5 + Math.random() * 0.5
      };

      const size = 0.3 + Math.random() * 0.4;
      particle.scale.set(size, size, 1);

      this.scene.add(particle);
      particles.push(particle);
    }

    this.activeCreationEffects.push({
      particles,
      startTime: this.timer.getElapsed(),
      duration: 2.0
    } as any);
  }

  private createStarTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const centerX = 32;
    const centerY = 32;
    const outerRadius = 28;
    const innerRadius = 10;

    ctx.fillStyle = color;
    ctx.beginPath();

    // Draw 5-pointed star
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  private createSparkleTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const centerX = 16;
    const centerY = 16;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw cross sparkle
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY);
    ctx.lineTo(centerX + 12, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 12);
    ctx.lineTo(centerX, centerY + 12);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  private createSmallBlobTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  public setComparisonState(isComparing: boolean, firstArchetype: Archetype | null): void {
    this.universeState.setComparisonState(isComparing, firstArchetype);
  }

  public updateClusterFilters(filters: Set<string>): void {
    if (filters.size !== 1) {
      this.cancelCameraAnimation();
    }

    this.universeState.setClusterFilters(filters);
    this.updateConstellationLines(filters);
  }

  
  public updateDimensionalExpressions(expressions: DimensionalExpressions): void {
    this.universeState.updateDimensionalExpressions(expressions);
  }


  private cancelCameraAnimation(): void {
    this.onUserInteraction(); // scripted camera work counts as interaction — pauses idle drift
    gsap.killTweensOf(this.camera?.position);
    gsap.killTweensOf(this.controls?.target);
    if (this.controls) this.controls.enabled = true;
  }


  /** Night-sky observatory background: indigo ink space, a real Milky Way band
   * (fbm clouds + dust lanes + warm core), procedural far-sparkle, and a warm
   * "paper lantern" horizon glow — the inner-verse palette rendered as a sky. */
  private createNightSky(): void {
    const geometry = new THREE.SphereGeometry(500, 48, 48);

    const vertexShader = `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;

    const fragmentShader = `
      precision mediump float;
      varying vec3 vDir;
      uniform float uTime;
      uniform vec3 uPlaneNormal;
      uniform vec3 uCoreDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), f.x),
              mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),
          mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x),
              mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vDir);

        // Height above/below the galactic plane -> band intensity (sech^2-ish).
        float b = dot(dir, uPlaneNormal);
        float band = exp(-(b * b) * 18.0);

        // Distance to the galactic core direction -> warm glow.
        float coreDist = length(dir - normalize(uCoreDir));
        float core = exp(-coreDist * coreDist * 2.6);

        // Deep indigo ink space — never flat black, subtly varying.
        vec3 spaceColor = mix(vec3(0.040, 0.034, 0.078), vec3(0.055, 0.038, 0.095), noise(dir * 2.2 + 5.0));

        // One fbm sample reused for cloud brightness and dust extinction.
        float cloud = fbm(dir * 3.4 + vec3(11.0, 3.0, 7.0));
        float dustMask = smoothstep(0.42, 0.78, cloud);
        float dustLane = band * (1.0 - dustMask * 0.82);

        // Indigo band melting into warm cream-gold at the core.
        vec3 bandColor = mix(vec3(0.26, 0.29, 0.46), vec3(0.85, 0.70, 0.46), core);
        vec3 milky = bandColor * dustLane * (0.38 + cloud * 0.72);

        vec3 coreGlow = vec3(1.0, 0.84, 0.58) * core * 1.1;

        // Cheap procedural "unresolved star" sparkle fills the background.
        float sparkleField = hash(floor(dir * 720.0));
        float sparkle = step(0.9975, sparkleField) * (0.4 + 0.6 * sin(uTime * 2.4 + sparkleField * 80.0));
        float farDust = smoothstep(0.5, 0.9, fbm(dir * 1.4)) * 0.05;

        vec3 col = spaceColor + milky + coreGlow + vec3(sparkle) * (0.5 + band * 0.5) + farDust * bandColor;

        // Paper-observatory horizon: a warm lantern glow low on the sphere,
        // as if the sky rests on a lit desk.
        float lantern = smoothstep(0.10, -0.22, dir.y);
        col += vec3(0.55, 0.33, 0.16) * lantern * lantern * 0.26;

        gl_FragColor = vec4(col, 1.0);
      }`;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPlaneNormal: { value: GALACTIC_PLANE_NORMAL.clone() },
        uCoreDir: { value: GALACTIC_CORE_DIR.clone() },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });

    // Store reference for animation
    this.backgroundMaterial = material;
    const sky = new THREE.Mesh(geometry, material);
    sky.name = 'nightSky';
    sky.renderOrder = -1;
    this.scene.add(sky);

    // Add floating dust particles
    this.createDustParticles();
  }

  /** GPU starfield inside the sky sphere (see STAR_* shaders for the techniques). */
  private createStarField(): void {
    const buffers = generateStarFieldBuffers(this.starMax, 330, 480);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(buffers.positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(buffers.colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(buffers.sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(buffers.phases, 1));
    geometry.setAttribute('aFlag', new THREE.BufferAttribute(buffers.flags, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 500);

    const material = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uTwinkleAmp: { value: this.prefersReducedMotion ? 0 : 0.6 },
        uPixelRatio: { value: Math.min(this.renderer.getPixelRatio(), 2) },
        uSizeScale: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = 'starField';
    stars.frustumCulled = false;
    this.scene.add(stars);

    this.starField = stars;
    this.starMaterial = material;
  }

  private createAxisGrids(isAnimated = false): void {
    const size = 20;
    const divisions = 10; // Reduced divisions for cleaner look
    const opacity = 0.08; // Subtle — chart lines on a star atlas, not graph paper
    const gridColor = 0x8fa0d8; // luminous ink-blue: readable against the night sky

    const gridsInfo = [
      { key: 'AGENCY_FOCUS', color: gridColor, rotation: new THREE.Euler(Math.PI / 2, 0, 0) },
      { key: 'AGENCY_TEMPERATURE', color: gridColor, rotation: new THREE.Euler(0, 0, 0) },
      { key: 'TEMPERATURE_FOCUS', color: gridColor, rotation: new THREE.Euler(0, 0, Math.PI / 2) }
    ];

    gridsInfo.forEach(info => {
      // Create clean solid lines instead of jittery/dashed ones
      const gridGroup = new THREE.Group();
      gridGroup.userData.key = info.key;

      const step = size / divisions;
      const halfSize = size / 2;

      for (let i = 0; i <= divisions; i++) {
        const pos = -halfSize + i * step;

        // Horizontal lines
        const hPoints = [
          new THREE.Vector3(-halfSize, 0, pos),
          new THREE.Vector3(halfSize, 0, pos)
        ];
        const hGeometry = new THREE.BufferGeometry().setFromPoints(hPoints);
        const hMaterial = new THREE.LineBasicMaterial({
          color: info.color,
          transparent: true,
          opacity: opacity * (i % 5 === 0 ? 2.0 : 1.0), // Major lines slightly more visible
        });
        hMaterial.userData.baseOpacity = hMaterial.opacity;
        const hLine = new THREE.Line(hGeometry, hMaterial);
        gridGroup.add(hLine);

        // Vertical lines
        const vPoints = [
          new THREE.Vector3(pos, 0, -halfSize),
          new THREE.Vector3(pos, 0, halfSize)
        ];
        const vGeometry = new THREE.BufferGeometry().setFromPoints(vPoints);
        const vMaterial = new THREE.LineBasicMaterial({
          color: info.color,
          transparent: true,
          opacity: opacity * (i % 5 === 0 ? 2.0 : 1.0)
        });
        vMaterial.userData.baseOpacity = vMaterial.opacity;
        const vLine = new THREE.Line(vGeometry, vMaterial);
        gridGroup.add(vLine);
      }

      gridGroup.rotation.copy(info.rotation);

      if (isAnimated) {
        gridGroup.scale.set(0.01, 0.01, 0.01);
      }

      this.gridGroups.add(gridGroup);
    });
  }
  
  private createAxisLabels(): void {
    Object.entries(this.labelsInfo).forEach(([key, l]) => {
      const div = document.createElement('div');
      div.className = 'focus-tag';
      div.textContent = this.translationService.t(l.key, 'universe.dimensions');
      div.style.color = l.color;

      // Storybook floating tag style (from spec)
      div.style.backgroundColor = 'rgba(253, 251, 246, 0.85)';
      div.style.backdropFilter = 'blur(12px)';
      div.style.border = '1px solid ' + l.color + '44';
      div.style.borderRadius = '12px';
      div.style.padding = '6px 14px';
      div.style.fontFamily = "'Fraunces', serif";
      div.style.fontSize = '13px';
      div.style.fontWeight = '700';
      div.style.letterSpacing = '0.05em';
      div.style.textTransform = 'uppercase';
      div.style.pointerEvents = 'none';
      div.style.boxShadow = '0 4px 15px rgba(74, 62, 53, 0.1)';
      div.style.transition = 'all 0.4s ease-out';

      const label = new CSS2DObject(div);
      label.position.copy(l.pos);

      this.axisLabels[key] = label;
      this.scene.add(label);
    });
  }

  private sharedSphereGeometry = new THREE.SphereGeometry(1, 32, 32);

  private createArchetypes(isAnimated = false): void {
    this.allArchetypes().forEach(archetype => {
      const group = this.createSingleArchetypeObject(archetype, isAnimated);
      this.archetypeObjects.push(group);
      this.scene.add(group);
      void this.attachFeltCharacter(group, archetype);
    });
  }

  private determinismSeed: string | null = null;

  public setDeterminismSeed(seed: string | null): void {
    this.determinismSeed = seed;
  }

  private hashToUnit(seed: string): number {
    // Deterministic 0..1 hash for stable visual placement/animation between regenerations.
    // (Avoid Math.random so the same generated parts don't "jump" between sessions.)
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }

  private async attachFeltCharacter(group: THREE.Group, archetype: Archetype): Promise<void> {
    const sphere = group.getObjectByName('blobMesh') as THREE.Mesh | null;
    const label = group.getObjectByName('archetypeLabel') as CSS2DObject | null;
    const stickerHost = label?.element.querySelector('.archetype-label__sticker') as HTMLElement | null;

    try {
      const [svg, character] = await Promise.all([
        this.feltCharacters.svgFor(archetype),
        this.feltCharacters.buildMapCharacter(archetype),
      ]);

      // The scene may have been destroyed while the worker was sewing. Do not
      // attach late buffers to an obsolete map.
      if (group.parent !== this.scene) {
        if (character) this.disposeGroup(character);
        return;
      }

      const hasSavedLook = !!loadLooks()[archetype.id];
      if (svg && stickerHost && !hasSavedLook) {
        stickerHost.innerHTML = svg;
        const generatedSvg = stickerHost.querySelector('svg');
        if (generatedSvg) {
          generatedSvg.style.width = '100%';
          generatedSvg.style.height = '100%';
          generatedSvg.style.display = 'block';
        }
      }

      if (!character || !sphere || hasSavedLook) {
        if (character) this.disposeGroup(character);
        return;
      }
      character.name = 'feltCharacter';
      // Preserve the DNA's intrinsic size from makeGroup while fitting the
      // character to the old map node's visual footprint.
      character.userData.generatorSize = character.scale.x;
      character.userData.revealScale = 1;
      const targetScale = (group.userData.baseScale as number) * 1.7 * character.userData.generatorSize;
      character.position.y = -(group.userData.baseScale as number) * 0.08;
      character.scale.setScalar(targetScale);
      group.add(character);
      group.userData.feltCharacter = character;

      // Keep the old shader mesh as an invisible control surface for the
      // existing selection/highlight logic; the sewn felt body is now the
      // visible map node. The attachment shell and soft shadow still layer
      // around it as before.
      sphere.visible = false;

      if (!this.prefersReducedMotion) {
        character.userData.revealScale = 0.001;
        character.scale.setScalar(targetScale * 0.001);
        gsap.to(character.userData, {
          revealScale: 1,
          duration: 0.62,
          ease: 'back.out(1.4)',
          delay: 0.06,
        });
      }
    } catch (error) {
      // The original celestial mesh is a deliberate fallback on browsers
      // without module-worker support or if a character fails to sew.
      console.warn(`Could not add the Felt Atelier character for ${archetype.id}:`, error);
    }
  }

  private createSingleArchetypeObject(archetype: Archetype, isAnimated: boolean = false): THREE.Group {
    const group = new THREE.Group();

    // Create the living watercolor celestial body (shared geometry for performance)
    const geometry = this.sharedSphereGeometry;
    const baseColor = this.attachmentTintedColor(archetype);

    // Pre-calculate initial opacity to match what updateExplorationVisuals will set on first frame
    // This prevents the "vibrant → bleak" flash when entering the universe
    const isResource = archetype.cluster === 'resources';
    const initialHighlight = isResource ? 0.5 : 0.0;
    const initialOpacity = 0.3 + initialHighlight * 0.7; // matches updateExplorationVisuals formula

    const material = new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_BLOB_SHADER.vertex,
      fragmentShader: CELESTIAL_BLOB_SHADER.fragment,
      uniforms: {
        uTime: { value: 0 },
        uJiggle: { value: 0 },
        uHighlight: { value: initialHighlight },
        uColor: { value: baseColor },
        uOpacity: { value: initialOpacity },
        uLightDir: { value: GALACTIC_CORE_DIR.clone() }, // key light = the warm galactic core
      },
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const baseScale = archetype.size * 0.8;
    mesh.scale.set(baseScale, baseScale, baseScale);
    mesh.name = 'blobMesh';
    group.add(mesh);

    // Attachment shell — the legibility channel the v2 plan asked for:
    // anxious parts wear an energetic corona, avoidant parts a cool veil.
    const attachmentVal = archetype.coordinates[3]; // -1 = avoidant, +1 = anxious
    if (Math.abs(attachmentVal) > 0.15) {
      const anxious = attachmentVal > 0;
      const shellSource = anxious ? ANXIOUS_SHELL : AVOIDANT_SHELL;
      const shellMaterial = new THREE.ShaderMaterial({
        vertexShader: shellSource.vertex,
        fragmentShader: shellSource.fragment,
        uniforms: {
          uTime: { value: 0 },
          uAttachment: { value: Math.min(Math.abs(attachmentVal), 1) },
          uReveal: { value: isAnimated ? 0 : 1 },
          uColor: { value: new THREE.Color(anxious ? '#f4a261' : '#7ecef4') },
        },
        transparent: true,
        depthWrite: false,
        blending: anxious ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const shell = new THREE.Mesh(geometry, shellMaterial);
      const shellScale = baseScale * 1.28;
      shell.scale.set(shellScale, shellScale, shellScale);
      shell.name = 'attachmentShell';
      group.add(shell);
    }

    // Add floating label: the part's real sticker character over a solid cream name chip
    const labelDiv = document.createElement('div');
    labelDiv.className = 'archetype-label';
    labelDiv.style.display = 'flex';
    labelDiv.style.flexDirection = 'column';
    labelDiv.style.alignItems = 'center';
    labelDiv.style.gap = '2px';
    labelDiv.style.pointerEvents = 'none'; // CRITICAL: Ensure labels don't block clicks (re-enabled when visible)
    labelDiv.style.userSelect = 'none';
    labelDiv.style.opacity = '0';
    labelDiv.style.transform = 'translateY(-10px) scale(0.9)';
    labelDiv.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

    const look = effectiveLook(archetype);
    const stickerHost = document.createElement('div');
    stickerHost.className = 'archetype-label__sticker';
    stickerHost.style.width = '44px';
    stickerHost.style.height = '44px';
    stickerHost.style.pointerEvents = 'none';
    stickerHost.innerHTML = sticker({
      name: archetype.name,
      shape: look.shape,
      color: look.color,
      glyph: { e: look.eye, m: look.mouth },
    });
    const stickerSvg = stickerHost.querySelector('svg');
    if (stickerSvg) {
      stickerSvg.style.width = '100%';
      stickerSvg.style.height = '100%';
      stickerSvg.style.display = 'block';
    }

    const nameChip = document.createElement('span');
    nameChip.className = 'archetype-label__name';
    nameChip.textContent = this.translationService.getArchetypeField(archetype.id, 'name', archetype.name);
    nameChip.style.backgroundColor = '#FBF5E6'; // solid cream — no translucent pill bleeding outside the sticker
    nameChip.style.border = '1.5px solid #1C1610';
    nameChip.style.borderRadius = '999px';
    nameChip.style.padding = '2px 9px';
    nameChip.style.fontFamily = "'Fraunces', serif";
    nameChip.style.fontSize = '12px';
    nameChip.style.fontWeight = '700';
    nameChip.style.color = '#1C1610';
    nameChip.style.whiteSpace = 'nowrap';
    nameChip.style.pointerEvents = 'none';
    labelDiv.appendChild(stickerHost);
    labelDiv.appendChild(nameChip);

    const label = new CSS2DObject(labelDiv);
    label.position.set(0, baseScale + 0.8, 0); // Position above the blob
    label.name = 'archetypeLabel';
    group.add(label);

    // Add soft blob shadow
    const shadowTexture = this.createShadowTexture();
    const shadowMaterial = new THREE.SpriteMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    const shadow = new THREE.Sprite(shadowMaterial);
    shadow.scale.set(baseScale * 0.8, baseScale * 0.3, 1);
    shadow.position.set(0, -baseScale / 2 - 0.2, 0);
    shadow.name = 'blobShadow';
    group.add(shadow);

    // Handle attachment shells
    const [x, y, z, attachment] = archetype.coordinates;
    const targetPosition = new THREE.Vector3(x * POSITION_SCALE, y * POSITION_SCALE, z * POSITION_SCALE);
    group.userData = {
      archetype,
      targetPosition,
      baseScale,
      bobOffset: this.hashToUnit(archetype.id) * Math.PI * 2,
      isHovered: false,
      isSelected: false,
      jiggle: 0,
      mesh,
      shadow,
      label,
      labelNameEl: nameChip
    };

    // Create aura
    const aura = this.createIllustratedAura(archetype);
    aura.name = 'assessmentAura';
    aura.visible = false;
    group.add(aura);
    group.userData.aura = aura;

    const isAnchor = archetype.id === GENESIS_ANCHOR_ID;
    // isResource is already declared above

    if (isAnimated && !isAnchor) {
      group.position.set(isResource ? 0 : (Math.random() - 0.5) * 5, isResource ? 0 : (Math.random() - 0.5) * 5, isResource ? 0 : (Math.random() - 0.5) * 5);
      material.uniforms['uOpacity'].value = 0;
    } else {
      group.position.copy(targetPosition);
    }

    return group;
  }

  /** Base body color with the attachment tint baked in (avoidant → cool blue, anxious → warm amber). */
  private attachmentTintedColor(archetype: Archetype): THREE.Color {
    const attachmentVal = archetype.coordinates[3]; // -1 = avoidant, +1 = anxious
    const baseColor = new THREE.Color(archetype.color);
    if (attachmentVal < -0.15) {
      baseColor.lerp(new THREE.Color('#7ecef4'), Math.min(Math.abs(attachmentVal), 1.0) * 0.45);
    } else if (attachmentVal > 0.15) {
      baseColor.lerp(new THREE.Color('#f4a261'), Math.min(attachmentVal, 1.0) * 0.45);
    }
    return baseColor;
  }
  
  /**
   * Ordered degradation (zero-r PERFORMANCE.md): ambient effects go first,
   * then density, then blur, and the ink identity post survives longest.
   *   3 ultra    — everything: dust, idle drift, full stars, bloom + ink
   *   2 high     — ambient off, 65% stars, bloom + ink
   *   1 standard — 40% stars, ink only
   *   0 raw      — 22% stars, no post chain at all
   */
  private applyTier(tier: QualityTier): void {
    this.tier = tier;
    if (this.dustParticles) this.dustParticles.visible = tier === 3;
    if (this.bloomPass) this.bloomPass.enabled = tier === 3;
    if (this.sketchyOutlinePass) this.sketchyOutlinePass.enabled = tier >= 1;
    if (this.starField) {
      const geometry = this.starField.geometry;
      const draw = Math.max(400, Math.floor(this.starMax * TIER_STAR_FRACTION[tier]));
      geometry.setDrawRange(0, draw); // buffers are magnitude-sorted: the brightest stars always stay
    }
  }

  private lastFrameStart = 0;

  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Full pause while the tab is hidden — no rAF work, no battery burn.
    if (document.hidden) return;

    try {
      const frameStart = performance.now();
      const frameMs = this.lastFrameStart ? frameStart - this.lastFrameStart : 16.7;
      this.lastFrameStart = frameStart;
      this.timer.update(frameStart);
      const delta = this.timer.getDelta();
      const elapsedTime = this.timer.getElapsed();
      const dt = Math.min(delta, 0.05); // clamp for stable damping after stalls
      this.frameCount++;

      // Governor metrics: input→frame latency + frame pacing (p95-driven).
      this.governor?.collectInteraction(frameStart);
      this.governor?.frame(frameMs);

      // Mark scene ready after enough frames have been rendered to GPU
      // (shaders compiled, textures uploaded, post-processing stable).
      // The time fallback keeps slow-GPU devices (software GL, old phones)
      // from being declared broken when they're merely rendering slowly.
      if (!this.sceneReady() && (this.frameCount >= 60 || elapsedTime > 8)) {
        this.sceneReady.set(true);
      }

      if (this.animationState.running) this.updateGenesisAnimation(delta);

      // Cinematic look-at target (subtle drift, frame-rate independent)
      if (this.selectedArchetype()) {
        const archetype = this.selectedArchetype();
        const obj = this.archetypeObjects.find(o => o.userData.archetype.id === archetype?.id);
        if (obj) {
          const target = this.vec3_1.copy(obj.position).add(this.archetypeFocusOffset);
          this.controls.target.lerp(target, 1 - Math.exp(-2.2 * dt));
        }
      }

      // Idle drift: after a quiet spell the observatory slowly turns on its
      // own — an ambient effect, so it's first on the degradation ladder
      // (tier ≥ 2) and always off under prefers-reduced-motion.
      if (!this.prefersReducedMotion && this.tier >= 2) {
        const idle = performance.now() - this.lastInteractionTime > this.idleDriftDelayMs;
        const drifting = idle && !this.selectedArchetype() && !this.animationState.running && !this.isDragging;
        if (this.controls.autoRotate !== drifting) this.controls.autoRotate = drifting;
      } else if (this.controls.autoRotate) {
        this.controls.autoRotate = false;
      }

      this.controls.update();
      this.updateCreationEffects();
      this.updateArchetypeVisuals(dt, elapsedTime);
      this.updateAxisLabels();
      this.updateTetherAnimation();

      // Living sky: stars + milky way advance every frame (cheap uniforms).
      if (this.starMaterial) {
        this.starMaterial.uniforms['uTime'].value = elapsedTime;
      }

      // Render through the post chain for the current tier.
      if (this.sketchyOutlinePass) {
        this.sketchyOutlinePass.uniforms['uTime'].value = elapsedTime;
      }
      if (this.tier >= 1) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      // CSS2D labels at 30Hz — each render writes transforms to ~20–40 DOM
      // nodes; labels are quasi-static so half-rate is visually identical
      // and halves the per-frame style-invalidation cost.
      if (this.frameCount % 2 === 0) {
        this.labelRenderer.render(this.scene, this.camera);
      }

      // Adaptive quality: evaluate tier transitions every 15 frames.
      if (this.governor && this.frameCount % 15 === 0) {
        const next = this.governor.tick(frameStart);
        if (next !== null) this.applyTier(next);
      }
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  private onUserInteraction = (): void => {
    this.lastInteractionTime = performance.now();
    if (this.controls.autoRotate) this.controls.autoRotate = false;
  };

  private onVisibilityChange = (): void => {
    // Reset the pacing baseline so the delta EMA doesn't spike on return.
    if (!document.hidden) this.lastFrameStart = 0;
  };

  private updateGenesisAnimation(delta: number): void {
    this.animationState.progress = Math.min(this.animationState.progress + delta / this.animationState.duration, 1);
    const eased = 1 - Math.pow(1 - this.animationState.progress, 3);

    // Animate grid groups
    this.gridGroups.children.forEach(g => {
      const group = g as THREE.Group;
      group.children.forEach((child: THREE.Object3D) => {
        if (child instanceof THREE.Line) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.opacity = eased * (mat.userData.baseOpacity ?? 0.15);
        }
      });
      g.scale.set(eased, eased, eased);
    });

    // Animate archetype bodies: fly to place + fade in through shader uniforms
    this.archetypeObjects.forEach(group => {
      const isAnchor = group.userData.archetype.id === GENESIS_ANCHOR_ID;
      if (!isAnchor) {
        group.position.lerp(group.userData.targetPosition, eased * 0.1);

        const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
          mesh.material.uniforms['uOpacity'].value = eased;
        }
        const shell = group.getObjectByName('attachmentShell') as THREE.Mesh;
        if (shell && shell.material instanceof THREE.ShaderMaterial) {
          shell.material.uniforms['uReveal'].value = eased;
        }
      }
    });
  }

  private updateCreationEffects() {
    const elapsedTime = this.timer.getElapsed();
    for (let i = this.activeCreationEffects.length - 1; i >= 0; i--) {
      const effect = this.activeCreationEffects[i] as any;
      const progress = (elapsedTime - effect.startTime) / effect.duration;

      if (progress >= 1.0) {
        // Clean up particles
        effect.particles.forEach((particle: THREE.Sprite) => {
          this.scene.remove(particle);
          (particle.material as THREE.Material).dispose();
          (particle.material.map as THREE.CanvasTexture)?.dispose();
        });
        this.activeCreationEffects.splice(i, 1);
      } else {
        // Animate particles
        effect.particles.forEach((particle: THREE.Sprite) => {
          const data = particle.userData;
          particle.position.add(data.velocity.clone().multiplyScalar(0.016));
          data.velocity.multiplyScalar(0.95);
          particle.material.rotation += data.rotationSpeed;
          data.life -= 0.016 / data.decay;
          (particle.material as THREE.SpriteMaterial).opacity = Math.max(0, data.life);
          const s = particle.scale.x * Math.max(0.5, data.life);
          particle.scale.set(s, s, 1);
        });
      }
    }
  }

  private updateArchetypeVisuals(dt: number, elapsedTime: number): void {
    if (this.animationState.running) return;
    const personalConstellation = this.personalConstellation();

    if (personalConstellation) {
        this.updatePersonalConstellationVisuals(dt, elapsedTime, personalConstellation);
    } else {
        this.updateExplorationVisuals(dt, elapsedTime);
    }

    // Global time update for all shader-driven bodies (blob + attachment shell)
    this.archetypeObjects.forEach(group => {
      const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms['uTime'].value = elapsedTime;
        mesh.material.uniforms['uJiggle'].value = this.prefersReducedMotion ? 0 : (group.userData.jiggle || 0);
      }
      const shell = group.getObjectByName('attachmentShell') as THREE.Mesh;
      if (shell && shell.material instanceof THREE.ShaderMaterial) {
        shell.material.uniforms['uTime'].value = elapsedTime;
      }
    });
  }

  private syncFeltCharacterScale(group: THREE.Group, bodyScale: number, dt: number): void {
    const character = group.userData.feltCharacter as THREE.Group | undefined;
    if (!character) return;
    const generatorSize = (character.userData.generatorSize as number) || 1;
    const revealScale = (character.userData.revealScale as number) ?? 1;
    const targetScale = bodyScale * 1.7 * generatorSize * revealScale;
    const dampedScale = THREE.MathUtils.lerp(character.scale.x, targetScale, 1 - Math.exp(-6 * dt));
    character.scale.setScalar(dampedScale);
  }

  private updateExplorationVisuals(dt: number, elapsedTime: number): void {
    let totalExpressionMag = 0;
    Object.values(this.dimensionalExpressions()).forEach(v => totalExpressionMag += Math.abs(v));


    this.archetypeObjects.forEach(group => {
      const archetype = group.userData.archetype as Archetype;
      const mesh = group.userData.mesh as THREE.Mesh;
      const shadow = group.userData.shadow as THREE.Sprite;
      const label = group.userData.label as CSS2DObject;
      const aura = group.userData.aura as THREE.Group;

      if (!mesh) return;

      const isSelected = this.selectedArchetype()?.id === archetype.id;
      const isFirstCompare = this.firstComparisonArchetype()?.id === archetype.id;

      // Update hover state
      const wasHovered = group.userData.isHovered;
      group.userData.isHovered = isSelected || isFirstCompare;

      // Jiggle orchestration
      if (group.userData.isHovered && !wasHovered) {
        gsap.to(group.userData, { jiggle: 0.15, duration: 0.8, ease: "elastic.out(1, 0.3)" });
      } else if (!group.userData.isHovered && wasHovered) {
        gsap.to(group.userData, { jiggle: 0, duration: 0.5, ease: "power2.out" });
      }

      // Show label on hover/selection or when close to camera.
      // PERF: DOM writes only on visibility CHANGE (or a 10Hz refresh for
      // the is-close case) — previously 4 style writes x ~30 labels x 60fps.
      if (label) {
        const labelEl = label.element as HTMLElement;
        const dist = this.camera.position.distanceTo(group.position);
        const isClose = dist < 12; // Show labels if camera is within 12 units
        const isVisible = group.userData.isHovered || isSelected || isFirstCompare || isClose;
        const wasVisible = group.userData.labelVisible as boolean | undefined;
        if (isVisible !== wasVisible || (isVisible && this.frameCount % 6 === 0)) {
          group.userData.labelVisible = isVisible;
          labelEl.style.opacity = isVisible ? '1' : '0';
          labelEl.style.transform = isVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)';
          labelEl.style.pointerEvents = isVisible ? 'auto' : 'none';
          // Dynamic Z-index to bring labels to front
          labelEl.style.zIndex = isVisible ? '100' : '0';
        }
      }

      let highlightScore = 0;
      if (totalExpressionMag > 0.01) {
        let scoreSum = 0;
        DIMENSION_KEYS.forEach((key, i) => {
          const expressionValue = this.dimensionalExpressions()[key];
          const archetypeValue = archetype.coordinates[i];
          const distance = Math.abs(expressionValue - archetypeValue);
          scoreSum += Math.abs(expressionValue) * Math.exp(-distance * distance * 2.0);
        });

        highlightScore = scoreSum / totalExpressionMag;
      } else {
        highlightScore = (archetype.cluster === 'resources') ? 0.5 : 0.0;
      }
      highlightScore = Math.max(highlightScore, (isSelected || isFirstCompare) ? 1.0 : 0.0);

      const inCluster = this.activeClusterFilters().size === 0 || this.activeClusterFilters().has(archetype.cluster!);

      group.visible = inCluster;
      if (!inCluster) return; // Skip visual updates for hidden groups

      let targetOpacity = 0.3 + highlightScore * 0.7;
      const hoverScale = group.userData.isHovered ? 1.25 : 1.0;

      if (this.isComparing() && !this.selectedArchetype() && !isFirstCompare && inCluster) {
        targetOpacity *= 0.5;
      }

      // Opacity + highlight damp toward their targets INSIDE the shader
      // uniforms — frame-rate independent (identical feel at 60/90/120Hz).
      const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms;
      if (uniforms?.uOpacity) {
        uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, targetOpacity, 1 - Math.exp(-4.5 * dt));
      }
      if (uniforms?.uHighlight) {
        // Highlight feeds the heart glow (blooms when selected) and wobble amp
        uniforms.uHighlight.value = THREE.MathUtils.lerp(uniforms.uHighlight.value, highlightScore, 1 - Math.exp(-3.5 * dt));
      }

      // Idle bob animation (interpolated to targetPosition)
      const bobOffset = this.prefersReducedMotion ? 0 : Math.sin(elapsedTime * 0.8 + group.userData.bobOffset) * 0.1;
      const baseScale = group.userData.baseScale;

      // Size encodes prominence in the default view (v2 plan Layer 2): scale
      // breathes with highlight, and hover swell stacks on top.
      const targetS = baseScale * hoverScale * (1 + highlightScore * 0.35);
      mesh.scale.lerp(this.vec3_3.set(targetS, targetS, targetS), 1 - Math.exp(-6 * dt));
      this.syncFeltCharacterScale(group, targetS, dt);

      // Bob the mesh vertically
      group.position.y = group.userData.targetPosition.y + bobOffset;

      // Update shadow position and opacity
      if (shadow) {
        const shadowMat = shadow.material as THREE.SpriteMaterial;
        shadowMat.opacity = targetOpacity * 0.3;
        shadow.position.y = -baseScale / 2 - 0.2 + bobOffset * 0.5;
      }

      // Update position (damped — buttery re-arrival after isolation/genesis)
      if (this.isolatedDimension()) {
        this.applyIsolation(group, this.isolatedDimension()!, dt);
      } else {
        const posK = 1 - Math.exp(-3.5 * dt);
        group.position.x += (group.userData.targetPosition.x - group.position.x) * posK;
        group.position.z += (group.userData.targetPosition.z - group.position.z) * posK;
      }

      // Handle aura
      if (aura) {
        aura.visible = group.userData.isHovered;
        if (aura.visible) {
          const pulse = 0.5 + Math.sin(elapsedTime * 3) * 0.5;
          const auraSprite = aura.children[0] as THREE.Sprite;
          if (auraSprite) {
            const auraMat = auraSprite.material as THREE.SpriteMaterial;
            auraMat.opacity = 0.3 + pulse * 0.4;
            const auraScale = baseScale * 2.5 + pulse * 0.3;
            auraSprite.scale.set(auraScale, auraScale, 1);
            auraSprite.rotation.z += 0.01;
          }
        }
      }
    });

    // Update dust particles (twinkle).
    // PERF: color-buffer rewrite throttled to every 15th frame (~4Hz) —
    // the twinkle is a slow sine; per-frame rewrites burned CPU for nothing.
    if (this.dustParticles) {
      if (this.frameCount % 15 === 0) {
        const colors = this.dustParticles.geometry.attributes.color as THREE.BufferAttribute;
        for (let i = 0; i < colors.count; i++) {
          const twinkle = Math.sin(elapsedTime * 2 + i * 0.1) * 0.3 + 0.7;
          colors.setXYZ(i, twinkle, twinkle * 0.9, twinkle * 0.8);
        }
        colors.needsUpdate = true;
      }
      // Slow rotation of dust system
      this.dustParticles.rotation.y = elapsedTime * 0.01;
    }

    // Update background shader time
    if (this.backgroundMaterial) {
      this.backgroundMaterial.uniforms.uTime.value = elapsedTime;
    }
  }

  private updatePersonalConstellationVisuals(dt: number, elapsedTime: number, constellation: { archetypeId: string, percentage: number }[]): void {
    let totalExpressionMag = 0;
    Object.values(this.dimensionalExpressions()).forEach(v => totalExpressionMag += Math.abs(v));

    this.archetypeObjects.forEach(group => {
      const archetype = group.userData.archetype as Archetype;
      const match = constellation.find(p => p.archetypeId === archetype.id);

      // Respect cluster filters
      const inCluster = this.activeClusterFilters().size === 0 || this.activeClusterFilters().has(archetype.cluster!);
      group.visible = !!match && inCluster;

      if (match) {
        const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
        const shadow = group.getObjectByName('blobShadow') as THREE.Sprite;
        const label = group.getObjectByName('archetypeLabel') as CSS2DObject;
        const aura = group.userData.aura as THREE.Group;

        if (!mesh) return;

        const isSelected = this.selectedArchetype()?.id === archetype.id;

        // Dimension-based highlighting (same formula as exploration)
        let dimHighlight = 0;
        if (totalExpressionMag > 0.01) {
          let scoreSum = 0;
          DIMENSION_KEYS.forEach((key, i) => {
            const expressionValue = this.dimensionalExpressions()[key];
            const archetypeValue = archetype.coordinates[i];
            const distance = Math.abs(expressionValue - archetypeValue);
            scoreSum += Math.abs(expressionValue) * Math.exp(-distance * distance * 2.0);
          });
          dimHighlight = scoreSum / totalExpressionMag;
        } else {
          dimHighlight = 0.5;
        }

        // Show label (dim if low dimension match)
        if (label) {
          const labelEl = label.element as HTMLElement;
          labelEl.style.opacity = totalExpressionMag > 0.01 ? String(0.3 + dimHighlight * 0.7) : '1';
          labelEl.style.transform = 'translateY(0)';
        }

        // Scale based on match percentage/prominence and dimension highlight
        const baseScale = group.userData.baseScale;
        const dimScale = totalExpressionMag > 0.01 ? 0.7 + dimHighlight * 0.5 : 1.0;
        const relevanceScale = (0.6 + (match.percentage / 100)) * dimScale;
        const finalScale = baseScale * relevanceScale * (isSelected ? 1.15 : 1.0);
        mesh.scale.lerp(this.vec3_3.set(finalScale, finalScale, finalScale), 1 - Math.exp(-6 * dt));
        this.syncFeltCharacterScale(group, finalScale, dt);

        // Highlight feeds the heart glow here too
        const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms;
        if (uniforms?.uHighlight) {
          uniforms.uHighlight.value = THREE.MathUtils.lerp(uniforms.uHighlight.value, dimHighlight, 1 - Math.exp(-3.5 * dt));
        }

        // Update shadow
        if (shadow) {
          const shadowMat = shadow.material as THREE.SpriteMaterial;
          shadowMat.opacity = 0.3;
          shadow.scale.set(finalScale * 0.8, finalScale * 0.3, 1);
        }

        // Idle bob
        const bobOffset = Math.sin(elapsedTime * Math.PI + group.userData.bobOffset) * 0.15;
        group.position.y = group.userData.targetPosition.y + bobOffset;

        // Aura effect
        if (aura) {
          aura.visible = true;
          const pulse = 0.5 + Math.sin(elapsedTime * 2.5) * 0.5;
          const auraSprite = aura.children[0] as THREE.Sprite;
          if (auraSprite) {
            const auraMat = auraSprite.material as THREE.SpriteMaterial;
            const auraColor = (FAMILY_META as Record<string, { color: string }>)[archetype.cluster ?? '']?.color ?? '#D5793B';
            auraMat.color.set(auraColor);
            auraMat.opacity = 0.4 + pulse * 0.5;
            const auraScale = finalScale * 2.2 + pulse * 0.3;
            auraSprite.scale.set(auraScale, auraScale, 1);
            auraSprite.rotation.z += 0.015;
          }
        }

        const posK = 1 - Math.exp(-3 * dt);
        group.position.x += (group.userData.targetPosition.x - group.position.x) * posK;
        group.position.z += (group.userData.targetPosition.z - group.position.z) * posK;
      }
    });
  }

  private applyIsolation(group: THREE.Group, isolation: string, dt: number): void {
      const original = group.userData.targetPosition;
      let target = original.clone();
      const archetype = group.userData.archetype as Archetype;
      if (isolation === 'AGENCY') target = new THREE.Vector3(original.x, 0, 0);
      if (isolation === 'TEMPERATURE') target = new THREE.Vector3(0, original.y, 0);
      if (isolation === 'FOCUS') target = new THREE.Vector3(0, 0, original.z);
      if (isolation === 'ATTACHMENT') {
        const agencyValue = archetype.coordinates[0] * POSITION_SCALE;
        const attachmentValue = archetype.coordinates[3] * POSITION_SCALE;
        target = new THREE.Vector3(agencyValue, attachmentValue, 0);
      }
      group.position.lerp(target, 1 - Math.exp(-3 * dt));
  }

  private updateTethers(): void {
    this.relationalTethersGroup.children.forEach(child => {
      if (child instanceof THREE.Line) {
        child.geometry?.dispose();
        (child.material as THREE.Material)?.dispose();
      }
    });
    this.relationalTethersGroup.clear();
    this.tetherMaterials = [];
    const tetherSource = this.selectedArchetype() ?? this.focusedArchetype();
    if (!tetherSource) return;

    const sourceObj = this.archetypeObjects.find(o => o.userData.archetype.id === tetherSource.id);
    if (!sourceObj) return;

    const attractIds = buildDynamicRelationalIds(tetherSource, this.allArchetypes());

    attractIds.forEach(targetId => {
      if (tetherSource.id === targetId) return;
      const targetObj = this.archetypeObjects.find(o => o.userData.archetype.id === targetId);
      if (targetObj) {
        // Create hand-drawn curved line
        const midPoint = new THREE.Vector3()
          .addVectors(sourceObj.position, targetObj.position)
          .multiplyScalar(0.5);

        // Add curve offset for hand-drawn feel
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        midPoint.add(offset);

        const curve = new THREE.QuadraticBezierCurve3(
          sourceObj.position,
          midPoint,
          targetObj.position
        );

        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Star-chart ink: pale gold dashes that read against the night sky
        const material = new THREE.LineDashedMaterial({
          color: 0xe8d5a8,
          linewidth: 1.5,
          dashSize: 0.3,
          gapSize: 0.2,
          transparent: true,
          opacity: 0,
          scale: 1
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        this.relationalTethersGroup.add(line);
        this.tetherMaterials.push(material);

        // Draw-in: each tether fades up in sequence — the constellation
        // "writes itself" when a part is focused (the reveal anchor).
        gsap.to(material, {
          opacity: 0.5,
          duration: 0.7,
          delay: this.tetherMaterials.length * 0.07,
          ease: 'power2.out',
        });
      } else {
        console.warn(`[Relational Map] Could not find target archetype with id: '${targetId}' for source: '${tetherSource.name}'`);

      }
    });
  }
  
  private updateTetherAnimation(): void {
    // Flowing ink only — opacity belongs to the draw-in tween, never fought over.
    this.tetherMaterials.forEach(material => {
      material.dashOffset -= 0.012;
    });
  }

  private updateConstellationLines(filters: Set<string>): void {
    this.constellationLinesGroup.children.forEach(child => {
      if (child instanceof THREE.Line) {
        child.geometry?.dispose();
        (child.material as THREE.Material)?.dispose();
      }
    });
    this.constellationLinesGroup.clear();
    if (filters.size !== 1) return;
    const clusterId = filters.values().next().value;
    const members = this.archetypeObjects.filter(o => o.userData.archetype.cluster === clusterId);

    // Hand-drawn style constellation lines
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        // Create slightly curved connection for hand-drawn feel
        const midPoint = new THREE.Vector3()
          .addVectors(members[i].position, members[j].position)
          .multiplyScalar(0.5);

        // Deterministic "hand-drawn" jitter: stable per current user + archetype pair.
        const idA = (members[i].userData?.archetype?.id || String(i));
        const idB = (members[j].userData?.archetype?.id || String(j));
        const pairKey = [idA, idB].sort().join('|');
        const baseSeed = `${this.determinismSeed || 'default'}:${clusterId}:${pairKey}`;
        const jitterScale = 0.5;

        midPoint.x += (this.hashToUnit(baseSeed + ':x') - 0.5) * jitterScale;
        midPoint.y += (this.hashToUnit(baseSeed + ':y') - 0.5) * jitterScale;
        midPoint.z += (this.hashToUnit(baseSeed + ':z') - 0.5) * jitterScale;

        const curve = new THREE.QuadraticBezierCurve3(
          members[i].position,
          midPoint,
          members[j].position
        );

        const points = curve.getPoints(10);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineDashedMaterial({
          color: 0xd9cfb0, // warm parchment ink — star atlas lines
          linewidth: 1,
          dashSize: 0.2,
          gapSize: 0.15,
          transparent: true,
          opacity: 0.4
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        this.constellationLinesGroup.add(line);
      }
    }
  }

  private handleFocusChange(focused: Archetype | null) {
    if (this.focusTag) this.focusTag.parent?.remove(this.focusTag);
    this.focusTag = null;
    if (focused) {
      const obj = this.archetypeObjects.find(o => o.userData.archetype.id === focused.id);
      if (obj) {
        const div = document.createElement('div');
        div.className = 'focus-tag';
        div.textContent = this.translationService.getArchetypeField(focused.id, 'name', focused.name);
        div.style.color = focused.color;
        div.style.backgroundColor = '#FBF5E6'; // solid cream chip — no translucent backdrop
        div.style.border = '1.5px solid #1C1610';
        div.style.borderRadius = '999px';
        div.style.padding = '3px 10px';
        div.style.fontFamily = "'Fraunces', serif";
        div.style.fontSize = '12px';
        div.style.fontWeight = '700';
        this.focusTag = new CSS2DObject(div);
        obj.add(this.focusTag);
        setTimeout(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(-50px)';
        }, 10);
      }
    }
  }

  private handleIsolationChange(isolation: string | null): void {
    if (!this.controls || !this.camera) return;
    
    this.cancelCameraAnimation();
    this.controls.enabled = false;

    let targetPos = new THREE.Vector3(15, 15, 15);
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    this.gridGroups.children.forEach(grid => {
      const key = grid.userData.key;
      let shouldBeVisible = false;
      if (isolation === null) shouldBeVisible = true;
      else if (isolation === 'AGENCY') shouldBeVisible = key === 'TEMPERATURE_FOCUS';
      else if (isolation === 'TEMPERATURE') shouldBeVisible = key === 'AGENCY_FOCUS';
      else if (isolation === 'FOCUS') shouldBeVisible = key === 'AGENCY_TEMPERATURE';
      else if (isolation === 'ATTACHMENT') shouldBeVisible = key === 'AGENCY_TEMPERATURE';
      grid.visible = shouldBeVisible;
    });

    if (isolation) {
      if (isolation === 'AGENCY' || isolation === 'ATTACHMENT') targetPos.set(0, 0, 25);
      if (isolation === 'TEMPERATURE' || isolation === 'FOCUS') targetPos.set(25, 0, 0);
    }

    gsap.to(this.controls.target, {
      x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z,
      duration: 1.2,
      ease: "power2.inOut"
    });

    gsap.to(this.camera.position, {
      x: targetPos.x, y: targetPos.y, z: targetPos.z,
      duration: 1.5,
      ease: "expo.inOut",
      onComplete: () => {
        this.controls.enabled = true;
      }
    });
  }


  private updateAxisLabels(): void {
    const isolation = this.isolatedDimension();
    const isolationActive = isolation !== null;
    
    if (isolation === 'ATTACHMENT') {
        this.axisLabels.active.element.textContent = this.translationService.t('agencyHypo', 'universe.dimensions');
        this.axisLabels.receptive.element.textContent = this.translationService.t('agencyHyper', 'universe.dimensions');
        this.axisLabels.hot.element.textContent = this.translationService.t('attachmentHyper', 'universe.dimensions');
        this.axisLabels.cool.element.textContent = this.translationService.t('attachmentHypo', 'universe.dimensions');
    } else {
        this.axisLabels.active.element.textContent = this.translationService.t('agencyHypo', 'universe.dimensions');
        this.axisLabels.receptive.element.textContent = this.translationService.t('agencyHyper', 'universe.dimensions');
        this.axisLabels.hot.element.textContent = this.translationService.t('temperatureHyper', 'universe.dimensions');
        this.axisLabels.cool.element.textContent = this.translationService.t('temperatureHypo', 'universe.dimensions');
    }

    for (const key in this.axisLabels) {
        const label = this.axisLabels[key];
        const labelDiv = label.element as HTMLElement;
        let targetOpacity = 1.0;
        
        const camToOrigin = this.vec3_1.set(0, 0, 0).sub(this.camera.position).normalize();
        const originToLabel = this.vec3_2.copy(label.position).normalize();
        const angle = camToOrigin.angleTo(originToLabel);
        
        if (isolationActive) {
            targetOpacity = 0.0;
            if (isolation === 'ATTACHMENT' && ['active', 'receptive', 'hot', 'cool'].includes(key)) targetOpacity = 1.0;
            else if (isolation === 'AGENCY' && ['hot','cool','self','other'].includes(key)) targetOpacity = 0.0;
            else if (isolation === 'TEMPERATURE' && ['active','receptive','self','other'].includes(key)) targetOpacity = 0.0;
            else if (isolation === 'FOCUS' && ['active','receptive','hot','cool'].includes(key)) targetOpacity = 0.0;
        } else {
            const visibilityFactor = (Math.cos(angle) + 1) / 2;
            targetOpacity = 0.2 + visibilityFactor * 0.8;
        }

        // PERF: lerp runs at 30Hz with a doubled factor — identical perceived
        // smoothing, half the style writes of the former 60Hz loop.
        if (this.frameCount % 2 !== 0) return;
        let currentOpacity = parseFloat(labelDiv.style.opacity);
        if (isNaN(currentOpacity)) currentOpacity = targetOpacity;

        const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.2);
        labelDiv.style.opacity = newOpacity.toString();
        labelDiv.style.visibility = newOpacity > 0.01 ? 'visible' : 'hidden';
    }
}
  
  private checkIntersection = () => {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.getVisibleArchetypes(), true);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData.archetype) obj = obj.parent;
      return obj.userData.archetype || null;
    }
    return null;
  }

  private getVisibleArchetypes(): THREE.Group[] {
    return this.archetypeObjects.filter(o => o.visible);
  }

  private onWindowResize = () => {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);

    if (this.sketchyOutlinePass) {
      const pr = this.renderer.getPixelRatio();
      this.sketchyOutlinePass.uniforms['resolution'].value.set(
        window.innerWidth * pr,
        window.innerHeight * pr
      );
    }
    if (this.starMaterial) {
      this.starMaterial.uniforms['uPixelRatio'].value = Math.min(this.renderer.getPixelRatio(), 2);
    }
  };

  /** True for the WebGL canvas, a satellite label (sticker or name chip), or a focus tag. */
  private isUniversePointerTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    if (target === this.renderer?.domElement) return true;
    return !!target.closest('.archetype-label, .focus-tag');
  }

  private onPointerDown = (e: PointerEvent) => {
    // Check if the click is on the canvas or an element that should allow pass-through
    if (!this.isUniversePointerTarget(e.target)) {
      return;
    }
    this.governor?.pointerDown(); // input→frame latency sample
    this.onUserInteraction();
    // Self-heal: an interrupted cinematic (tween killed outside
    // cancelCameraAnimation) can leave the controls disabled — re-enable
    // unless a camera animation is genuinely in flight.
    if (this.controls && !this.controls.enabled &&
        !gsap.isTweening(this.camera!.position) && !gsap.isTweening(this.controls.target)) {
      this.controls.enabled = true;
    }
    this.isPointerDown = true;
    this.isDragging = false;
    this.pointerDownPosition.set(e.clientX, e.clientY);
  }

  private onPointerMove = (e: PointerEvent) => {
    this.onUserInteraction();
    const isCanvasOrLabel = this.isUniversePointerTarget(e.target);
    
    if (this.isPointerDown && !this.isDragging) {
      if (this.pointerDownPosition.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > this.dragThreshold) {
        this.isDragging = true;
        this.universeState.focusedArchetype.set(null);
      }
    }
    if (e.pointerType === 'mouse' && !this.isDragging && isCanvasOrLabel) {
      clearTimeout(this.hoverDebounceTimeout);
      this.hoverDebounceTimeout = setTimeout(() => {
          this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
          this.universeState.focusedArchetype.set(this.checkIntersection());
      }, 50);
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    const isCanvasOrLabel = this.isUniversePointerTarget(e.target);

    if (this.isPointerDown && !this.isDragging && isCanvasOrLabel) {
      this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      const intersected = this.checkIntersection();

      if (this.isComparing() && intersected && intersected.id === this.firstComparisonArchetype()?.id) {
        return;
      }

      if (e.pointerType === 'mouse') {
          this.selectedArchetype.set(intersected);
      } else {
          if (intersected) {
              if (this.focusedArchetype()?.id === intersected.id) {
                  this.selectedArchetype.set(intersected); 
                  this.universeState.focusedArchetype.set(null);
              } else {
                  this.universeState.focusedArchetype.set(intersected);
                  if(!this.isComparing()) this.selectedArchetype.set(null); 
              }
          } else {
              this.universeState.focusedArchetype.set(null);
              if(!this.isComparing()) this.selectedArchetype.set(null);
          }
      }
    }

    this.isPointerDown = false;
    this.isDragging = false;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) {
        return;
    }

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowUp':
            e.preventDefault();
            this.cycleFocus(e.key);
            break;
        case 'Enter':
            e.preventDefault();
            if (this.focusedArchetype()) {
                this.selectedArchetype.set(this.focusedArchetype());
                this.universeState.focusedArchetype.set(null);
            }
            break;
        case 'Escape':
            e.preventDefault();
            if (this.selectedArchetype()) {
                this.universeState.selectedArchetype.set(null);
            } else if (this.firstComparisonArchetype()) {
                // Handled in component
            } else if (this.focusedArchetype()) {
                this.universeState.focusedArchetype.set(null);
            }
            break;
    }
  };

  private cycleFocus(direction: 'ArrowRight' | 'ArrowDown' | 'ArrowLeft' | 'ArrowUp'): void {
    const visibleObjects = this.getVisibleArchetypes();
    if (visibleObjects.length === 0) return;

    const screenPositions = visibleObjects.map(obj => {
        const vector = new THREE.Vector3();
        obj.getWorldPosition(vector);
        vector.project(this.camera);
        return { obj, x: vector.x, y: vector.y, id: obj.userData.archetype.id };
    });

    const currentFocused = this.focusedArchetype();
    let currentIndex = -1;
    if (currentFocused) {
        currentIndex = screenPositions.findIndex(p => p.id === currentFocused.id);
    }

    if (currentIndex === -1) {
        screenPositions.sort((a,b) => (a.x**2 + a.y**2) - (b.x**2 + b.y**2));
        if (screenPositions.length > 0) {
            this.universeState.focusedArchetype.set(screenPositions[0].obj.userData.archetype);
        }
        return;
    }

    const currentPos = screenPositions[currentIndex];
    let bestCandidate: { obj: THREE.Group, distance: number } | null = null;

    for (let i = 0; i < screenPositions.length; i++) {
        if (i === currentIndex) continue;

        const candidatePos = screenPositions[i];
        const dx = candidatePos.x - currentPos.x;
        const dy = candidatePos.y - currentPos.y;

        let isCandidate = false;
        if (direction === 'ArrowRight' && dx > 0.01 && Math.abs(dx) > Math.abs(dy)) isCandidate = true;
        if (direction === 'ArrowLeft' && dx < -0.01 && Math.abs(dx) > Math.abs(dy)) isCandidate = true;
        if (direction === 'ArrowDown' && dy < -0.01 && Math.abs(dy) > Math.abs(dx)) isCandidate = true;
        if (direction === 'ArrowUp' && dy > 0.01 && Math.abs(dy) > Math.abs(dx)) isCandidate = true;
        
        if (isCandidate) {
            const distance = dx * dx + dy * dy;
            if (!bestCandidate || distance < bestCandidate.distance) {
                bestCandidate = { obj: candidatePos.obj, distance };
            }
        }
    }

    if (bestCandidate) {
        this.universeState.focusedArchetype.set(bestCandidate.obj.userData.archetype);
        const targetObj = bestCandidate.obj;
        if (targetObj) {
            this.controls.target.lerp(targetObj.position, 0.4);
        }
    }
  }
}
