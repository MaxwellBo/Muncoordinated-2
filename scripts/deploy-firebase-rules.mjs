#!/usr/bin/env node
/**
 * Deploy Realtime Database + Storage security rules using Application Default
 * Credentials (GOOGLE_APPLICATION_CREDENTIALS / google-github-actions/auth).
 *
 * Storage uses the Firebase Rules API directly because `firebase deploy --only
 * storage` requires Service Usage permissions the Admin SDK service account
 * does not have.
 */
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'muncoordinated';
const STORAGE_BUCKET = 'muncoordinated.appspot.com';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function loadServiceAccount() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS must point at a service account JSON key',
    );
  }

  return JSON.parse(await readFile(keyPath, 'utf8'));
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/firebase',
      ].join(' '),
    }),
  );
  const unsigned = `${header}.${claimSet}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(serviceAccount.private_key)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: `${unsigned}.${signature}`,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function deployDatabaseRules() {
  await new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['exec', 'firebase', 'deploy', '--only', 'database', '--project', PROJECT_ID, '--non-interactive'],
      { cwd: ROOT, stdio: 'inherit', env: process.env },
    );
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`firebase database deploy exited with code ${code}`));
    });
  });
}

async function deployStorageRules(accessToken) {
  const content = await readFile(path.join(ROOT, 'storage.rules'), 'utf8');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: {
          files: [{ name: 'storage.rules', content }],
        },
      }),
    },
  );
  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Creating storage ruleset failed: ${JSON.stringify(createJson)}`);
  }

  const releaseName = `projects/${PROJECT_ID}/releases/firebase.storage/${STORAGE_BUCKET}`;
  const patchRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/firebase.storage%2F${STORAGE_BUCKET}?updateMask=rulesetName`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        release: {
          name: releaseName,
          rulesetName: createJson.name,
        },
      }),
    },
  );
  const patchJson = await patchRes.json();
  if (!patchRes.ok) {
    throw new Error(`Publishing storage rules release failed: ${JSON.stringify(patchJson)}`);
  }

  console.log(`✔  storage: rules released for ${STORAGE_BUCKET} (${createJson.name})`);
}

async function main() {
  const storageOnly = process.argv.includes('--storage-only');
  const serviceAccount = await loadServiceAccount();
  if (serviceAccount.project_id && serviceAccount.project_id !== PROJECT_ID) {
    throw new Error(
      `Service account project_id is ${serviceAccount.project_id}, expected ${PROJECT_ID}`,
    );
  }

  console.log(`Deploying rules to ${PROJECT_ID} as ${serviceAccount.client_email}`);
  if (!storageOnly) {
    await deployDatabaseRules();
  }
  const token = await getAccessToken(serviceAccount);
  await deployStorageRules(token);
  console.log('✔  Deploy complete');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
