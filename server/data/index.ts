import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { AuditClient } from '@ministryofjustice/hmpps-audit-client'
import config from '../config'
import logger from '../../logger'
import applicationInfoSupplier from '../applicationInfo'
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
    hmppsAuditClient: new AuditClient(config.sqs.audit, logger),
    prisonerSearchApiClient: new PrisonerSearchApiClient(hmppsAuthClient),
    contactsApiClient: new ContactsApiClient(hmppsAuthClient),
    alertsApiClient: new AlertsApiClient(hmppsAuthClient),
    prisonApiClient: new PrisonApiClient(hmppsAuthClient),
    organisationsApiClient: new OrganisationsApiClient(hmppsAuthClient),
  }
}

export { PrisonerSearchApiClient, ContactsApiClient, PrisonApiClient, OrganisationsApiClient }
