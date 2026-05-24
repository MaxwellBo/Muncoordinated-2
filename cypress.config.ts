import { defineConfig } from 'cypress'
import plugin from './cypress/plugins/index.js'

export default defineConfig({
  blockHosts: 'www.google-analytics.com',
  experimentalInteractiveRunEvents: true,
  projectId: 'zxca1q',
  env: {
    firebaseProjectId: process.env.CYPRESS_FIREBASE_PROJECT_ID ?? 'muncoordinated',
    firebaseAuthEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099',
    firebaseDatabaseEmulatorHost: process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? '127.0.0.1:9000',
    firebaseStorageEmulatorHost: process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199',
  },
  e2e: {
    testIsolation: false,
    setupNodeEvents(on, config) {
      return plugin(on, config)
    },
    baseUrl: 'http://127.0.0.1:5173',
    specPattern: 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
  },
})
