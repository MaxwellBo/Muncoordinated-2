import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'run';
const appUrl = process.env.CYPRESS_BASE_URL ?? 'http://127.0.0.1:5173';
const commandEnv = {
  ...process.env,
  CYPRESS_FIREBASE_EMULATOR_SEED: 'true',
  VITE_USE_FIREBASE_EMULATORS: 'true',
};
const shell = process.platform === 'win32';
let viteExited = false;

if (!['open', 'run'].includes(mode)) {
  console.error(`Usage: node scripts/run-cypress-with-emulators.mjs [open|run]`);
  process.exit(1);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForApp(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch (error) {
      // Vite is still starting.
    }

    if (viteExited) {
      throw new Error('Vite exited before the app was available');
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function run(command, args, options = {}) {
  return spawn(command, args, {
    shell,
    env: commandEnv,
    ...options,
  });
}

function stop(process) {
  if (!process.killed) {
    process.kill('SIGTERM');
  }
}

const vite = run('vite', ['--host', '127.0.0.1'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

vite.stdout.on('data', chunk => process.stdout.write(chunk));
vite.stderr.on('data', chunk => process.stderr.write(chunk));
vite.on('exit', () => {
  viteExited = true;
});

const stopVite = () => stop(vite);
process.on('SIGINT', () => {
  stopVite();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopVite();
  process.exit(143);
});

try {
  await waitForApp(appUrl);

  const cypress = run('cypress', [mode], {
    stdio: 'inherit',
  });

  cypress.on('exit', code => {
    stopVite();
    process.exit(code ?? 1);
  });
} catch (error) {
  stopVite();
  console.error(error);
  process.exit(1);
}
