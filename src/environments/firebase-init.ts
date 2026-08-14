import { initializeApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { environment } from './environment';

let app: FirebaseApp;
let db: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(environment.firebase);
  }
  return app;
}

/**
 * Returns the Firestore instance for the ArchetypeAI Firebase project.
 *
 * `experimentalAutoDetectLongPolling: true` makes the SDK transparently fall
 * back to long-polling when the streaming WebChannel transport fails (e.g.
 * Chrome's `ERR_QUIC_PROTOCOL_ERROR.QUIC_NETWORK_IDLE_TIMEOUT` after the
 * Firestore keep-alive stream idles for ~30s behind a corporate firewall or
 * a chatty network path). Without this, the SDK only logs the QUIC error to
 * the console and retries the streaming connection — the user sees noise but
 * reads/writes still succeed.
 *
 * `getApps()` guards against double-init when this is called from multiple
 * modules (storage adapter + admin service) during the same boot.
 */
export function getFirestoreDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), {
      experimentalAutoDetectLongPolling: true,
    });
  }
  return db;
}
