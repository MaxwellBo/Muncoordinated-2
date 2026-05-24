import { DEFAULT_COMMITTEE } from '../../src/models/committee.ts';
import { DEFAULT_CAUCUS } from '../../src/models/caucus.ts';
import { DEFAULT_RESOLUTION } from '../../src/models/resolution.ts';
import type { BackfillManifest } from '../lib/field-backfill.ts';

/**
 * Fields marked `// TODO: Migrate` in model types — optional in old RTDB rows,
 * always present on new writes via DEFAULT_* objects.
 */
export const REQUIRED_OPTIONAL_FIELDS: BackfillManifest = {
  id: 'required-optional-fields',
  description:
    'Backfill committee.conference, caucus speaker/queue fields, and resolution voting metadata.',
  collections: [
    {
      fields: [{ field: 'conference', defaultValue: DEFAULT_COMMITTEE.conference }],
    },
    {
      collectionKey: 'caucuses',
      fields: [
        { field: 'speakerDuration', defaultValue: DEFAULT_CAUCUS.speakerDuration },
        { field: 'speakerUnit', defaultValue: DEFAULT_CAUCUS.speakerUnit },
        { field: 'queueIsPublic', defaultValue: DEFAULT_CAUCUS.queueIsPublic },
      ],
    },
    {
      collectionKey: 'resolutions',
      fields: [
        {
          field: 'amendmentsArePublic',
          defaultValue: DEFAULT_RESOLUTION.amendmentsArePublic,
        },
        {
          field: 'requiredMajority',
          defaultValue: DEFAULT_RESOLUTION.requiredMajority,
        },
      ],
    },
  ],
};
