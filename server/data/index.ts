/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import config from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import ContactsApiClient from './contactsApiClient'

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
  prisonerSearchApiClient:  new PrisonerSearchApiClient(),
  contactsApiClient: new ContactsApiClient(),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { HmppsAuditClient, PrisonerSearchApiClient, ContactsApiClient }
