#!/usr/bin/env node
/**
 * Backfill missing Realtime Database fields using app DEFAULT_* values.
 *
 * Usage:
 *   yarn migrate:backfill -- --dry-run              # production, read-only
 *   yarn migrate:backfill -- --manifest required-optional-fields
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json yarn migrate:backfill
 *   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 yarn migrate:backfill
 *
 * Requires firebase-admin credentials for writes (service account or ADC).
 * Dry-run can fetch committees via public read when credentials are absent.
 */

import admin from 'firebase-admin';
import {
  chunkUpdates,
  planBackfill,
  summarizeUpdates,
  updatesToPatch,
  type BackfillManifest,
  type PendingUpdate,
} from './lib/field-backfill.ts';
import { REQUIRED_OPTIONAL_FIELDS } from './migrations/required-optional-fields.ts';

const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ?? 'https://muncoordinated.firebaseio.com';

const MANIFESTS: Record<string, BackfillManifest> = {
  'required-optional-fields': REQUIRED_OPTIONAL_FIELDS,
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const manifestFlag = argv.indexOf('--manifest');
  const manifestId =
    manifestFlag >= 0 ? argv[manifestFlag + 1] : 'required-optional-fields';

  if (!manifestId || manifestId.startsWith('--')) {
    throw new Error('Pass --manifest <id> (see scripts/migrations/).');
  }

  return { dryRun, manifestId };
}

async function fetchCommitteesPublic(): Promise<Record<string, Record<string, unknown>>> {
  const response = await fetch(`${DATABASE_URL}/committees.json`);

  if (!response.ok) {
    throw new Error(`GET committees failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) ?? {};
}

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    databaseURL: DATABASE_URL,
    credential: admin.credential.applicationDefault(),
  });
}

async function loadCommittees(): Promise<Record<string, Record<string, unknown>>> {
  return fetchCommitteesPublic();
}

async function assertCanWrite(): Promise<void> {
  const app = initAdmin();
  try {
    await app.options.credential?.getAccessToken();
  } catch {
    throw new Error(
      'Writes require credentials. Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON with Realtime Database admin access, then re-run without --dry-run.',
    );
  }
}

async function applyUpdates(updates: PendingUpdate[]): Promise<void> {
  initAdmin();
  const db = admin.database().ref();
  const chunks = chunkUpdates(updates);

  for (let i = 0; i < chunks.length; i++) {
    const patch = updatesToPatch(chunks[i]);
    await db.update(patch);
    console.log(`Applied chunk ${i + 1}/${chunks.length} (${Object.keys(patch).length} paths).`);
  }
}

async function main() {
  const { dryRun, manifestId } = parseArgs(process.argv.slice(2));
  const manifest = MANIFESTS[manifestId];

  if (!manifest) {
    throw new Error(
      `Unknown manifest "${manifestId}". Available: ${Object.keys(MANIFESTS).join(', ')}`,
    );
  }

  console.log(`Manifest: ${manifest.id}`);
  console.log(manifest.description);
  console.log(`Database: ${DATABASE_URL}`);
  console.log(dryRun ? 'Mode: dry-run' : 'Mode: apply');

  const committees = await loadCommittees();
  const committeeCount = Object.keys(committees).length;
  console.log(`Loaded ${committeeCount} committee(s).`);

  const updates = planBackfill(committees, manifest);
  console.log(summarizeUpdates(updates));

  if (updates.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  if (dryRun) {
    console.log('Dry-run complete (no writes).');
    return;
  }

  await assertCanWrite();
  await applyUpdates(updates);
  console.log('Backfill complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
