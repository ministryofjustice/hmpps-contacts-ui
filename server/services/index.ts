import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'
import PrisonerImageService from './prisonerImageService'
import ReferenceDataService from './referenceDataService'
import RestrictionsService from './restrictionsService'
import PrisonerAddressService from './prisonerAddressService'
import config from '../config'
import RedisTokenStore from '../data/tokenStore/redisTokenStore'
import { createRedisClient } from '../data/redisClient'
import InMemoryTokenStore from '../data/tokenStore/inMemoryTokenStore'

const tokenStore = config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore()

export const services = () => {
  const { applicationInfo, hmppsAuditClient, prisonerSearchApiClient, contactsApiClient, prisonApiClient } =
    dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  const contactsService = new ContactsService(contactsApiClient)
  const prisonerImageService = new PrisonerImageService(prisonApiClient)
  const referenceDataService = new ReferenceDataService(contactsApiClient)
  const restrictionsService = new RestrictionsService(contactsApiClient)
  const prisonerAddressService = new PrisonerAddressService(prisonApiClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
    contactsService,
    prisonerImageService,
    referenceDataService,
    restrictionsService,
    prisonerAddressService,
    tokenStore,
  }
}

export type Services = ReturnType<typeof services>

export {
  AuditService,
  PrisonerSearchService,
  ContactsService,
  PrisonerImageService,
  RestrictionsService,
  PrisonerAddressService,
}
