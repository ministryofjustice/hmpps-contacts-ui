// Initialise OpenTelemetry-based Application Insights instrumentation before anything else — it needs
// to patch express/http/bunyan before those modules are first required elsewhere.
import './server/utils/azureAppInsights'
import { flushTelemetry } from '@ministryofjustice/hmpps-azure-telemetry'

import app from './server/index'
import logger from './logger'

app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)
})

const shutdown = async (): Promise<void> => {
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())
