let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.08,
  slide?: number,
) {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export const sfx = {
  boing() {
    tone(180, 0.28, "sine", 0.1, 520);
    setTimeout(() => tone(320, 0.16, "triangle", 0.05, 140), 70);
  },
  click() {
    tone(720, 0.05, "triangle", 0.05);
  },
  tick() {
    tone(480 + Math.random() * 240, 0.04, "square", 0.03);
  },
  pop() {
    tone(420, 0.12, "sine", 0.08, 880);
  },
  womp() {
    tone(240, 0.45, "sawtooth", 0.06, 70);
    setTimeout(() => tone(180, 0.5, "triangle", 0.05, 55), 90);
  },
};
