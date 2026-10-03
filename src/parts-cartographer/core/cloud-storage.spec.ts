import { beforeEach, describe, expect, it, vi } from 'vitest';
const firestore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), runTransaction: vi.fn() }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ collection, id }),
  runTransaction: firestore.runTransaction, collection: vi.fn(), deleteDoc: vi.fn(), getDoc: vi.fn(),
  getDocs: vi.fn(), limit: vi.fn(), orderBy: vi.fn(), query: vi.fn(), writeBatch: vi.fn(),
}));
import { createCloudLegacy64ShareCode } from './cloud-storage';

beforeEach(() => {
  vi.clearAllMocks();
  firestore.runTransaction.mockImplementation(async (_db, callback) => callback({ get: firestore.get, set: firestore.set }));
});
describe('explicit legacy share-code interoperability', () => {
  it('retries a collision without overwriting the other owner and writes the Angular payload', async () => {
    firestore.get.mockResolvedValueOnce({ exists: () => true }).mockResolvedValueOnce({ exists: () => false });
    const responses = Array(64).fill(3);
    const code = await createCloudLegacy64ShareCode('owner', responses);
    expect(code).toMatch(/^[a-z0-9]{12}$/);
    expect(firestore.runTransaction).toHaveBeenCalledTimes(2);
    expect(firestore.set).toHaveBeenCalledTimes(1);
    expect(firestore.set).toHaveBeenCalledWith({ collection: 'shareCodes', id: code }, {
      uid: 'owner', createdAt: expect.any(String), assessment: {
        responses, dimensionalExpressions: {}, results: null, scoringMethod: 'deterministic', updatedAt: expect.any(String),
      },
    });
  });
  it('rejects incomplete or out-of-range responses before any Firestore operation', async () => {
    await expect(createCloudLegacy64ShareCode('owner', Array(63).fill(3))).rejects.toThrow();
    await expect(createCloudLegacy64ShareCode('owner', Array(64).fill(6))).rejects.toThrow();
    expect(firestore.runTransaction).not.toHaveBeenCalled();
  });
});
