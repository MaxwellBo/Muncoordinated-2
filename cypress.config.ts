import { defineConfig } from 'cypress'
import plugin from './cypress/plugins/index.js'

export default defineConfig({
  blockHosts: 'www.google-analytics.com',
  projectId: 'zxca1q',
  e2e: {
    setupNodeEvents(on, config) {
      return plugin(on, config)
    },
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})