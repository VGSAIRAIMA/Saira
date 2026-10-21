/**
 * deleteAccount.test.ts
 *
 * Tests for the "Delete my data" flow.
 * All Firebase calls are mocked — no real Firestore, Auth, or FCM involved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAccount } from '@/lib/deleteAccount';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

// ── Firebase mocks ─────────────────────────────────────────────────────────

vi.mock('firebase/firestore', () => {
  const batch = {
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  const mockGetDocs = vi.fn();

  return {
    collection: vi.fn((_db: unknown, path: string) => ({ _path: path })),
    getDocs: mockGetDocs,
    writeBatch: vi.fn(() => batch),
  };
});

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function (this: unknown) {
    return {};
  }),
  reauthenticateWithPopup: vi.fn().mockResolvedValue(undefined),
}));

// FCM token deletion is lazy-imported inside deleteAccount; mock the module
vi.mock('@/lib/fcm', () => ({
  deleteFcmToken: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(uid: string): User {
  return {
    uid,
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as User;
}

function makeFakeDb(): Firestore {
  return {} as Firestore;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getDocs for all 7 sub-collections', async () => {
    const { getDocs } = await import('firebase/firestore');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;

    // All collections return empty snapshots immediately
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const user = makeUser('alice');
    await deleteAccount({ db: makeFakeDb(), user });

    // 7 sub-collections: progress, custom, days, weeks, favorites, devices, meta
    expect(mockGetDocs).toHaveBeenCalledTimes(7);
  });

  it('deletes documents in batches when collection has docs', async () => {
    const { getDocs, writeBatch } = await import('firebase/firestore');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;

    // First call returns 3 docs; subsequent calls return empty (so loop exits)
    const fakeDocs = [
      { ref: { id: 'doc1' } },
      { ref: { id: 'doc2' } },
      { ref: { id: 'doc3' } },
    ];
    let callCount = 0;
    mockGetDocs.mockImplementation(() => {
      callCount++;
      // First call to this collection returns docs; second returns empty
      return Promise.resolve(
        callCount === 1 ? { empty: false, docs: fakeDocs } : { empty: true, docs: [] }
      );
    });

    const user = makeUser('alice');
    await deleteAccount({ db: makeFakeDb(), user });

    // writeBatch is a vi.fn() — the batch object it returns has .delete and .commit
    const mockWriteBatch = vi.mocked(writeBatch);
    // It must have been called at least once
    expect(mockWriteBatch).toHaveBeenCalled();
    // The returned batch must have had commit called
    const returnedBatch = mockWriteBatch.mock.results[0]?.value as { delete: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> };
    expect(returnedBatch.commit).toHaveBeenCalled();
  });

  it('re-authenticates before deleting the auth user', async () => {
    const { getDocs } = await import('firebase/firestore');
    const { reauthenticateWithPopup } = await import('firebase/auth');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const user = makeUser('alice');
    await deleteAccount({ db: makeFakeDb(), user });

    expect(reauthenticateWithPopup).toHaveBeenCalledWith(user, expect.anything());
    expect(user.delete).toHaveBeenCalled();
  });

  it('deletes the Auth user after Firestore data is gone', async () => {
    const { getDocs } = await import('firebase/firestore');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const user = makeUser('bob');
    await deleteAccount({ db: makeFakeDb(), user });

    expect(user.delete).toHaveBeenCalledTimes(1);
  });

  it('calls onProgress callback with running deletion count', async () => {
    const { getDocs } = await import('firebase/firestore');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;

    const fakeDocs = [{ ref: { id: 'doc1' } }, { ref: { id: 'doc2' } }];
    let called = 0;
    mockGetDocs.mockImplementation(() => {
      called++;
      return Promise.resolve(called === 1 ? { empty: false, docs: fakeDocs } : { empty: true, docs: [] });
    });

    const user = makeUser('alice');
    const progressCalls: number[] = [];
    await deleteAccount({
      db: makeFakeDb(),
      user,
      onProgress: (n) => progressCalls.push(n),
    });

    // At least one progress call with a positive number
    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls[0]).toBeGreaterThan(0);
  });

  it('continues even if FCM token deletion fails (best-effort)', async () => {
    const { getDocs } = await import('firebase/firestore');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const { deleteFcmToken } = await import('@/lib/fcm');
    (deleteFcmToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('FCM error'));

    const user = makeUser('alice');
    // Should NOT throw even if FCM deletion fails
    await expect(deleteAccount({ db: makeFakeDb(), user })).resolves.toBeUndefined();
    expect(user.delete).toHaveBeenCalled();
  });

  it('throws if re-authentication is cancelled', async () => {
    const { getDocs } = await import('firebase/firestore');
    const { reauthenticateWithPopup } = await import('firebase/auth');
    const mockGetDocs = getDocs as ReturnType<typeof vi.fn>;
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    (reauthenticateWithPopup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('auth/popup-closed-by-user')
    );

    const user = makeUser('alice');
    await expect(deleteAccount({ db: makeFakeDb(), user })).rejects.toThrow(
      'auth/popup-closed-by-user'
    );
    // Auth user should NOT be deleted if re-auth failed
    expect(user.delete).not.toHaveBeenCalled();
  });
});
