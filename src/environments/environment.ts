export const environment = {
  /** AI provider router (Cloudflare Worker; dev uses the local proxy). */
  aiApiUrl: '/api/ai',
  /** §3.8 Web Push: register the matching private key in Firebase Console →
   *  Cloud Messaging → Web Push certificates. Public key only, client-side. */
  vapidPublicKey: 'BNYK0YZFP3PukxpjhpLTie-DF22URLEeFM9TKxc0jt4wq5rsOItICLG_lbZHv9qhI1QSWMM_Wqbj7AAEyiXmbZI',
  /** Anonymous telemetry sink (§4 step 10): Firestore `telemetryResponses`. */
  telemetryToCloud: true,
  production: false,
  firebase: {
    apiKey: "AIzaSyD1idTHp-16XiDFRCXIPjkjHQti6HjfpCw",
    authDomain: "archetype-ai-3e43b.firebaseapp.com",
    projectId: "archetype-ai-3e43b",
    storageBucket: "archetype-ai-3e43b.firebasestorage.app",
    messagingSenderId: "871167128636",
    appId: "1:871167128636:web:634825dc90dc14f1ebbf39"
  },
};
