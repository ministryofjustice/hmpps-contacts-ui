import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import prisonerSearchApi from './integration_tests/mockApis/prisonerSearchApi'
import componentApi from './integration_tests/mockApis/componentApi'
import contactsApi from './integration_tests/mockApis/contactsApi'
import prisonApi from './integration_tests/mockApis/prisonApi'
import logAccessibilityViolations from './integration_tests/support/accessibilityViolations'
import organisationsApi from './integration_tests/mockApis/organisationsApi'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        ...auth,
        ...tokenVerification,
        ...prisonerSearchApi,
        ...componentApi,
        ...contactsApi,
        ...organisationsApi,
        ...prisonApi,
        ...logAccessibilityViolations,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
    experimentalRunAllSpecs: true,
    env: {
      codeCoverage: {
        url: 'http://localhost:3007/__coverage__',
      },
    },
    retries: {
      runMode: 1,
    },
  },
})
