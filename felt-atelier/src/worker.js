// Background sewing: geometry + randomizer off the main thread so the render loop never hitches.
import { process } from './core.js';
self.onmessage = (e) => {
  const { id } = e.data;
  try { const { out, transfer } = process(e.data); out.id = id; self.postMessage(out, transfer); }
  catch (err) { self.postMessage({ id, ok: false, error: String((err && err.message) || err) }); }
};
