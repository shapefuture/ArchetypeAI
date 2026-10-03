import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Fast structural checks for the rules' most important authorization gates.
 * Runtime behavior is covered separately by firestore.rules.emulator.spec.ts.
 */
const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');

function matchBlock(pattern: RegExp): string {
  const match = rules.match(pattern);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

describe('firestore.rules — security boundaries', () => {
  it('requires a verified email and bootstrap/allowlist membership for admin status', () => {
    const admin = matchBlock(/function\s+isAdmin\s*\(\)\s*\{([\s\S]*?)\n\s*\}/);
    expect(admin).toMatch(/hasVerifiedEmail\(\)/);
    expect(admin).toMatch(/adminAllowlist/);
    expect(admin).toMatch(/wmobilas@gmail\.com/);
  });

  it('gates every adminClients operation on isAdmin and validates the relationship identity', () => {
    const block = matchBlock(/match\s+\/adminClients\/\{docId\}\s*\{([\s\S]*?)\n\s*\}/);
    const readRule = block.match(/allow\s+read:\s*if[\s\S]*?;/)?.[0] ?? '';
    expect(readRule).toMatch(/isAdmin\(\)[\s\S]*?resource\.data\.adminUid\s*==\s*request\.auth\.uid/);
    expect(readRule).not.toMatch(/docId/);
    expect(block).toMatch(/allow\s+create:\s*if\s+isAdmin\(\)/);
    expect(block).toMatch(/allow\s+update:\s*if\s+isAdmin\(\)/);
    expect(block).toMatch(/allow\s+delete:\s*if\s+isAdmin\(\)/);
    expect(block).toMatch(/request\.resource\.data\.adminUid\s*==\s*request\.auth\.uid/);
    expect(block).toMatch(/docId\s*==\s*request\.resource\.data\.adminUid\s*\+\s*'_'/);
  });

  it('requires an admin link or a valid therapist booking share for cross-user records', () => {
    const data = matchBlock(/match\s+\/assessment\/\{docId\}\s*\{([\s\S]*?)\n\s*\}/);
    const history = matchBlock(/match\s+\/history\/\{docId\}\s*\{([\s\S]*?)\n\s*\}/);
    for (const block of [data, history]) {
      expect(block).toMatch(/isOwner\(userId\)\s*\|\|\s*hasAdminReadGrant\(userId\)\s*\|\|\s*hasTherapistReadGrant\(userId\)/);
      expect(block).toMatch(/allow\s+write:\s*if\s+isOwner\(userId\)/);
    }
    expect(rules).toMatch(/function\s+hasActiveAppointment\s*\(/);
    expect(rules).toMatch(/function\s+hasValidBookingShare\s*\(/);
  });

  it('requires authentication for telemetry and binds push tokens to a UID', () => {
    const telemetry = matchBlock(/match\s+\/telemetryResponses\/\{docId\}\s*\{([\s\S]*?)\n\s*\}/);
    const push = matchBlock(/match\s+\/pushTokens\/\{token\}\s*\{([\s\S]*?)\n\s*\}/);
    expect(telemetry).toMatch(/allow\s+create:\s*if\s+isSignedIn\(\)/);
    expect(push).toMatch(/request\.resource\.data\.uid\s*==\s*request\.auth\.uid/);
    expect(push).toMatch(/allow\s+read:\s*if\s+false/);
  });

  it('allows signed-in directory reads but limits public-profile changes to the owner', () => {
    const profile = matchBlock(/match\s+\/publicProfiles\/\{userId\}\s*\{([\s\S]*?)\n\s*\}/);
    expect(profile).toMatch(/allow\s+read:\s*if\s+isSignedIn\(\)/);
    expect(profile).toMatch(/allow\s+create,\s*update:\s*if\s+isOwner\(userId\)/);
    expect(profile).toMatch(/allow\s+delete:\s*if\s+isOwner\(userId\)/);
  });

  it('prevents collection enumeration of bearer share and therapist invite codes', () => {
    const shareCodes = matchBlock(/match\s+\/shareCodes\/\{code\}\s*\{([\s\S]*?)\n\s*\}/);
    const therapistLinks = matchBlock(/match\s+\/therapistLinks\/\{code\}\s*\{([\s\S]*?)\n\s*\}/);
    expect(shareCodes).toMatch(/allow\s+get:\s*if\s+isSignedIn\(\)/);
    expect(shareCodes).toMatch(/allow\s+list:\s*if\s+false/);
    expect(shareCodes).toMatch(/validShareCodePayload\(request\.resource\.data\)/);
    expect(rules).toMatch(/function\s+validShareCodePayload\s*\(/);
    expect(therapistLinks).toMatch(/allow\s+get:\s*if\s+isSignedIn\(\)/);
    expect(therapistLinks).toMatch(/allow\s+list:\s*if\s+false/);
  });

  it('uses a minimal public busy-slot projection as a booking collision guard', () => {
    const slots = matchBlock(/match\s+\/therapistBusySlots\/\{id\}\s*\{([\s\S]*?)\n\s*\}/);
    expect(slots).toMatch(/allow\s+read:\s*if\s+isSignedIn\(\)/);
    expect(slots).toMatch(/request\.resource\.data\.keys\(\)\.hasOnly\(\['therapistUid', 'appointmentId', 'start', 'end'\]\)/);
    expect(slots).toMatch(/existsAfter\([\s\S]*?appointments/);
    expect(slots).toMatch(/allow\s+update:\s*if\s+false/);
    const appointments = matchBlock(/match\s+\/appointments\/\{id\}\s*\{([\s\S]*?)\n\s*\}/);
    expect(appointments).toMatch(/hasMatchingBusySlotAfter\(/);
  });

  it('checks appointment/client-share data before adding a therapist roster row', () => {
    const shares = matchBlock(/match\s+\/clientShares\/\{docId\}\s*\{([\s\S]*?)\n\s*\}/);
    const roster = matchBlock(/match\s+\/therapistClients\/\{docId\}\s*\{([\s\S]*?)\n\s*\}/);
    expect(shares).toMatch(/hasActiveAppointment\(/);
    expect(roster).toMatch(/hasValidBookingShare\(/);
    expect(roster).toMatch(/hasValidInviteLink\(/);
  });
});
