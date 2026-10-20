import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const isEmulatorRunning = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_EMULATOR_HUB
);

describe.skipIf(!isEmulatorRunning)('Firestore Security Rules (Emulator Suite)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rulesPath = resolve(process.cwd(), 'firestore.rules');
    const rulesContent = readFileSync(rulesPath, 'utf8');

    // Parse host and port if set
    let host = '127.0.0.1';
    let port = 8080;
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      const parts = process.env.FIRESTORE_EMULATOR_HOST.split(':');
      host = parts[0] || '127.0.0.1';
      port = parseInt(parts[1] || '8080', 10);
    }

    testEnv = await initializeTestEnvironment({
      projectId: 'saira-rules-test',
      firestore: {
        rules: rulesContent,
        host,
        port,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  it('allows authenticated owner to read and write their own progress', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const docRef = doc(aliceContext.firestore(), 'users/alice/progress/p0-t0-s0');

    await assertSucceeds(
      setDoc(docRef, {
        status: 'done',
        updatedAt: new Date().toISOString(),
      })
    );

    const snap = await assertSucceeds(getDoc(docRef));
    expect(snap.exists()).toBe(true);
  });

  it('forbids another user from reading or writing alice progress', async () => {
    // Alice creates her doc first using admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice/progress/p0-t0-s0'), {
        status: 'done',
        updatedAt: new Date().toISOString(),
      });
    });

    const bobContext = testEnv.authenticatedContext('bob');
    const docRef = doc(bobContext.firestore(), 'users/alice/progress/p0-t0-s0');

    // Bob cannot read
    await assertFails(getDoc(docRef));

    // Bob cannot write
    await assertFails(
      setDoc(docRef, {
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it('forbids unauthenticated access completely', async () => {
    const anonContext = testEnv.unauthenticatedContext();
    const docRef = doc(anonContext.firestore(), 'users/alice/progress/p0-t0-s0');

    await assertFails(getDoc(docRef));
    await assertFails(
      setDoc(docRef, {
        status: 'done',
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it('rejects progress with invalid status', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const docRef = doc(aliceContext.firestore(), 'users/alice/progress/p0-t0-s0');

    await assertFails(
      setDoc(docRef, {
        status: 'invalid_status',
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it('rejects oversized notes (> 20,000 chars) but allows valid notes', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const docRef = doc(aliceContext.firestore(), 'users/alice/progress/p0-t0-s0');

    // Valid note (500 chars)
    await assertSucceeds(
      setDoc(docRef, {
        status: 'in_progress',
        notes: 'A'.repeat(500),
        updatedAt: new Date().toISOString(),
      })
    );

    // Oversized note (20,001 chars)
    await assertFails(
      setDoc(docRef, {
        status: 'in_progress',
        notes: 'A'.repeat(20001),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it('rejects oversized keyIdea (> 500 chars) and oversized mistakes (> 2,000 chars)', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const docRef = doc(aliceContext.firestore(), 'users/alice/progress/p0-t0-s0');

    // Oversized keyIdea (501 chars)
    await assertFails(
      setDoc(docRef, {
        status: 'in_progress',
        keyIdea: 'K'.repeat(501),
        updatedAt: new Date().toISOString(),
      })
    );

    // Oversized mistakes (2,001 chars)
    await assertFails(
      setDoc(docRef, {
        status: 'in_progress',
        mistakes: 'M'.repeat(2001),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it('allows owner to manage days, custom, and meta/settings collections', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const firestore = aliceContext.firestore();

    await assertSucceeds(
      setDoc(doc(firestore, 'users/alice/days/2026-10-20'), {
        completed: 3,
        minutes: 45,
      })
    );

    await assertSucceeds(
      setDoc(doc(firestore, 'users/alice/custom/u-123'), {
        title: 'Two Pointers Practice',
      })
    );

    await assertSucceeds(
      setDoc(doc(firestore, 'users/alice/meta/settings'), {
        hiddenIds: ['item-1', 'item-2'],
      })
    );

    // Bob cannot write to Alice's collections
    const bobContext = testEnv.authenticatedContext('bob');
    await assertFails(
      setDoc(doc(bobContext.firestore(), 'users/alice/days/2026-10-20'), {
        completed: 10,
      })
    );
  });

  it('allows atomic batch write of progress and dayLog on item tick', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const firestore = aliceContext.firestore();
    const batch = writeBatch(firestore);

    const progressRef = doc(firestore, 'users/alice/progress/p0-t0-s0');
    const dayLogRef = doc(firestore, 'users/alice/days/2026-10-20');

    batch.set(progressRef, {
      status: 'done',
      lastTouchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      revision: {
        step: 0,
        dueDayKey: '2026-10-21',
      },
    });

    batch.set(dayLogRef, {
      dayKey: '2026-10-20',
      completed: 1,
      revised: 0,
      minutes: 0,
    });

    await assertSucceeds(batch.commit());

    // Bob cannot batch write to Alice's progress and days
    const bobContext = testEnv.authenticatedContext('bob');
    const bobFirestore = bobContext.firestore();
    const bobBatch = writeBatch(bobFirestore);
    bobBatch.set(doc(bobFirestore, 'users/alice/progress/p0-t0-s0'), {
      status: 'done',
      updatedAt: new Date().toISOString(),
    });
    bobBatch.set(doc(bobFirestore, 'users/alice/days/2026-10-20'), {
      dayKey: '2026-10-20',
      completed: 5,
    });
    await assertFails(bobBatch.commit());
  });

  it('safely handles null values for optional text fields (notes, keyIdea, mistakes)', async () => {
    const aliceContext = testEnv.authenticatedContext('alice');
    const docRef = doc(aliceContext.firestore(), 'users/alice/progress/p0-t0-s1');

    await assertSucceeds(
      setDoc(docRef, {
        status: 'in_progress',
        notes: null,
        keyIdea: null,
        mistakes: null,
        updatedAt: new Date().toISOString(),
      })
    );
  });
});
