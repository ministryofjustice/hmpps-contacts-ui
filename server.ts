// Initialise OpenTelemetry-based Application Insights instrumentation before anything else — it needs
// to patch express/http/bunyan before those modules are first required elsewhere.
import './server/utils/azureAppInsights'
import { flushTelemetry } from '@ministryofjustice/hmpps-azure-telemetry'

import app from './server/index'
import logger from './logger'

const server = app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)
})

let isShuttingDown = false

const closeServer = (): Promise<void> =>
  new Promise(resolve => {
    server.close(error => {
      if (error) {
        logger.error(error, 'Error while closing HTTP server during shutdown')
      }
      resolve()
    })
  })

const shutdown = async (): Promise<void> => {
  if (isShuttingDown) return
  isShuttingDown = true

  await closeServer()
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())
