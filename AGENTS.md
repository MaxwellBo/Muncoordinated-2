# Agent Notes

## Firebase Emulators And Cypress

- Use `yarn test:e2e` for integration tests. It starts the Firebase Auth, Realtime Database, and Storage emulators, starts Vite with `VITE_USE_FIREBASE_EMULATORS=true`, seeds deterministic Cypress data, and runs the Cypress specs.
- To inspect the app manually against local Firebase services, run `yarn emulators` in one terminal and `VITE_USE_FIREBASE_EMULATORS=true yarn start` in another.
- The emulator suite requires Java 21 or newer. The scripts automatically prefer a Homebrew OpenJDK 21 install on macOS when available.
- Do not point Cypress integration tests at the production Firebase project. Seed test users and database state through `cypress/plugins/firebaseEmulator.js`.

## RTDB field backfills

- Reusable planner and runner: `scripts/lib/field-backfill.ts`, `scripts/backfill-missing-fields.ts`.
- Manifests live under `scripts/migrations/` (e.g. `required-optional-fields` for `// TODO: Migrate` fields).
- Dry-run (public read): `yarn migrate:backfill -- --dry-run`
- Apply (service account): `GOOGLE_APPLICATION_CREDENTIALS=path/to/sa.json yarn migrate:backfill`
- Emulator: `FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=muncoordinated yarn migrate:backfill`
