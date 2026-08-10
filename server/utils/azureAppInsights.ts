import { initialiseTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import type { RequestHandler } from 'express'
import applicationInfoSupplier from '../applicationInfo'

const { applicationName, buildNumber } = applicationInfoSupplier()

initialiseTelemetry({
  serviceName: applicationName,
  serviceVersion: buildNumber,
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(telemetry.processors.filterSpanWherePath(['/health', '/ping', '/info', '/assets/*', '/favicon.ico']))
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

/**
 * Sets the current user's username/active caseload as attributes on the active (HTTP server) span,
 * replacing the old applicationinsights `addUserDataToRequests` telemetry processor. Must run after
 * the user (and their active caseload) has been populated onto res.locals.
 */
export function telemetryUserAttributesMiddleware(): RequestHandler {
  return (_req, res, next) => {
    const { username, activeCaseLoad } = res.locals.user ?? {}
    if (username) {
      const spanAttributes: Record<string, string> = {
        username,
      }

      if (activeCaseLoad?.caseLoadId) {
        spanAttributes.activeCaseLoadId = activeCaseLoad.caseLoadId
      }

      telemetry.setSpanAttributes(spanAttributes)
    }
    next()
  }
}
