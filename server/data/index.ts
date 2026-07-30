/* eslint-disable import/first, import/order */
/*
 * Do app insights first as it does some magic instrumentation work, i.e. it affects other imports
 * In particular, application insights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
const applicationInsightsClient = buildAppInsightsClient(applicationInfo)

import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import HmppsAuditClient from './hmppsAuditClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import ContactsApiClient from './contactsApiClient'
import PrisonApiClient from './prisonApiClient'
import OrganisationsApiClient from './organisationsApiClient'
import AlertsApiClient from './alertsApiClient'
import { createRedisClient } from './redisClient'

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
    applicationInsightsClient,
  }
}

export { HmppsAuditClient, PrisonerSearchApiClient, ContactsApiClient, PrisonApiClient, OrganisationsApiClient }
