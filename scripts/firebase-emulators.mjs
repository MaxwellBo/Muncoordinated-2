import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'start';
const shell = process.platform === 'win32';

if (!['start', 'test'].includes(mode)) {
  console.error('Usage: node scripts/firebase-emulators.mjs [start|test]');
  process.exit(1);
}

function pathWithJava() {
  const candidates = [
    process.env.JAVA_HOME && `${process.env.JAVA_HOME}/bin`,
    '/opt/homebrew/opt/openjdk@21/bin',
    '/usr/local/opt/openjdk@21/bin',
    '/opt/homebrew/opt/openjdk/bin',
    '/usr/local/opt/openjdk/bin',
  ].filter(Boolean);

  const javaBin = candidates.find(path => existsSync(`${path}/java`));

  if (!javaBin) {
    return process.env.PATH;
  }

  return `${javaBin}:${process.env.PATH}`;
}

const firebaseArgs = mode === 'test'
  ? [
      'emulators:exec',
      '--only',
      'auth,database,storage',
      'node ./scripts/run-cypress-with-emulators.mjs run',
    ]
  : [
      'emulators:start',
      '--only',
      'auth,database,storage',
    ];

const firebase = spawn('firebase', firebaseArgs, {
  shell,
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: pathWithJava(),
  },
});

firebase.on('exit', code => {
  process.exit(code ?? 1);
});
