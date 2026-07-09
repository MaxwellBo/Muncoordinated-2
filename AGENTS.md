# Agent Notes

## Firebase Emulators And Cypress

- Use `pnpm test:e2e` for integration tests. It starts the Firebase Auth, Realtime Database, and Storage emulators, starts Vite with `VITE_USE_FIREBASE_EMULATORS=true`, seeds deterministic Cypress data, and runs the Cypress specs.
- To inspect the app manually against local Firebase services, run `pnpm emulators` in one terminal and `VITE_USE_FIREBASE_EMULATORS=true pnpm start` in another.
- The emulator suite requires Java 21 or newer. The scripts automatically prefer a Homebrew OpenJDK 21 install on macOS when available.
- Do not point Cypress integration tests at the production Firebase project. Seed test users and database state through `cypress/plugins/firebaseEmulator.js`.
