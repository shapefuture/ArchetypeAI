type MotionPreference = Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>;

export function bindReducedMotionDamping(
  controls: { enableDamping: boolean },
  preference?: MotionPreference,
): () => void {
  const syncPreference = () => {
    controls.enableDamping = !preference?.matches;
  };

  syncPreference();
  preference?.addEventListener('change', syncPreference);

  return () => preference?.removeEventListener('change', syncPreference);
}
