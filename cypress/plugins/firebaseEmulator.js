const TEST_USER = {
  email: 'fake@email.com',
  password: 'fakepassword',
};

const SANDBOX_COMMITTEE_ID = '-LQCVY1042m3UW3y6ojd';

function isEnabled(config) {
  return (
    process.env.CYPRESS_FIREBASE_EMULATOR_SEED === 'true'
    || config.env.firebaseEmulatorSeed === true
    || config.env.firebaseEmulatorSeed === 'true'
  );
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : undefined;
  } catch (error) {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} failed: ${response.status} ${text}`);
  }

  return body;
}

async function createTestUser({ projectId, authHost }) {
  await request(`http://${authHost}/emulator/v1/projects/${projectId}/accounts`, {
    method: 'DELETE',
  });

  const user = await request(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
      returnSecureToken: true,
    }),
  });

  return user.localId;
}

function sandboxCommittee(ownerUid) {
  const timer = {
    elapsed: 0,
    remaining: 600,
    ticking: false,
  };

  return {
    name: 'Sandbox',
    chair: '',
    topic: 'Sandbox topic',
    conference: 'Cypress',
    creatorUid: ownerUid,
    members: {
      afghanistan: {
        name: 'Afghanistan',
        present: true,
        rank: 'Standard',
        voting: false,
      },
      bolivia: {
        name: 'Bolivia',
        present: true,
        rank: 'Observer',
        voting: false,
      },
      china: {
        name: 'China',
        present: true,
        rank: 'Veto',
        voting: true,
      },
    },
    caucuses: {
      gsl: {
        name: "General Speakers' List",
        topic: '',
        status: 'Open',
        speakerTimer: {
          elapsed: 0,
          remaining: 60,
          ticking: false,
        },
        speakerDuration: 60,
        speakerUnit: 'sec',
        caucusTimer: timer,
        queueIsPublic: false,
      },
    },
    timer,
    notes: '',
    settings: {
      moveQueueUp: false,
      timersInSeparateColumns: false,
      autoNextSpeaker: false,
      motionVotes: false,
      motionsArePublic: false,
    },
  };
}

async function seedRealtimeDatabase({ projectId, databaseHost, ownerUid }) {
  await request(`http://${databaseHost}/.json?ns=${projectId}`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer owner',
    },
    body: JSON.stringify({
      committees: {
        [SANDBOX_COMMITTEE_ID]: sandboxCommittee(ownerUid),
      },
    }),
  });
}

async function clearStorageEmulator({ storageHost, projectId }) {
  const bucket = `${projectId}.appspot.com`;

  let list;
  try {
    list = await request(`http://${storageHost}/v0/b/${bucket}/o`);
  } catch (error) {
    // Bucket may not exist until the first upload.
    return;
  }

  const items = list?.items ?? [];

  await Promise.all(
    items.map((item) =>
      request(`http://${storageHost}/v0/b/${bucket}/o/${encodeURIComponent(item.name)}`, {
        method: 'DELETE',
      }),
    ),
  );
}

export async function seedFirebaseEmulators(config) {
  const projectId = config.env.firebaseProjectId;
  const authHost = config.env.firebaseAuthEmulatorHost;
  const databaseHost = config.env.firebaseDatabaseEmulatorHost;
  const storageHost = config.env.firebaseStorageEmulatorHost;

  const ownerUid = await createTestUser({ projectId, authHost });
  await seedRealtimeDatabase({ projectId, databaseHost, ownerUid });
  await clearStorageEmulator({ storageHost, projectId });
}

export function registerFirebaseEmulatorSeed(on, config) {
  if (!isEnabled(config)) {
    return;
  }

  on('before:spec', async () => {
    await seedFirebaseEmulators(config);
  });
}
