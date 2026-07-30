import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import applicationInfoSupplier from '../applicationInfo'
import HmppsAuditClient from './hmppsAuditClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import ContactsApiClient from './contactsApiClient'
import PrisonApiClient from './prisonApiClient'
import OrganisationsApiClient from './organisationsApiClient'
import AlertsApiClient from './alertsApiClient'
import { createRedisClient } from './redisClient'

const applicationInfo = applicationInfoSupplier()

export const dataAccess = () => {
  const hmppsAuthClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  )

  return {
    applicationInfo,
    hmppsAuthClient,
    hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
    prisonerSearchApiClient: new PrisonerSearchApiClient(hmppsAuthClient),
    contactsApiClient: new ContactsApiClient(hmppsAuthClient),
    alertsApiClient: new AlertsApiClient(hmppsAuthClient),
    prisonApiClient: new PrisonApiClient(hmppsAuthClient),
    organisationsApiClient: new OrganisationsApiClient(hmppsAuthClient),
  }
}

export { HmppsAuditClient, PrisonerSearchApiClient, ContactsApiClient, PrisonApiClient, OrganisationsApiClient }
