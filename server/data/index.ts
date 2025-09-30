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

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
  prisonerSearchApiClient: new PrisonerSearchApiClient(),
  contactsApiClient: new ContactsApiClient(),
  prisonApiClient: new PrisonApiClient(),
  organisationsApiClient: new OrganisationsApiClient(),
  applicationInsightsClient,
})

export { HmppsAuditClient, PrisonerSearchApiClient, ContactsApiClient, PrisonApiClient, OrganisationsApiClient }
