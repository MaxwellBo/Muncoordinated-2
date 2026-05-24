/**
 * Reusable helpers for backfilling missing Realtime Database fields from default values.
 * Add a new manifest in scripts/migrations/ and run scripts/backfill-missing-fields.ts.
 */

export type FieldSpec = {
  /** Property name on the target object */
  field: string;
  /** Value written when the property is absent */
  defaultValue: unknown;
};

export type CollectionSpec = {
  /** Child map under each committee, e.g. "caucuses". Omit for committee root fields. */
  collectionKey?: string;
  fields: FieldSpec[];
};

export type BackfillManifest = {
  id: string;
  description: string;
  collections: CollectionSpec[];
};

export type PendingUpdate = {
  path: string;
  value: unknown;
};

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

function collectForObject(
  basePath: string,
  data: Record<string, unknown>,
  fields: FieldSpec[],
): PendingUpdate[] {
  const updates: PendingUpdate[] = [];

  for (const { field, defaultValue } of fields) {
    if (isMissing(data[field])) {
      updates.push({
        path: `${basePath}/${field}`,
        value: defaultValue,
      });
    }
  }

  return updates;
}

/**
 * Walk committees and return Firebase multi-path update entries (path -> value).
 */
export function planBackfill(
  committees: Record<string, Record<string, unknown>> | null | undefined,
  manifest: BackfillManifest,
): PendingUpdate[] {
  const updates: PendingUpdate[] = [];

  if (!committees) {
    return updates;
  }

  for (const [committeeId, committee] of Object.entries(committees)) {
    if (!committee || typeof committee !== 'object') {
      continue;
    }

    const committeeBase = `committees/${committeeId}`;

    for (const collection of manifest.collections) {
      if (!collection.collectionKey) {
        updates.push(
          ...collectForObject(committeeBase, committee, collection.fields),
        );
        continue;
      }

      const children = committee[collection.collectionKey];
      if (!children || typeof children !== 'object') {
        continue;
      }

      for (const [childId, child] of Object.entries(children)) {
        if (!child || typeof child !== 'object') {
          continue;
        }

        updates.push(
          ...collectForObject(
            `${committeeBase}/${collection.collectionKey}/${childId}`,
            child as Record<string, unknown>,
            collection.fields,
          ),
        );
      }
    }
  }

  return updates;
}

export function updatesToPatch(updates: PendingUpdate[]): Record<string, unknown> {
  return Object.fromEntries(updates.map(({ path, value }) => [path, value]));
}

export function summarizeUpdates(updates: PendingUpdate[]): string {
  const byField = new Map<string, number>();

  for (const { path } of updates) {
    const field = path.split('/').pop() ?? path;
    byField.set(field, (byField.get(field) ?? 0) + 1);
  }

  const lines = [...byField.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([field, count]) => `  ${field}: ${count}`);

  return [`${updates.length} path(s) to write:`, ...lines].join('\n');
}

/** Firebase RTDB multi-path update limit */
export const MAX_PATHS_PER_UPDATE = 500;

export function chunkUpdates(updates: PendingUpdate[]): PendingUpdate[][] {
  const chunks: PendingUpdate[][] = [];

  for (let i = 0; i < updates.length; i += MAX_PATHS_PER_UPDATE) {
    chunks.push(updates.slice(i, i + MAX_PATHS_PER_UPDATE));
  }

  return chunks;
}
