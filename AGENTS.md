# Agent Notes

## Firebase Emulators And Cypress

- Use `pnpm test:e2e` for integration tests. It starts the Firebase Auth, Realtime Database, and Storage emulators, starts Vite with `VITE_USE_FIREBASE_EMULATORS=true`, seeds deterministic Cypress data, and runs the Cypress specs.
- To inspect the app manually against local Firebase services, run `pnpm emulators` in one terminal and `VITE_USE_FIREBASE_EMULATORS=true pnpm start` in another.
- The emulator suite requires Java 21 or newer. The scripts automatically prefer a Homebrew OpenJDK 21 install on macOS when available.
- Do not point Cypress integration tests at the production Firebase project. Seed test users and database state through `cypress/plugins/firebaseEmulator.js`.

## Cursor Cloud specific instructions

- Node 22, `pnpm`, and OpenJDK 21 are preinstalled; the update script only runs `pnpm install`. Java 21 satisfies the emulator suite requirement (the macOS Homebrew JDK lookup in `scripts/firebase-emulators.mjs` is a no-op here).
- Scripts/commands are defined in `package.json`. Notable gotchas:
  - `pnpm test` runs Vitest in watch mode (never exits). For a one-shot run use `pnpm exec vitest run`.
  - There is no `lint` script. Typecheck with `pnpm exec tsc --noEmit` (production `pnpm build` runs `tsc && vite build`).
- The dev server (`pnpm start`, Vite) binds to `localhost` only, so `curl http://127.0.0.1:5173` fails while `curl http://localhost:5173` works. Pass `--host` to expose it on other interfaces.
- The Firebase web config in `src/App.tsx` is a hardcoded public config, so no secrets are needed. By default the app talks to the real `muncoordinated` Firebase project; set `VITE_USE_FIREBASE_EMULATORS=true` to wire it to the local emulators (Auth 9099, DB 9000, Storage 9199, UI 4000). Prefer emulators for local testing to avoid writing to production.
- Emulator startup logs `gcp-metadata` `ECONNRESET` and "Unable to fetch the CLI MOTD" warnings due to restricted egress; these are non-fatal and the emulators still start.
- Cypress e2e (`pnpm test:e2e`, `pnpm cypress:run`) is blocked in this environment: the Cypress binary is not downloaded by `pnpm install`, and fetching it from `download.cypress.io` is blocked by network egress. Unit tests and manual/emulator testing work without it.
