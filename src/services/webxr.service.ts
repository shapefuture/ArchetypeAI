import { Injectable, signal, computed, effect, inject, NgZone } from '@angular/core';

import * as THREE from 'three';
import { Timer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { TranslationService } from './translation.service';
import { gsap } from 'gsap';



// --- DATA STRUCTURES ---
export interface Archetype {
  id: string;
  name: string;
  coordinates: [number, number, number, number];
  color: string;
  size: number;
  symbol: string;
  description?: string;
  wound?: string;
  cluster?: string;
  quality?: string;
  shadow?: string;
  invitation: string;
  coreBelief: string;
  attracts: string;
  integratedForm?: string;
}

export interface Dimension {
  key: string;
  labels: { hypo: string, hyper: string };
  min: number;
  max: number;
}

export interface DimensionalExpressions {
  [key: string]: number; // from -1 to 1, with 0 being balanced
}


// --- DATA & CONSTANTS ---
const DIMENSIONS_DATA: { [key: string]: { min: number, max: number, labels: { hypo: string, hyper: string } } } = {
  AGENCY: { min: -1.0, max: 1.0, labels: { hypo: "Active", hyper: "Receptive" } },
  TEMPERATURE: { min: -1.0, max: 1.0, labels: { hypo: "Cool", hyper: "Hot" } },
  FOCUS: { min: -1.0, max: 1.0, labels: { hypo: "Self", hyper: "Other" } },
  ATTACHMENT: { min: -1.0, max: 1.0, labels: { hypo: "Avoidant", hyper: "Anxious" } }
};
const DIMENSION_KEYS = Object.keys(DIMENSIONS_DATA);
const POSITION_SCALE = 10;

const ALL_ARCHETYPES: Archetype[] = [
    // 4 GIFT ARCHETYPES
    {
        id: "the_sovereign",
        name: "The Sovereign",
        coordinates: [-0.2, 0.1, -0.1, -0.1],
        color: "#4A90E2",
        size: 0.8,
        symbol: "💎",
        cluster: "gift_archetypes",
        quality: "Clarity & Precision",
        description: "Master of context-appropriate expression",
        coreBelief: "I am the source of my experience. My internal state creates my external reality.",
        attracts: "Other sovereign beings for co-creation and conscious relationship",
        invitation: "To balance clarity with compassion and control with surrender",
        shadow: "Can become rigid or controlling when threatened"
    },
    {
        id: "the_relational_fluent",
        name: "The Relational Fluent",
        coordinates: [0.3, 0.2, 0.2, 0.1],
        color: "#00B4D8",
        size: 0.85,
        symbol: "🌊",
        cluster: "gift_archetypes",
        quality: "Adaptability & Flow",
        description: "Flows seamlessly between connection and autonomy",
        coreBelief: "Connection and autonomy are a dance, not a conflict. I can move between them with grace.",
        attracts: "Partners who value both deep intimacy and healthy independence",
        invitation: "To maintain core self while flowing with relational currents",
        shadow: "Can lose center in turbulent relationships"
    },
    {
        id: "the_embodied_wisdom",
        name: "The Embodied Wisdom",
        coordinates: [0.1, 0.4, 0.3, -0.2],
        color: "#FF6B6B",
        size: 0.9,
        symbol: "🎨",
        cluster: "gift_archetypes",
        quality: "Grounded Presence & Emotional Intelligence",
        description: "Grounded presence with emotional intelligence",
        coreBelief: "My body is an intelligent guide. True knowing comes from integrating mind, heart, and gut.",
        attracts: "Those ready for deep, present intimacy beyond surface connection",
        invitation: "To trust bodily wisdom while maintaining healthy energetic boundaries",
        shadow: "Can become overwhelmed by others' emotional states"
    },
    {
        id: "the_creative_synthesis",
        name: "The Creative Synthesis",
        coordinates: [-0.1, 0.3, -0.2, 0.2],
        color: "#38B000",
        size: 0.75,
        symbol: "🌳",
        cluster: "gift_archetypes",
        quality: "Generative Innovation",
        description: "Innovates relational patterns from center",
        coreBelief: "All parts of me are valuable. By integrating my shadows and gifts, I create new possibilities.",
        attracts: "Collaborators who see challenges as creative opportunities",
        invitation: "To balance innovation with appreciation for what already works",
        shadow: "Can over-complicate simple relationships"
    },
    // 20 SHADOW ARCHETYPES
    {
        id: "the_tyrant",
        name: "The Tyrant",
        coordinates: [-0.9, -0.8, -0.9, -0.7],
        color: "#6A040F",
        size: 0.6,
        symbol: "⚔️",
        cluster: "control_shadows",
        wound: "Hyper-control, cannot receive",
        coreBelief: "The world is unsafe. I must control everything and everyone to protect myself.",
        shadow: "Domination & Rigidity",
        invitation: "To release control and learn to receive",
        attracts: "Rebels who challenge their power or The Doormat who submit to it",
        integratedForm: "Tyrant → Guardian → Sovereign"
    },
    {
        id: "the_perfectionist",
        name: "The Perfectionist",
        coordinates: [-0.8, -0.7, -0.8, 0.6],
        color: "#6D6875",
        size: 0.55,
        symbol: "⚙️",
        cluster: "control_shadows",
        wound: "Rigid control masking deep insecurity",
        coreBelief: "I am only valuable if I am flawless. My mistakes are proof of my unworthiness.",
        shadow: "Paralyzing Self-Criticism",
        invitation: "To embrace 'good enough' and the beauty of imperfection",
        attracts: "Critics who mirror their inner judge, or partners they feel they can 'fix'",
        integratedForm: "Perfectionist → Analyst → Creative Synthesis"
    },
    {
        id: "the_guardian",
        name: "The Guardian",
        coordinates: [-0.7, -0.6, 0.7, -0.8],
        color: "#1B9AAA",
        size: 0.65,
        symbol: "🏹",
        cluster: "control_shadows",
        wound: "Protective but emotionally unavailable",
        coreBelief: "Love means protecting others from pain, even if it means walling off my own heart.",
        shadow: "Emotional Unavailability",
        invitation: "To find safety in vulnerability and authentic connection",
        attracts: "People who feel unsafe or need rescuing, reinforcing their protector role",
        integratedForm: "Guardian → Anchor → Sovereign"
    },
    {
        id: "the_sentinel",
        name: "The Sentinel",
        coordinates: [-0.6, -0.4, 0.9, -0.9],
        color: "#7F8C8D",
        size: 0.6,
        symbol: "🛡️",
        cluster: "control_shadows",
        wound: "Over-protects others while remaining emotionally distant",
        coreBelief: "Confuses protection with love - if I keep everyone safe, I don't have to feel my own vulnerability.",
        shadow: "Strategic Distance",
        invitation: "To learn that vulnerability is the gateway to true intimacy",
        attracts: "Partners who need constant protection, validating their defensive posture",
        integratedForm: "Sentinel → Embodied Wisdom"
    },
    {
        id: "the_tempest",
        name: "The Tempest",
        coordinates: [-0.9, 0.9, -0.8, -0.6],
        color: "#9D0208",
        size: 0.95,
        symbol: "🌋",
        cluster: "emotional_storm_shadows",
        wound: "Volcanic emotions with intimacy avoidance",
        coreBelief: "My emotions are overwhelming and dangerous. I must push people away before I destroy them.",
        shadow: "Reactive Emotionality",
        invitation: "To find the ground within the storm and respond with intention",
        attracts: "Calm, avoidant partners they try to provoke, or anxious partners who fuel drama",
        integratedForm: "Tempest → Wild → Embodied Wisdom"
    },
    {
        id: "the_destroyer",
        name: "The Destroyer",
        coordinates: [-0.95, 0.95, -0.9, 0.8],
        color: "#DC2F02",
        size: 1.0,
        symbol: "🔥",
        cluster: "emotional_storm_shadows",
        wound: "Uncontained emotional fire",
        coreBelief: "If I feel threatened or abandoned, I must burn everything to the ground to regain power.",
        shadow: "Uncontrolled Destruction",
        invitation: "To channel intense energy into creative, not destructive, acts",
        attracts: "Partners who trigger abandonment wounds, creating self-fulfilling destruction",
        integratedForm: "Destroyer → Creative Synthesis"
    },
    {
        id: "the_crusader",
        name: "The Crusader",
        coordinates: [-0.8, 0.8, 0.7, -0.5],
        color: "#D00000",
        size: 0.85,
        symbol: "⚔️",
        cluster: "emotional_storm_shadows",
        wound: "Fights for causes to avoid intimacy",
        coreBelief: "Focusing on a grand cause allows me to avoid the terrifying vulnerability of personal intimacy.",
        shadow: "Externalized Purpose",
        invitation: "To find a cause worthy of passion within one's own heart",
        attracts: "Followers for their cause, or partners willing to take backseat to mission",
        integratedForm: "Crusader → Relational Fluent"
    },
    {
        id: "the_rebel",
        name: "The Rebel",
        coordinates: [-0.9, 0.5, -0.9, 0.3],
        color: "#7209B7",
        size: 0.75,
        symbol: "⚡",
        cluster: "emotional_storm_shadows",
        wound: "Rejects all structure and authority, including healthy boundaries",
        coreBelief: "All rules are prisons. If I conform in any way, I lose myself completely.",
        shadow: "Chronic Opposition",
        invitation: "To distinguish between oppressive control and healthy structure",
        attracts: "Controllers they can rebel against, or followers who admire their defiance",
        integratedForm: "Rebel → Creative Synthesis"
    },
    {
        id: "the_ghost",
        name: "The Ghost",
        coordinates: [0.9, -0.9, -0.9, -0.8],
        color: "#B8B8B8",
        size: 0.5,
        symbol: "👻",
        cluster: "avoidant_intellectual_shadows",
        wound: "Complete emotional withdrawal",
        coreBelief: "To be seen is to be annihilated. The only safety is in complete invisibility.",
        shadow: "Radical Unavailability",
        invitation: "To risk being seen in one's true form, even if it feels unsafe",
        attracts: "Anxious partners who chase them, reinforcing need to disappear",
        integratedForm: "Ghost → Ice Queen → Oracle"
    },
    {
        id: "the_ice_queen",
        name: "The Ice Queen",
        coordinates: [0.8, -0.95, -0.8, -0.9],
        color: "#A8DADC",
        size: 0.45,
        symbol: "❄️",
        cluster: "avoidant_intellectual_shadows",
        wound: "Complete emotional shutdown and isolation",
        coreBelief: "Feelings are weakness. I built these walls of ice to protect a heart that feels too much.",
        shadow: "Frozen Heart",
        invitation: "To allow the first crack in the ice and feel the warmth of connection",
        attracts: "Passionate partners who try to 'melt' them, confirming emotions are invasive",
        integratedForm: "Ice Queen → Embodied Wisdom"
    },
    {
        id: "the_analyst",
        name: "The Analyst",
        coordinates: [0.7, -0.8, 0.5, -0.6],
        color: "#4CC9F0",
        size: 0.55,
        symbol: "🔍",
        cluster: "avoidant_intellectual_shadows",
        wound: "Over-analysis prevents authentic experience",
        coreBelief: "Life is a problem to be solved from a safe distance, not a mystery to be lived.",
        shadow: "Detached Observation",
        invitation: "To step into the river of life instead of just studying it from the bank",
        attracts: "Emotional partners they can study like fascinating alien species",
        integratedForm: "Analyst → Sage → Creative Synthesis"
    },
    {
        id: "the_anxious_intellectual",
        name: "The Anxious Intellectual",
        coordinates: [0.8, -0.7, -0.8, 0.7],
        color: "#C77DFF",
        size: 0.6,
        symbol: "🧠",
        cluster: "avoidant_intellectual_shadows",
        wound: "Over-analysis with fear of being seen",
        coreBelief: "If I can just think my way through my feelings, I can avoid the messiness of actually feeling them.",
        shadow: "Analysis Paralysis",
        invitation: "To drop from the mind into the feeling body",
        attracts: "Emotional partners they can analyze, or intellectuals avoiding embodiment",
        integratedForm: "Anxious Intellectual → Embodied Wisdom"
    },
    {
        id: "the_martyr",
        name: "The Martyr",
        coordinates: [0.6, 0.5, 0.9, 0.8],
        color: "#457B9D",
        size: 0.65,
        symbol: "✝️",
        cluster: "anxious_connection_shadows",
        wound: "Complete self-abandonment",
        coreBelief: "My needs don't matter. My worth comes from sacrificing myself for others.",
        shadow: "Resentful Self-Sacrifice",
        invitation: "To honor one's own needs as sacred",
        attracts: "Narcissists, Tyrants, or 'Takers' who exploit their generosity",
        integratedForm: "Martyr → Weaver → Relational Fluent"
    },
    {
        id: "the_people_pleaser",
        name: "The People Pleaser",
        coordinates: [0.9, 0.3, 0.9, 0.9],
        color: "#9B5DE5",
        size: 0.7,
        symbol: "😊",
        cluster: "anxious_connection_shadows",
        wound: "Seeks validation through constant accommodation",
        coreBelief: "I must agree with everyone and meet their needs to be loved. My true self is unlovable.",
        shadow: "Identity Loss",
        invitation: "To disappoint someone today and survive the experience",
        attracts: "Demanding partners who take advantage of their lack of boundaries",
        integratedForm: "People Pleaser → Anchor → Sovereign"
    },
    {
        id: "the_sensitive_soul",
        name: "The Sensitive Soul",
        coordinates: [0.9, 0.8, 0.8, 0.9],
        color: "#FF5D8F",
        size: 0.85,
        symbol: "🌸",
        cluster: "anxious_connection_shadows",
        wound: "Absorbs emotions but fears engulfment",
        coreBelief: "I feel everything so deeply that I have no skin. Other people's emotions overwhelm and define me.",
        shadow: "Emotional Sponging",
        invitation: "To build energetic boundaries that honor both self and other",
        attracts: "Emotionally chaotic partners they absorb, or stoic partners they try to 'open up'",
        integratedForm: "Sensitive Soul → Embodied Wisdom"
    },
    {
        id: "the_chameleon",
        name: "The Chameleon",
        coordinates: [0.95, 0.4, 0.85, 0.7],
        color: "#27AE60",
        size: 0.65,
        symbol: "🦎",
        cluster: "anxious_connection_shadows",
        wound: "Over-adapts to others, losing core identity",
        coreBelief: "My authentic self is unlovable. I must become what others want me to be.",
        shadow: "Shape-Shifting",
        invitation: "To discover which relationships survive self-revelation",
        attracts: "Partners with strong personalities who don't know the real them",
        integratedForm: "Chameleon → Relational Fluent"
    },
    {
        id: "the_enchantress",
        name: "The Enchantress",
        coordinates: [0.9, 0.7, -0.7, -0.8],
        color: "#FF006E",
        size: 0.8,
        symbol: "🔮",
        cluster: "seductive_avoidance_shadows",
        wound: "Magnetic attraction with commitment avoidance",
        coreBelief: "I can attract anyone, but if they get too close, they will see I am not enough. I must leave first.",
        shadow: "Seduction & Abandonment",
        invitation: "To stay and witness the beauty that unfolds after the initial chase",
        attracts: "Partners who love the chase, reinforcing pattern of intense beginnings and abrupt endings",
        integratedForm: "Enchantress → Siren → Relational Fluent"
    },
    {
        id: "the_black_widow",
        name: "The Black Widow",
        coordinates: [0.8, 0.6, -0.8, -0.7],
        color: "#6A040F",
        size: 0.6,
        symbol: "🕷️",
        cluster: "seductive_avoidance_shadows",
        wound: "Uses sexuality as weapon",
        coreBelief: "Authentic connection is impossible, so I must use seduction and manipulation to get needs met.",
        shadow: "Manipulative Intimacy",
        invitation: "To discover the power of authentic, non-transactional connection",
        attracts: "Partners easily controlled by charm and sexuality, but ultimately disposable",
        integratedForm: "Black Widow → Sovereign"
    },
    {
        id: "the_trickster",
        name: "The Trickster",
        coordinates: [0.7, 0.8, 0.6, -0.6],
        color: "#F39C12",
        size: 0.7,
        symbol: "🃏",
        cluster: "seductive_avoidance_shadows",
        wound: "Uses humor and chaos to avoid authentic connection",
        coreBelief: "If I keep everything light and entertaining, no one will notice how terrified I am of real intimacy.",
        shadow: "Deflective Humor",
        invitation: "To trust that being authentic won't lead to rejection",
        attracts: "Partners who enjoy the entertainment but never know the real person",
        integratedForm: "Trickster → Creative Synthesis"
    },
    {
        id: "the_siren",
        name: "The Siren",
        coordinates: [0.85, 0.75, 0.5, -0.5],
        color: "#9A48D0",
        size: 0.75,
        symbol: "🧜‍♀️",
        cluster: "seductive_avoidance_shadows",
        wound: "Creates intense attraction but cannot sustain depth",
        coreBelief: "My power is in the mystery and the chase. If I let someone truly know me, the magic will disappear.",
        shadow: "Magnetic Superficiality",
        invitation: "To discover that true magic lives in sustained intimacy, not just initial attraction",
        attracts: "Partners addicted to the high of pursuit but unprepared for real relationship",
        integratedForm: "Siren → Embodied Wisdom"
    }
];

// --- SHADERS FOR QUANTUM SHELLS - ZEN THEME ---
const ANXIOUS_SHELL = { // Energetic, reaching
  vertex: `
    uniform float uTime; uniform float uAttachment; varying float vNoise;
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; } vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; } vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); } vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) { const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0); vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx); vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy); vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy; i = mod289(i); vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0)); float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx; vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_); vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw); vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0)); vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww; vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w); vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w; vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m; return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    void main() { float noise = snoise(position * 4.0 + uTime * 0.5); vNoise = noise; vec3 displacedPosition = position + normal * noise * 0.2 * uAttachment; gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0); }`,
  fragment: `
    uniform vec3 uColor; uniform float uAttachment; varying float vNoise;
    void main() { float intensity = smoothstep(-0.5, 1.0, vNoise) * 0.8 + 0.2; gl_FragColor = vec4(uColor * intensity, intensity * uAttachment * 0.7); }`
};
const AVOIDANT_SHELL = { // Smooth, absorptive
  vertex: `
    varying vec3 vNormal; varying vec3 vViewDirection;
    void main() { vec4 worldPosition = modelMatrix * vec4(position, 1.0); vNormal = normalize(normalMatrix * normal); vViewDirection = normalize(cameraPosition - worldPosition.xyz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragment: `
    uniform vec3 uColor; uniform float uAttachment; uniform float uTime; varying vec3 vNormal; varying vec3 vViewDirection;
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v) { const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439); vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx); vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); vec2 x1 = x0.xy + C.xx - i1; vec2 x2 = x0.xy + C.zz; i = mod(i, 289.0); vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)); vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0); m = m*m; m = m*m; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h); vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y); return 130.0 * dot(m, g); }
    void main() { float fresnel = 1.0 - dot(vNormal, vViewDirection); fresnel = pow(fresnel, 2.0); float shimmer = snoise(vNormal.xy * 5.0 + uTime * 0.3) * 0.2 + 0.8; float rim = smoothstep(0.5, 1.0, fresnel) * shimmer; float alpha = (rim * 0.2 + (1.0 - fresnel) * 0.1) * abs(uAttachment); gl_FragColor = vec4(uColor, alpha); }`
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
      
      vec3 inkColor = vec3(0.25, 0.22, 0.2); // Slightly softer ink color
      vec3 finalColor = mix(baseColor.rgb * parchment, inkColor, edge * 0.75); 
      
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


// --- INTELLIGENT RELATIONAL MAP ---
const RELATIONAL_MAP: { [key: string]: string[] } = {
  // Gift Archetypes (attract other integrated patterns)
  the_sovereign: ["the_relational_fluent", "the_embodied_wisdom", "the_creative_synthesis"],
  the_relational_fluent: ["the_sovereign", "the_embodied_wisdom", "the_creative_synthesis"],
  the_embodied_wisdom: ["the_sovereign", "the_relational_fluent", "the_creative_synthesis"],
  the_creative_synthesis: ["the_sovereign", "the_relational_fluent", "the_embodied_wisdom"],

  // --- Shadow Dynamics ---
  // Cluster 1: Control Shadows
  the_tyrant: ["the_rebel", "the_people_pleaser", "the_martyr"], // Attracts rebels and submissives ("Doormat")
  the_perfectionist: ["the_perfectionist", "the_tyrant", "the_people_pleaser", "the_anxious_intellectual"], // Attracts critics and people to "fix"
  the_guardian: ["the_sensitive_soul", "the_people_pleaser", "the_martyr"], // Attracts those who need rescuing
  the_sentinel: ["the_sensitive_soul", "the_martyr"], // Attracts those needing constant protection

  // Cluster 2: Emotional Storm Shadows
  the_tempest: ["the_ice_queen", "the_ghost", "the_analyst", "the_sensitive_soul"], // Provokes calm/avoidant, fuels anxious
  the_destroyer: ["the_enchantress", "the_ghost", "the_siren"], // Triggers abandonment wounds with avoidant types
  the_crusader: ["the_people_pleaser", "the_chameleon", "the_martyr"], // Attracts followers
  the_rebel: ["the_tyrant", "the_guardian", "the_perfectionist", "the_people_pleaser"], // Rebels against controllers, attracts followers

  // Cluster 3: Avoidant Intellectual Shadows
  the_ghost: ["the_people_pleaser", "the_sensitive_soul", "the_martyr"], // Chased by anxious partners
  the_ice_queen: ["the_tempest", "the_destroyer", "the_siren", "the_enchantress"], // Attracts passionate partners who try to "melt" them
  the_analyst: ["the_tempest", "the_sensitive_soul"], // Studies emotional partners
  the_anxious_intellectual: ["the_tempest", "the_analyst", "the_ice_queen"], // Attracts emotional partners to analyze or other intellectuals

  // Cluster 4: Anxious Connection Shadows
  the_martyr: ["the_tyrant", "the_black_widow", "the_destroyer"], // Exploited by takers/narcissists
  the_people_pleaser: ["the_tyrant", "the_crusader", "the_perfectionist"], // Attracts demanding partners
  the_sensitive_soul: ["the_tempest", "the_destroyer", "the_ice_queen", "the_guardian", "the_analyst"], // Absorbs chaos, tries to open up stoics
  the_chameleon: ["the_tyrant", "the_sovereign", "the_crusader"], // Attracts strong personalities

  // Cluster 5: Seductive Avoidance Shadows
  the_enchantress: ["the_rebel", "the_trickster", "the_crusader"], // Attracts partners who love the chase
  the_black_widow: ["the_people_pleaser", "the_martyr"], // Controls and disposes of partners
  the_trickster: ["the_people_pleaser", "the_chameleon", "the_sensitive_soul"], // Attracts an audience, not partners
  the_siren: ["the_rebel", "the_crusader", "the_tempest"], // Addicted to pursuit
};

function coordDistance(a: Archetype, b: Archetype): number {
  return Math.sqrt(a.coordinates.reduce((sum, coord, i) => sum + Math.pow(coord - b.coordinates[i], 2), 0));
}

export function buildDynamicRelationalIds(source: Archetype, archetypes: Archetype[], limit = 4): string[] {
  const staticIds = RELATIONAL_MAP[source.id] || [];
  const scored = archetypes
    .filter(a => a.id !== source.id)
    .map(a => ({
      id: a.id,
      score: coordDistance(source, a)
        - (a.cluster && source.cluster && a.cluster === source.cluster ? 0.75 : 0)
        - (a.cluster === 'gift_archetypes' ? 0.2 : 0),
    }))
    .sort((a, b) => a.score - b.score)
    .map(a => a.id);

  return Array.from(new Set([...staticIds, ...scored])).slice(0, limit);
}


@Injectable({ providedIn: 'root' })
export class VisualizationService {
  private translationService = inject(TranslationService);
  private ngZone = inject(NgZone);


  // --- PUBLIC STATE ---
  readonly allArchetypes = signal<Archetype[]>(ALL_ARCHETYPES);
  
  readonly dimensions = computed<Dimension[]>(() => {
    const lang = this.translationService.getLanguage(); // trigger reactivity
    return Object.entries(DIMENSIONS_DATA).map(([key, value]) => ({
      key,
      ...value,
      labels: {
        hypo: this.translationService.t(`${key.toLowerCase()}Hypo`, 'universe.dimensions'),
        hyper: this.translationService.t(`${key.toLowerCase()}Hyper`, 'universe.dimensions')
      }
    }));
  });

  readonly allClusters = computed(() => {
    const lang = this.translationService.getLanguage(); // trigger reactivity
    const clusters = new Set(this.allArchetypes().map(a => a.cluster).filter(Boolean) as string[]);
    return Array.from(clusters).map(id => ({
      id,
      name: this.translationService.t(id, 'universe.clusterNames')
    }));
  });
  
  readonly focusedArchetype = signal<Archetype | null>(null);
  readonly selectedArchetype = signal<Archetype | null>(null);
  readonly isolatedDimension = signal<string | null>(null);
  readonly personalConstellation = signal<{ archetypeId: string, percentage: number }[] | null>(null);
  
  // Comparison state
  readonly isComparing = signal(false);
  readonly firstComparisonArchetype = signal<Archetype | null>(null);

  readonly dimensionalExpressions = signal<DimensionalExpressions>({ AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 });
  readonly activeClusterFilters = signal<Set<string>>(new Set<string>());


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
  private frameTimes: number[] = [];
  private usePostProcessing = true;
  private frameCount = 0;
  readonly sceneReady = signal(false);

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
            (label as any).element.textContent = this.translationService.getArchetypeField(archetype.id, 'name', archetype.name);
          }
          // Update shader colors
          const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
          if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
            mesh.material.uniforms['uColor'].value.set(archetype.color);
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

    // Color based on cluster
    const auraColor = archetype.cluster === 'gift_archetypes' ? '#0072B2' : '#D55E00';

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
      opacity: 0.6,
      blending: THREE.NormalBlending,
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
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5x for 120fps target
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

      // Improve raycasting precision
      this.raycaster.params.Points.threshold = 0.5;
      this.raycaster.params.Line.threshold = 0.5;
      this.raycaster.params.Mesh = { threshold: 0.5 }; // Add threshold for meshes if needed (custom)


      // Post-Processing Setup
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const sketchyOutlinePass = new ShaderPass(SKETCHY_OUTLINE_SHADER);
      sketchyOutlinePass.uniforms['resolution'].value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
      this.composer.addPass(sketchyOutlinePass);


      this.scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
      dirLight.position.set(5, 10, 7.5);
      this.scene.add(dirLight);

      this.scene.add(this.relationalTethersGroup);
      this.scene.add(this.constellationLinesGroup);
      this.scene.add(this.gridGroups);

      this.createZenBackground();
      this.createEnvironmentProps(); // Add storybook environment
      this.createAxisGrids(isFirstVisit);
      this.createAxisLabels();
      this.createArchetypes(isFirstVisit);

      window.addEventListener('resize', this.onWindowResize);
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
      this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('keydown', this.onKeyDown);

      this.ngZone.runOutsideAngular(() => {
        this.animate();
      });

      if (isFirstVisit) {
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

  public destroy(): void {
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
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
      this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    clearTimeout(this.hoverDebounceTimeout);

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

    this.selectedArchetype.set(archetype);
    
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
    this.selectedArchetype.set(null);

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
      mesh.material.opacity = 0; // Handled by alpha blending in shader if needed
    }
    group.userData.isNew = true; // Flag for fade-in animation


    this.archetypeObjects.push(group);
    this.scene.add(group);
    this.allArchetypes.update(all => [...all, archetype]);
    this.selectedArchetype.set(archetype);

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
    this.isComparing.set(isComparing);
    this.firstComparisonArchetype.set(firstArchetype);
  }

  public updateClusterFilters(filters: Set<string>): void {
    if (filters.size !== 1) {
      this.cancelCameraAnimation();
    }

    this.activeClusterFilters.set(filters);
    this.updateConstellationLines(filters);
  }

  
  public updateDimensionalExpressions(expressions: DimensionalExpressions): void {
    this.dimensionalExpressions.set(expressions);
  }


  private cancelCameraAnimation(): void {
    gsap.killTweensOf(this.camera?.position);
    gsap.killTweensOf(this.controls?.target);
    if (this.controls) this.controls.enabled = true;
  }


  private createZenBackground(): void {
    const geometry = new THREE.SphereGeometry(500, 64, 64);

    // Storybook gradient with noise texture
    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }`;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      // Simple noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        float h = normalize(vWorldPosition + offset).y;
        vec3 gradientColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));

        // Add subtle noise texture
        float n = noise(vUv * 50.0 + uTime * 0.05) * 0.03;
        gradientColor += n;

        // Add atmospheric fog near horizon
        float fog = smoothstep(-0.1, 0.1, h) * smoothstep(0.3, 0.1, h);
        gradientColor = mix(gradientColor, vec3(0.9, 0.92, 0.95), fog * 0.3);

        gl_FragColor = vec4(gradientColor, 1.0);
      }`;

    const uniforms = {
      topColor: { value: new THREE.Color(0xa7c5d2) }, // --paper-viewport-top
      bottomColor: { value: new THREE.Color(0xeaddd0) }, // --paper-viewport-bot
      offset: { value: 0 },
      exponent: { value: 0.8 },
      uTime: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.BackSide
    });

    // Store reference for animation
    this.backgroundMaterial = material;
    this.scene.add(new THREE.Mesh(geometry, material));

    // Add floating dust particles
    this.createDustParticles();
  }

  private createAxisGrids(isAnimated = false): void {
    const size = 20;
    const divisions = 10; // Reduced divisions for cleaner look
    const opacity = 0.05; // Even more subtle opacity
    const gridColor = 0x4a3e35; // --ink-main for more paper-like feel

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

  private createSingleArchetypeObject(archetype: Archetype, isAnimated: boolean = false): THREE.Group {
    const group = new THREE.Group();

    // Create illustrated blob mesh (shared geometry for performance)
    const geometry = this.sharedSphereGeometry;
    // Attachment-tinted color: avoidant (coord[3] < 0) → cooler blue, anxious (coord[3] > 0) → warmer orange
    const attachmentVal = archetype.coordinates[3]; // -1 = avoidant, +1 = anxious
    const baseColor = new THREE.Color(archetype.color);
    if (attachmentVal < -0.15) {
      // Avoidant: blend toward a cool slate-blue
      const coolBlue = new THREE.Color('#7ecef4');
      const t = Math.min(Math.abs(attachmentVal), 1.0) * 0.45;
      baseColor.lerp(coolBlue, t);
    } else if (attachmentVal > 0.15) {
      // Anxious: blend toward a warm amber-orange
      const warmOrange = new THREE.Color('#f4a261');
      const t = Math.min(attachmentVal, 1.0) * 0.45;
      baseColor.lerp(warmOrange, t);
    }

    // Pre-calculate initial opacity to match what updateExplorationVisuals will set on first frame
    // This prevents the "vibrant → bleak" flash when entering the universe
    const isGift = archetype.cluster === 'gift_archetypes';
    const initialHighlight = isGift ? 0.5 : 0.0;
    const initialOpacity = 0.3 + initialHighlight * 0.7; // matches updateExplorationVisuals formula

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      transparent: true,
      opacity: initialOpacity,
      roughness: 0.3,
      metalness: 0.15,
      emissive: baseColor,
      emissiveIntensity: 0.15
    });

    const mesh = new THREE.Mesh(geometry, material);
    const baseScale = archetype.size * 0.8;
    mesh.scale.set(baseScale, baseScale, baseScale);
    mesh.name = 'blobMesh';
    group.add(mesh);

    // Add floating label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'archetype-label';
    labelDiv.textContent = this.translationService.getArchetypeField(archetype.id, 'name', archetype.name);
    labelDiv.style.color = '#4a3e35'; // --ink-main
    labelDiv.style.backgroundColor = 'rgba(253, 251, 246, 0.9)';
    labelDiv.style.backdropFilter = 'blur(8px)';
    labelDiv.style.border = '1px solid rgba(74, 62, 53, 0.15)';
    labelDiv.style.borderRadius = '12px';
    labelDiv.style.padding = '4px 12px';
    labelDiv.style.fontFamily = "'Fraunces', serif";
    labelDiv.style.fontSize = '14px';
    labelDiv.style.fontWeight = '700';
    labelDiv.style.pointerEvents = 'none'; // CRITICAL: Ensure labels don't block clicks
    labelDiv.style.userSelect = 'none';
    labelDiv.style.boxShadow = '0 4px 12px rgba(74, 62, 53, 0.12)';
    labelDiv.style.whiteSpace = 'nowrap';
    labelDiv.style.opacity = '0';
    labelDiv.style.transform = 'translateY(-10px) scale(0.9)';
    labelDiv.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

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
      label
    };

    // Create aura
    const aura = this.createIllustratedAura(archetype);
    aura.name = 'assessmentAura';
    aura.visible = false;
    group.add(aura);
    group.userData.aura = aura;

    const isSovereign = archetype.id === "the_sovereign";
    // isGift is already declared above

    if (isAnimated && !isSovereign) {
      group.position.set(isGift ? 0 : (Math.random() - 0.5) * 5, isGift ? 0 : (Math.random() - 0.5) * 5, isGift ? 0 : (Math.random() - 0.5) * 5);
      material.opacity = 0;
    } else {
      group.position.copy(targetPosition);
    }

    return group;
  }
  
  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    try {
      const frameStart = performance.now();
      this.timer.update(frameStart);
      const delta = this.timer.getDelta();
      const elapsedTime = this.timer.getElapsed();
      this.frameCount++;

      // Mark scene ready after enough frames have been rendered to GPU
      // (shaders compiled, textures uploaded, post-processing stable)
      if (this.frameCount === 60 && !this.sceneReady()) {
        this.sceneReady.set(true);
      }

      if (this.animationState.running) this.updateGenesisAnimation(delta);

      // Cinematic look-at target (subtle drift)
      if (this.selectedArchetype()) {
        const archetype = this.selectedArchetype();
        const obj = this.archetypeObjects.find(o => o.userData.archetype.id === archetype?.id);
        if (obj) {
          const target = obj.position.clone().add(this.archetypeFocusOffset);
          this.controls.target.lerp(target, 0.03);
        }
      }


      this.controls.update();
      this.updateCreationEffects();
      this.updateArchetypeVisuals(elapsedTime);
      this.updateAxisLabels();
      this.updateTetherAnimation();

      // Adaptive post-processing: disable Sobel if FPS drops
      if (this.usePostProcessing && this.composer.passes.length > 1) {
        this.composer.passes[1].uniforms['uTime'].value = elapsedTime;
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      this.labelRenderer.render(this.scene, this.camera);

      // FPS monitoring (check every 60 frames)
      const frameEnd = performance.now();
      this.frameTimes.push(frameEnd - frameStart);
      if (this.frameTimes.length > 60) this.frameTimes.shift();
      if (this.frameCount % 60 === 0 && this.frameTimes.length >= 30) {
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        // avgFrameTime is just the JS work time, not total frame budget
        // Use delta as a proxy for actual frame time
        if (delta > 0.018 && this.usePostProcessing) { // > 18ms = below 55fps
          this.usePostProcessing = false;
        }
      }


    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  private updateGenesisAnimation(delta: number): void {
    this.animationState.progress = Math.min(this.animationState.progress + delta / this.animationState.duration, 1);
    const eased = 1 - Math.pow(1 - this.animationState.progress, 3);

    // Animate grid groups
    this.gridGroups.children.forEach(g => {
      const group = g as THREE.Group;
      group.children.forEach((child: THREE.Object3D) => {
        if (child instanceof THREE.Line) {
          (child.material as THREE.Material).opacity = eased * 0.15;
        }
      });
      g.scale.set(eased, eased, eased);
    });

    // Animate archetype meshes
    this.archetypeObjects.forEach(group => {
      const isSovereign = group.userData.archetype.id === "the_sovereign";
      if (!isSovereign) {
        group.position.lerp(group.userData.targetPosition, eased * 0.1);

        const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
          // Fade in logic if shader supports it
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

  private updateArchetypeVisuals(elapsedTime: number): void {
    if (this.animationState.running) return;
    const personalConstellation = this.personalConstellation();

    if (personalConstellation) {
        this.updatePersonalConstellationVisuals(elapsedTime, personalConstellation);
    } else {
        this.updateExplorationVisuals(elapsedTime);
    }
    
    // Global time update for all shaders
    this.archetypeObjects.forEach(group => {
      const mesh = group.getObjectByName('blobMesh') as THREE.Mesh;
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms['uTime'].value = elapsedTime;
        mesh.material.uniforms['uJiggle'].value = group.userData.jiggle || 0;
      }
    });
  }

  private updateExplorationVisuals(elapsedTime: number): void {
    let totalExpressionMag = 0;
    Object.values(this.dimensionalExpressions()).forEach(v => totalExpressionMag += Math.abs(v));


    this.archetypeObjects.forEach(group => {
      const archetype = group.userData.archetype as Archetype;
      const mesh = group.userData.mesh as THREE.Mesh;
      const shadow = group.userData.shadow as THREE.Sprite;
      const label = group.userData.label as CSS2DObject;
      const aura = group.userData.aura as THREE.Group;

      if (!mesh) return;

      const mat = mesh.material as THREE.ShaderMaterial;
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
        highlightScore = (archetype.cluster === 'gift_archetypes') ? 0.5 : 0.0;
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

      // Apply opacity to MeshPhysicalMaterial (lerp for smooth transition)
      const physMat = mat as unknown as THREE.MeshPhysicalMaterial;
      if (physMat.opacity !== undefined) {
        physMat.opacity += (targetOpacity - physMat.opacity) * 0.06;
      }

      // Idle bob animation (interpolated to targetPosition)
      const bobOffset = Math.sin(elapsedTime * 0.8 + group.userData.bobOffset) * 0.1;
      const baseScale = group.userData.baseScale;

      // Apply scale with hover effect
      const targetS = baseScale * hoverScale;
      mesh.scale.lerp(this.vec3_3.set(targetS, targetS, targetS), 0.1);

      // Bob the mesh vertically
      group.position.y = group.userData.targetPosition.y + bobOffset;

      // Update shadow position and opacity
      if (shadow) {
        const shadowMat = shadow.material as THREE.SpriteMaterial;
        shadowMat.opacity = targetOpacity * 0.3;
        shadow.position.y = -baseScale / 2 - 0.2 + bobOffset * 0.5;
      }

      // Update position
      if (this.isolatedDimension()) {
        this.applyIsolation(group, this.isolatedDimension()!);
      } else {
        group.position.x += (group.userData.targetPosition.x - group.position.x) * 0.06;
        group.position.z += (group.userData.targetPosition.z - group.position.z) * 0.06;
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

  private updatePersonalConstellationVisuals(elapsedTime: number, constellation: { archetypeId: string, percentage: number }[]): void {
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

        const mat = mesh.material as THREE.ShaderMaterial;
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
        mesh.scale.lerp(this.vec3_3.set(finalScale, finalScale, finalScale), 0.1);

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
            const auraColor = archetype.cluster === 'gift_archetypes' ? '#0072B2' : '#D55E00';
            auraMat.color.set(auraColor);
            auraMat.opacity = 0.4 + pulse * 0.5;
            const auraScale = finalScale * 2.2 + pulse * 0.3;
            auraSprite.scale.set(auraScale, auraScale, 1);
            auraSprite.rotation.z += 0.015;
          }
        }

        group.position.x += (group.userData.targetPosition.x - group.position.x) * 0.05;
        group.position.z += (group.userData.targetPosition.z - group.position.z) * 0.05;
      }
    });
  }

  private applyIsolation(group: THREE.Group, isolation: string): void {
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
      group.position.lerp(target, 0.05);
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

        // Hand-drawn dashed line material
        const material = new THREE.LineDashedMaterial({
          color: 0x4a3e35, // --ink-main
          linewidth: 1.5,
          dashSize: 0.3,
          gapSize: 0.2,
          transparent: true,
          opacity: 0.4,
          scale: 1
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        this.relationalTethersGroup.add(line);
        this.tetherMaterials.push(material);
      } else {
        console.warn(`[Relational Map] Could not find target archetype with id: '${targetId}' for source: '${tetherSource.name}'`);

      }
    });
  }
  
  private updateTetherAnimation(): void {
    const elapsedTime = this.timer.getElapsed();
    const pulse = (Math.sin(elapsedTime * 3) + 1) / 2;

    this.tetherMaterials.forEach(material => {
      // Flowing dash effect
      material.dashOffset -= 0.02;

      // Subtle pulse for visibility
      material.opacity = 0.3 + pulse * 0.2;
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
          color: 0xc2b7ad, // --ink-light
          linewidth: 1,
          dashSize: 0.2,
          gapSize: 0.15,
          transparent: true,
          opacity: 0.5
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

    if (this.composer.passes[1]) {
      this.composer.passes[1].uniforms['resolution'].value.set(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
      );
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    // Check if the click is on the canvas or an element that should allow pass-through
    const target = e.target as HTMLElement;
    if (target !== this.renderer.domElement && !target.classList.contains('archetype-label') && !target.classList.contains('focus-tag')) {
      return;
    }
    this.isPointerDown = true;
    this.isDragging = false;
    this.pointerDownPosition.set(e.clientX, e.clientY);
  }

  private onPointerMove = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    const isCanvasOrLabel = target === this.renderer.domElement || target.classList.contains('archetype-label') || target.classList.contains('focus-tag');
    
    if (this.isPointerDown && !this.isDragging) {
      if (this.pointerDownPosition.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > this.dragThreshold) {
        this.isDragging = true;
        this.focusedArchetype.set(null);
      }
    }
    if (e.pointerType === 'mouse' && !this.isDragging && isCanvasOrLabel) {
      clearTimeout(this.hoverDebounceTimeout);
      this.hoverDebounceTimeout = setTimeout(() => {
          this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
          this.focusedArchetype.set(this.checkIntersection());
      }, 50);
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    const isCanvasOrLabel = target === this.renderer.domElement || target.classList.contains('archetype-label') || target.classList.contains('focus-tag');

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
                  this.focusedArchetype.set(null);
              } else {
                  this.focusedArchetype.set(intersected);
                  if(!this.isComparing()) this.selectedArchetype.set(null); 
              }
          } else {
              this.focusedArchetype.set(null);
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
                this.focusedArchetype.set(null);
            }
            break;
        case 'Escape':
            e.preventDefault();
            if (this.selectedArchetype()) {
                this.selectedArchetype.set(null);
            } else if (this.firstComparisonArchetype()) {
                // Handled in component
            } else if (this.focusedArchetype()) {
                this.focusedArchetype.set(null);
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
            this.focusedArchetype.set(screenPositions[0].obj.userData.archetype);
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
        this.focusedArchetype.set(bestCandidate.obj.userData.archetype);
        const targetObj = bestCandidate.obj;
        if (targetObj) {
            this.controls.target.lerp(targetObj.position, 0.4);
        }
    }
  }
}
