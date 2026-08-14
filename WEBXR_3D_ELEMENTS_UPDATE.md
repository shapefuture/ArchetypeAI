# WebXR Service 3D Elements Storybook Update

This document contains the complete updated code for transforming 3D scene elements in `webxr.service.ts` to match the storybook aesthetic.

## Overview of Elements to Update

- **E1**: Background Sphere (Sky Gradient) - Line ~1216
- **E2**: Axis Grids (3D Reference Planes) - Line ~1293
- **E3**: Axis Labels (Floating 3D Labels) - Line ~1360
- **E4**: Archetype "Stress Orbs" (Attachment Shells) - Line ~1390
- **E5**: Relational Tethers (Connection Lines) - Line ~1377
- **E6**: Assessment Aura (Torus Ring) - Line ~1054
- **E7**: Creation Particle Burst - Line ~764

---

## E1: Background Sphere (Sky Gradient)

**Location**: `createZenBackground()` method (line ~1216)

**Current**: Generic blue/cream gradient
**Target**: Storybook atmospheric gradient with paper texture, noise, floating dust motes, atmospheric fog

```typescript
/**
 * E1: Background Sphere (Sky Gradient)
 * Storybook atmospheric gradient with paper texture, noise, and floating dust motes
 */
private createZenBackground(): void {
  const geometry = new THREE.SphereGeometry(500, 64, 64);

  // Enhanced storybook gradient with noise texture and atmospheric fog
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

    // Enhanced noise function for paper texture
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

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      float h = normalize(vWorldPosition + offset).y;

      // Smooth gradient with storybook colors
      vec3 gradientColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));

      // Enhanced paper texture noise
      float paperNoise = fbm(vUv * 80.0 + uTime * 0.02) * 0.04;
      float fineNoise = noise(vUv * 150.0) * 0.02;
      gradientColor += paperNoise + fineNoise;

      // Atmospheric fog near horizon (storybook depth effect)
      float fog = smoothstep(-0.15, 0.15, h) * smoothstep(0.35, 0.1, h);
      vec3 fogColor = vec3(0.95, 0.96, 0.98);
      gradientColor = mix(gradientColor, fogColor, fog * 0.4);

      // Subtle warm glow at horizon
      float horizonGlow = exp(-abs(h) * 3.0) * 0.15;
      gradientColor += vec3(1.0, 0.95, 0.9) * horizonGlow;

      gl_FragColor = vec4(gradientColor, 1.0);
    }`;

  const uniforms = {
    topColor: { value: new THREE.Color(0xa7c5d2) }, // --paper-viewport-top
    bottomColor: { value: new THREE.Color(0xeaddd0) }, // --paper-viewport-bot
    offset: { value: 0 },
    exponent: { value: 0.6 }, // Slightly softer gradient
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

  // Add floating dust particles with enhanced storybook feel
  this.createDustParticles();
}
```

**Key Changes**:
- Added fractal Brownian motion (fbm) for richer paper texture
- Enhanced noise with multiple frequencies for depth
- Added warm horizon glow for storybook atmosphere
- Softer gradient exponent (0.6 vs 0.8)
- Improved atmospheric fog effect

---

## E2: Axis Grids (3D Reference Planes)

**Location**: `createAxisGrids()` method (line ~1293)

**Current**: Brown GridHelper, very technical
**Target**: Hand-drawn grid lines, storybook style with dashed strokes

```typescript
/**
 * E2: Axis Grids (3D Reference Planes)
 * Hand-drawn grid lines with storybook style
 */
private createAxisGrids(isAnimated = false): void {
  const size = 20;
  const divisions = 20;
  const opacity = 0.15;
  const gridColor = 0xc2b7ad; // --ink-light

  const gridsInfo = [
    { key: 'AGENCY_FOCUS', color: gridColor, rotation: new THREE.Euler(Math.PI / 2, 0, 0) },
    { key: 'AGENCY_TEMPERATURE', color: gridColor, rotation: new THREE.Euler(0, 0, 0) },
    { key: 'TEMPERATURE_FOCUS', color: gridColor, rotation: new THREE.Euler(0, 0, Math.PI / 2) }
  ];

  gridsInfo.forEach(info => {
    // Create hand-drawn style grid using dashed line segments
    const gridGroup = new THREE.Group();
    gridGroup.userData.key = info.key;

    const step = size / divisions;
    const halfSize = size / 2;

    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;

      // Add slight randomness for hand-drawn feel
      const jitter = () => (Math.random() - 0.5) * 0.08;

      // Horizontal lines with dashed stroke
      const hPoints = [
        new THREE.Vector3(-halfSize + jitter(), 0, pos + jitter()),
        new THREE.Vector3(halfSize + jitter(), 0, pos + jitter())
      ];
      const hGeometry = new THREE.BufferGeometry().setFromPoints(hPoints);
      const hMaterial = new THREE.LineDashedMaterial({
        color: info.color,
        transparent: true,
        opacity: opacity * (i % 2 === 0 ? 1.0 : 0.5), // Alternate opacity
        dashSize: 0.3,
        gapSize: 0.2,
        scale: 1
      });
      const hLine = new THREE.Line(hGeometry, hMaterial);
      hLine.computeLineDistances(); // Required for dashed lines
      gridGroup.add(hLine);

      // Vertical lines with dashed stroke
      const vPoints = [
        new THREE.Vector3(pos + jitter(), 0, -halfSize + jitter()),
        new THREE.Vector3(pos + jitter(), 0, halfSize + jitter())
      ];
      const vGeometry = new THREE.BufferGeometry().setFromPoints(vPoints);
      const vMaterial = new THREE.LineDashedMaterial({
        color: info.color,
        transparent: true,
        opacity: opacity * (i % 2 === 0 ? 1.0 : 0.5),
        dashSize: 0.3,
        gapSize: 0.2,
        scale: 1
      });
      const vLine = new THREE.Line(vGeometry, vMaterial);
      vLine.computeLineDistances();
      gridGroup.add(vLine);
    }

    gridGroup.rotation.copy(info.rotation);

    if (isAnimated) {
      gridGroup.scale.set(0.01, 0.01, 0.01);
      // Add gentle pulse animation data
      gridGroup.userData.pulsePhase = 0;
      gridGroup.userData.isPulsing = true;
    }

    this.gridGroups.add(gridGroup);
  });
}
```

**Key Changes**:
- Replaced `LineBasicMaterial` with `LineDashedMaterial` for hand-drawn effect
- Added `computeLineDistances()` for proper dashed line rendering
- Increased jitter for more organic, hand-drawn feel
- Dashed stroke pattern (dashSize: 0.3, gapSize: 0.2) matches story.txt connection lines
- Added pulse animation capability for initial view

---

## E3: Axis Labels (Floating 3D Labels)

**Location**: `createAxisLabels()` method (line ~1360)

**Current**: CSS2DObject with Tailwind classes
**Target**: Storybook floating tag labels with enhanced styling

```typescript
/**
 * E3: Axis Labels (Floating 3D Labels)
 * Storybook floating tag labels with enhanced styling
 */
private createAxisLabels(): void {
  Object.entries(this.labelsInfo).forEach(([key, l]) => {
    const div = document.createElement('div');
    div.className = 'focus-tag';
    div.textContent = this.translationService.t(l.key, 'universe.dimensions');
    div.style.color = '#4a3e35'; // --ink-main

    // Storybook floating tag style (from spec)
    div.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    div.style.backdropFilter = 'blur(4px)';
    div.style.border = '1px solid rgba(0, 0, 0, 0.05)';
    div.style.borderRadius = '8px';
    div.style.padding = '4px 10px';
    div.style.fontFamily = "'Nunito', sans-serif";
    div.style.fontSize = '14px';
    div.style.fontWeight = '600';
    div.style.pointerEvents = 'none';
    div.style.boxShadow = '0 2px 8px rgba(74, 62, 53, 0.1)';
    div.style.whiteSpace = 'nowrap';
    div.style.transition = 'opacity 0.3s, transform 0.3s';

    // Optional: Add small icon per dimension
    const icons: { [key: string]: string } = {
      'active': '🍃',
      'receptive': '🪄',
      'hot': '🔥',
      'cool': '❄️',
      'self': '👤',
      'other': '👥'
    };

    if (icons[key]) {
      const iconSpan = document.createElement('span');
      iconSpan.textContent = icons[key];
      iconSpan.style.marginRight = '4px';
      iconSpan.style.fontSize = '12px';
      div.prepend(iconSpan);
    }

    const label = new CSS2DObject(div);
    label.position.copy(l.pos);

    this.axisLabels[key] = label;
    this.scene.add(label);
  });
}
```

**Key Changes**:
- Already matches most of the storybook spec
- Added emoji icons for each dimension for visual clarity
- Enhanced backdrop blur for better readability
- Smooth transitions for opacity and transform
- Proper Nunito font with 600 weight

---

## E4: Archetype "Stress Orbs" (Attachment Shells)

**Location**: `createSingleArchetypeObject()` method (line ~1390)

**Current**: ShaderMaterial sphere (pink/purple)
**Target**: Illustrated attachment aura with orbiting blobs (anxious) or expanding rings (avoidant)

**Add this new method to the service**:

```typescript
/**
 * E4: Create illustrated attachment aura
 * ANXIOUS ATTACHMENT (positive values): Multiple orbiting small blobs
 * AVOIDANT ATTACHMENT (negative values): Expanding rings/barrier
 */
private createAttachmentAura(archetype: Archetype): THREE.Group {
  const auraGroup = new THREE.Group();
  const [x, y, z, attachment] = archetype.coordinates;

  if (attachment > 0.3) {
    // ANXIOUS ATTACHMENT: Orbiting "worry blobs"
    const blobCount = 5;
    const blobColor = new THREE.Color(0xf4a261); // Warm pink/coral

    for (let i = 0; i < blobCount; i++) {
      const blobCanvas = document.createElement('canvas');
      blobCanvas.width = 64;
      blobCanvas.height = 64;
      const ctx = blobCanvas.getContext('2d')!;

      // Draw small irregular blob
      ctx.fillStyle = `rgba(244, 162, 97, 0.8)`;
      ctx.strokeStyle = '#4a3e35';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const centerX = 32;
      const centerY = 32;
      const baseRadius = 12;

      for (let angle = 0; angle <= Math.PI * 2; angle += 0.3) {
        const variance = Math.sin(angle * 4) * 3 + Math.cos(angle * 2) * 2;
        const radius = baseRadius + variance;
        const bx = centerX + Math.cos(angle) * radius;
        const by = centerY + Math.sin(angle) * radius;

        if (angle === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const blobTexture = new THREE.CanvasTexture(blobCanvas);
      const blobMaterial = new THREE.SpriteMaterial({
        map: blobTexture,
        transparent: true,
        depthWrite: false
      });

      const blob = new THREE.Sprite(blobMaterial);
      const orbitRadius = 2.5 + (i * 0.3);
      const orbitSpeed = 1.5 + (i * 0.2);
      const startAngle = (i / blobCount) * Math.PI * 2;

      blob.scale.set(0.8, 0.8, 1);
      blob.userData = {
        orbitRadius,
        orbitSpeed,
        angle: startAngle,
        baseY: 0
      };

      auraGroup.add(blob);
    }

    auraGroup.userData.attachmentType = 'anxious';

  } else if (attachment < -0.3) {
    // AVOIDANT ATTACHMENT: Expanding protective rings
    const ringCount = 3;
    const ringColor = new THREE.Color(0xb4a5d4); // Cool lavender/purple

    for (let i = 0; i < ringCount; i++) {
      const ringCanvas = document.createElement('canvas');
      ringCanvas.width = 256;
      ringCanvas.height = 256;
      const ctx = ringCanvas.getContext('2d')!;

      const centerX = 128;
      const centerY = 128;
      const baseRadius = 80 + (i * 25);

      // Draw sketchy circle
      ctx.strokeStyle = `rgba(180, 165, 212, ${0.6 - i * 0.15})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 12]); // Dashed line for hand-drawn effect

      ctx.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.15) {
        const variance = Math.sin(angle * 6) * 4;
        const r = baseRadius + variance;
        const rx = centerX + Math.cos(angle) * r;
        const ry = centerY + Math.sin(angle) * r;

        if (angle === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();

      const ringTexture = new THREE.CanvasTexture(ringCanvas);
      const ringMaterial = new THREE.SpriteMaterial({
        map: ringTexture,
        transparent: true,
        depthWrite: false
      });

      const ring = new THREE.Sprite(ringMaterial);
      ring.scale.set(3.5 + i * 0.8, 3.5 + i * 0.8, 1);
      ring.userData = {
        expandSpeed: 0.3 + (i * 0.1),
        maxScale: 4.0 + (i * 0.5),
        baseScale: 3.5 + (i * 0.8),
        phase: i * 0.5
      };

      auraGroup.add(ring);
    }

    auraGroup.userData.attachmentType = 'avoidant';
  }

  return auraGroup;
}

/**
 * Update attachment aura animations (call this in animate loop)
 */
private updateAttachmentAura(auraGroup: THREE.Group, elapsedTime: number): void {
  if (auraGroup.userData.attachmentType === 'anxious') {
    // Quick, nervous orbiting for anxious attachment
    auraGroup.children.forEach((blob, i) => {
      const data = blob.userData;
      data.angle += data.orbitSpeed * 0.02;

      const x = Math.cos(data.angle) * data.orbitRadius;
      const z = Math.sin(data.angle) * data.orbitRadius;
      const y = Math.sin(elapsedTime * 3 + i) * 0.3; // Bobbing motion

      blob.position.set(x, y, z);
    });
  } else if (auraGroup.userData.attachmentType === 'avoidant') {
    // Slow, protective expansion for avoidant attachment
    auraGroup.children.forEach((ring) => {
      const data = ring.userData;
      const scale = data.baseScale + Math.sin(elapsedTime * data.expandSpeed + data.phase) * 0.5;
      ring.scale.set(scale, scale, 1);
    });
  }
}
```

**Integration**: Add this to `createSingleArchetypeObject()`:

```typescript
// In createSingleArchetypeObject() after line 1087 (after shadow creation)
// Handle attachment auras
const [x, y, z, attachment] = archetype.coordinates;
if (Math.abs(attachment) > 0.3) {
  const attachmentAura = this.createAttachmentAura(archetype);
  attachmentAura.name = 'attachmentAura';
  attachmentAura.visible = false; // Hidden by default
  group.add(attachmentAura);
}
```

---

## E5: Relational Tethers (Connection Lines)

**Location**: `updateTetherAnimation()` method (line ~1377)

**Current**: Lines connecting related archetypes
**Target**: Hand-drawn dashed curves with flowing dash effect

```typescript
/**
 * E5: Update relational tethers with hand-drawn dashed curves
 */
private updateTetherAnimation(): void {
  const elapsedTime = this.clock.getElapsedTime();
  const pulse = (Math.sin(elapsedTime * 2) + 1) / 2;

  this.tetherMaterials.forEach(material => {
    // Flowing dash effect
    material.dashOffset -= 0.02; // Slower, more gentle flow

    // Subtle breathing opacity
    material.opacity = 0.4 + pulse * 0.2;

    // Orange glow when archetype is selected
    const selectedArchetype = this.selectedArchetype();
    if (selectedArchetype && material.userData.isConnectedToSelected) {
      material.color.setHex(0xf4a261); // Orange
      material.opacity = 0.8;
    } else {
      material.color.setHex(0x4a3e35); // --ink-main
    }
  });
}
```

**Also update the tether creation in the initialization** (find where tethers are created and update):

```typescript
// In tether creation code (around line 1350)
const material = new THREE.LineDashedMaterial({
  color: 0x4a3e35, // --ink-main
  transparent: true,
  opacity: 0.4,
  dashSize: 0.15,   // Smaller dashes for hand-drawn look
  gapSize: 0.25,    // Larger gaps
  scale: 1
});

this.tetherMaterials.push(material);
```

**Key Changes**:
- Changed to `LineDashedMaterial` for hand-drawn effect
- Dashed stroke pattern (dashSize: 0.15, gapSize: 0.25) matches story.txt
- Flowing dash animation (slower, more gentle)
- Orange glow when archetype is selected
- Subtle breathing opacity for organic feel

---

## E6: Assessment Aura (Torus Ring)

**Location**: `createIllustratedAura()` method (line ~690)

**Current**: TorusGeometry with white glow
**Target**: Illustrated "spotlight" effect with hand-drawn circle and sparkles

```typescript
/**
 * E6: Create illustrated assessment aura (spotlight effect)
 * Replaces TorusGeometry with sprite-based hand-drawn ring
 */
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
  const auraColor = archetype.cluster === 'gift_archetypes' ? '#70a1d7' : '#f4a261';

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
    ctx.stroke();
  }

  // Add small "sparkles" around ring
  const sparkleCount = 8;
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (i / sparkleCount) * Math.PI * 2;
    const sparkleRadius = baseRadius + 15;
    const sx = centerX + Math.cos(angle) * sparkleRadius;
    const sy = centerY + Math.sin(angle) * sparkleRadius;

    // Draw sparkle (small star)
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle glow
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
    gradient.addColorStop(0, auraColor + '40'); // 25% opacity
    gradient.addColorStop(1, auraColor + '00'); // 0% opacity
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4, 4, 1);
  sprite.name = 'auraRing';

  auraGroup.add(sprite);

  // Store animation data
  auraGroup.userData = {
    baseScale: 4,
    rotationSpeed: 0.01,
    pulseSpeed: 2,
    pulseAmount: 0.1
  };

  return auraGroup;
}

/**
 * Update aura animations (call this in animate loop)
 */
private updateAuraAnimation(auraGroup: THREE.Group, elapsedTime: number): void {
  const ring = auraGroup.children.find(c => c.name === 'auraRing') as THREE.Sprite;
  if (!ring) return;

  const data = auraGroup.userData;

  // Pulse animation
  const pulse = Math.sin(elapsedTime * data.pulseSpeed) * data.pulseAmount;
  const scale = data.baseScale + pulse;
  ring.scale.set(scale, scale, 1);

  // Subtle rotation (for visual interest)
  // Note: Sprites always face camera, so we animate material instead
  const material = ring.material as THREE.SpriteMaterial;
  material.opacity = 0.6 + pulse * 2;
}
```

**Key Changes**:
- Replaced TorusGeometry with hand-drawn sprite-based ring
- Multiple sketchy circles for hand-drawn aesthetic
- Added sparkle effects around the ring
- Color based on cluster (gift = blue, shadow = red/orange)
- Pulse + subtle opacity animation
- Much more storybook-like appearance

---

## E7: Creation Particle Burst (When AI Creates Archetype)

**Location**: `addArchetype()` method (line ~764)

**Current**: PointsMaterial sphere expansion
**Target**: Storybook "poof" effect with stars/magic sprites

```typescript
/**
 * E7: Enhanced creation particle burst with storybook "poof" effect
 */
public addArchetype(archetype: Archetype): void {
    if (this.allArchetypes().some(a => a.id === archetype.id)) {
        return;
    }

    const group = this.createSingleArchetypeObject(archetype);
    const mesh = group.children[0] as THREE.Mesh;
    (mesh.material as THREE.MeshStandardMaterial).opacity = 0;
    group.userData.isNew = true; // Flag for fade-in animation

    this.archetypeObjects.push(group);
    this.scene.add(group);
    this.allArchetypes.update(all => [...all, archetype]);

    // Storybook "poof" effect with illustrated sprites
    this.createCreationBurst(archetype);
}

/**
 * Create illustrated creation burst effect
 */
private createCreationBurst(archetype: Archetype): void {
  const burstGroup = new THREE.Group();
  const particleCount = 30; // Fewer, more detailed particles

  // Create illustrated sprite shapes: stars, sparkles, small blobs
  const shapes = ['star', 'sparkle', 'blob'];

  for (let i = 0; i < particleCount; i++) {
    const shape = shapes[i % shapes.length];
    const sprite = this.createMagicSprite(shape, archetype.color);

    // Random starting position
    const r = Math.random() * 0.3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );

    // Store animation data
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3
    );

    sprite.userData = {
      velocity,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      baseScale: 0.5 + Math.random() * 0.5,
      life: 0
    };

    burstGroup.add(sprite);
  }

  burstGroup.position.copy(
    this.archetypeObjects[this.archetypeObjects.length - 1].userData.targetPosition
  );

  this.scene.add(burstGroup);
  this.activeCreationEffects.push({
    group: burstGroup,
    startTime: this.clock.getElapsedTime(),
    duration: 2.0,
  });
}

/**
 * Create individual magic sprite for burst effect
 */
private createMagicSprite(shape: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const centerX = 32;
  const centerY = 32;

  if (shape === 'star') {
    // Draw star shape
    ctx.fillStyle = color;
    ctx.strokeStyle = '#4a3e35';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;

      const outerX = centerX + Math.cos(outerAngle) * 20;
      const outerY = centerY + Math.sin(outerAngle) * 20;
      const innerX = centerX + Math.cos(innerAngle) * 8;
      const innerY = centerY + Math.sin(innerAngle) * 8;

      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (shape === 'sparkle') {
    // Draw sparkle (cross shape)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(centerX + 15, centerY);
    ctx.moveTo(centerX, centerY - 15);
    ctx.lineTo(centerX, centerY + 15);
    ctx.stroke();

    // Add glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();

  } else { // blob
    // Draw small blob
    ctx.fillStyle = color;
    ctx.strokeStyle = '#4a3e35';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let angle = 0; angle <= Math.PI * 2; angle += 0.4) {
      const variance = Math.sin(angle * 3) * 4;
      const r = 12 + variance;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (angle === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.8, 1);

  return sprite;
}

/**
 * Update creation burst effects (replace existing updateCreationEffects)
 */
private updateCreationEffects(): void {
  const elapsedTime = this.clock.getElapsedTime();

  for (let i = this.activeCreationEffects.length - 1; i >= 0; i--) {
    const effect = this.activeCreationEffects[i];
    const progress = (elapsedTime - effect.startTime) / effect.duration;

    if (progress >= 1.0) {
      this.scene.remove(effect.group);
      effect.group.children.forEach(child => {
        if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      });
      this.activeCreationEffects.splice(i, 1);
    } else {
      // Animate burst particles
      effect.group.children.forEach(child => {
        if (child instanceof THREE.Sprite) {
          const data = child.userData;

          // Move outward
          child.position.add(data.velocity.clone().multiplyScalar(0.02));

          // Slow down over time
          data.velocity.multiplyScalar(0.98);

          // Rotate
          child.material.rotation += data.rotationSpeed;

          // Scale with burst then fade
          const burstScale = Math.sin(progress * Math.PI) * 1.5;
          child.scale.setScalar(data.baseScale + burstScale);

          // Fade out
          child.material.opacity = 1 - Math.pow(progress, 2);
        }
      });
    }
  }
}
```

**Key Changes**:
- Replaced simple points with illustrated sprites (stars, sparkles, blobs)
- Each sprite is hand-drawn on canvas
- Burst outward with magic trail effect
- Shapes match archetype color
- 2-second duration with smooth fade-out
- More storybook-like "poof" appearance

---

## Implementation Notes

1. **For sprite-based elements**, all use `CanvasTexture` with procedural SVG-like drawing
2. **For hand-drawn effects**, use `LineDashedMaterial` with `dashOffset` animation
3. **For orbiting blobs**, create small sprite objects that orbit the center
4. **For expanding rings**, create sprite rings with scale animation
5. **All animations** are integrated into the main `animate()` loop

---

## Animation Loop Integration

Add these calls to the main `animate()` method (around line 1118):

```typescript
private animate = (): void => {
  if (!this.renderer || !this.scene || !this.camera) return;
  this.animationFrameId = requestAnimationFrame(this.animate);

  try {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.animationState.running) this.updateGenesisAnimation(delta);

    // ... existing code ...

    // Update attachment auras
    this.archetypeObjects.forEach(group => {
      const attachmentAura = group.children.find(c => c.name === 'attachmentAura');
      if (attachmentAura && attachmentAura instanceof THREE.Group) {
        this.updateAttachmentAura(attachmentAura, elapsedTime);
      }

      const auraGroup = group.children.find(c => c.name === 'assessmentAura');
      if (auraGroup && auraGroup instanceof THREE.Group) {
        this.updateAuraAnimation(auraGroup, elapsedTime);
      }
    });

    this.shellMaterials.forEach(m => m.uniforms.uTime.value = elapsedTime);
    this.controls.update();
    this.updateCreationEffects();
    this.updateArchetypeVisuals(elapsedTime);
    this.updateAxisLabels();
    this.updateTetherAnimation();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  } catch (error) {
    console.error('Error in animation loop:', error);
  }
};
```

---

## Summary

All 7 elements have been transformed to match the storybook aesthetic:

1. **E1 - Background**: Enhanced gradient with fbm noise, paper texture, atmospheric fog, and warm horizon glow
2. **E2 - Axis Grids**: Hand-drawn dashed lines with jitter for organic feel
3. **E3 - Axis Labels**: Storybook floating tags with emojis and enhanced styling
4. **E4 - Attachment Orbs**: Illustrated orbiting blobs (anxious) or expanding rings (avoidant)
5. **E5 - Tethers**: Hand-drawn dashed curves with flowing animation and orange glow on selection
6. **E6 - Assessment Aura**: Hand-drawn ring with sparkles and pulse animation
7. **E7 - Creation Burst**: Illustrated star/sparkle/blob sprites with magic trail effect

All elements now feel hand-crafted and storybook-like, matching the design language from `style.txt` and `story.txt`.
