/* eslint-disable import/first */
/*
 * Do app insights first as it does some magic instrumentation work, i.e. it affects other imports
 * In particular, application insights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
const applicationInsightsClient = buildAppInsightsClient(applicationInfo)

import config from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import ContactsApiClient from './contactsApiClient'
import PrisonApiClient from './prisonApiClient'
import OrganisationsApiClient from './organisationsApiClient'
import AlertsApiClient from './alertsApiClient'
// Phase 1 proxy-aware adapter — replaced by @ministryofjustice/hmpps-auth-clients in Phase 2
import AuthenticationClient from './authenticationClient'

export const dataAccess = () => {
  const hmppsAuthClient = new AuthenticationClient()

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
