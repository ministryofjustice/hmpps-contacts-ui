import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import { HmppsUser } from '../interfaces/hmppsUser'
import logger from '../../logger'

export default class TelemetryService {
  trackEvent(
    name: string,
    user: HmppsUser,
    properties?: { [key: string]: string | number | boolean | null | undefined },
  ) {
    try {
      // telemetry.trackEvent only accepts string/number/boolean attributes, unlike the old applicationinsights
      // client, so null/undefined properties are dropped rather than forwarded.
      const sanitisedProperties = Object.fromEntries(
        Object.entries(properties ?? {}).filter(([, value]) => value !== null && value !== undefined),
      ) as Record<string, string | number | boolean>

      telemetry.trackEvent(name, {
        ...sanitisedProperties,
        username: user.username,
        activeCaseLoadId: user.activeCaseLoad?.caseLoadId ?? '',
      })
    } catch (error) {
      logger.error('Error sending telemetry event, ', error)
    }
  }
}
