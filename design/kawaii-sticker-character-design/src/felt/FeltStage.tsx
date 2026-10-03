import { useEffect, useRef, useState } from 'react';
import { FeltSticker } from './FeltSticker';
import { THREE, flatExtent, makeGroup, sewAsync, setupStage, toneSafeBackground, type Dna, type Lod, type Sewn } from './engine';

export type FeltStageProps = {
  dna: Dna;
  lod?: Lod;
  className?: string;
  /** slow turntable so you can see it is a real object from every side */
  spin?: boolean;
  background?: string;
};

function disposeTree(root: THREE.Object3D) {
  root.traverse((o: any) => {
    if (o.isMesh) o.geometry?.dispose?.();
  });
}

/**
 * The 3D half of a part: the same DNA as the flat sticker, sewn into real geometry — two cut pieces inflated
 * into stuffed domes, blanket-stitched at the rim, felt eyes and patches standing off the surface — lit live
 * in the page. If WebGL is unavailable it falls back to the flat sticker rather than an empty box.
 */
export function FeltStage({ dna, lod = 'hero', className = '', spin = true, background = '#fdfaf3' }: FeltStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const [sewn, setSewn] = useState<Sewn | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => sewAsync(dna, lod, setSewn), [dna, lod]);

  useEffect(() => {
    const el = host.current;
    if (!sewn || !el || failed) return;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let onResize: (() => void) | null = null;
    let ro: ResizeObserver | null = null;
    let yaw = 0.3;
    try {
      const w = el.clientWidth || 260, h = el.clientHeight || 260;
      const stage = setupStage(el, w, h, { dpr: Math.min(2, window.devicePixelRatio || 1) });
      renderer = stage.renderer as unknown as THREE.WebGLRenderer;
      scene = stage.scene;
      camera = stage.camera as THREE.PerspectiveCamera;
      if (scene) scene.background = toneSafeBackground(background, (renderer as any).toneMappingExposure ?? 1);

      const pivot = new THREE.Group();
      const group = makeGroup(sewn.parts, sewn.size);
      const { cx, cy, w: fw, h: fh } = flatExtent(sewn.flat);
      group.position.set(-cx * sewn.size, -cy * sewn.size, 0);
      pivot.add(group);
      scene?.add(pivot);

      const aspect = camera?.aspect || 1;
      const dist = Math.max(2.4, fh * sewn.size * 2.6, (fw * sewn.size * 2.25) / aspect);
      camera?.position.set(0, 0, dist);
      camera?.lookAt(0, 0, 0);

      onResize = () => {
        if (!renderer || !camera || !el.clientWidth) return;
        renderer.setSize(el.clientWidth, el.clientHeight);
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
      };
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => onResize?.()); ro.observe(el); }

      const t0 = performance.now();
      const loop = () => {
        const t = (performance.now() - t0) / 1000;
        if (spin) yaw += 0.0042;
        pivot.rotation.set(-0.08, yaw + Math.sin(t * 0.6) * 0.03, 0);
        renderer?.render(scene as THREE.Scene, camera as THREE.PerspectiveCamera);
        raf = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setFailed(true); // no WebGL here: show the flat sticker instead of nothing
    }
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      if (scene) disposeTree(scene);
      renderer?.dispose();
      const canvas = el.querySelector('canvas');
      if (canvas) canvas.remove();
    };
  }, [sewn, background, spin, failed]);

  if (failed) {
    // No WebGL on this device: show the same part as its flat sticker rather than an empty box.
    return (
      <span data-felt-fallback="no-webgl" style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
        <FeltSticker dna={dna} lod={lod} className={className} />
      </span>
    );
  }

  return (
    <div
      ref={host}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 120, background, overflow: 'hidden' }}
      data-felt="3d"
      data-sewn={sewn ? 'yes' : 'sewing'}
    />
  );
}

export default FeltStage;
