// Grants or revokes the `admin` custom claim for one Firebase Auth user.
// Firestore rules and the app check this claim. Run from a trusted machine.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
//     node scripts/admin/set-admin-claim.mjs <email> [--revoke]
//
// The service account key must stay outside the repo. The user must sign out
// and back in (or wait for the ID token to refresh, up to an hour) before the
// new claim applies.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, flag] = process.argv.slice(2);
if (!email || (flag && flag !== '--revoke')) {
  console.error('Usage: node scripts/admin/set-admin-claim.mjs <email> [--revoke]');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...user.customClaims };
if (flag === '--revoke') {
  delete claims.admin;
} else {
  claims.admin = true;
}
await auth.setCustomUserClaims(user.uid, claims);
console.log(`${flag === '--revoke' ? 'Revoked' : 'Granted'} admin claim for ${email} (uid ${user.uid}).`);
