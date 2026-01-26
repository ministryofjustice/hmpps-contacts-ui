import { Router } from 'express'
import AuditService from '../../../services/auditService'
import { ContactsService, PrisonerSearchService, RestrictionsService } from '../../../services'
import ReferenceDataService from '../../../services/referenceDataService'
import ContactsSearchController from './contactsSearchController'
import ContactViewController from './contactViewController'
import StartSearchContactJourneyController from './startSearchContactJourneyController'
import { routerWithoutPrisonerMethods } from '../../../utils/routerWithoutPrisonerMethods'

const SearchContactRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
  restrictionsService: RestrictionsService,
) => {
  const router = Router({ mergeParams: true })
  const { get, post } = routerWithoutPrisonerMethods(router, auditService)
  get('/start', new StartSearchContactJourneyController())
  get('/contacts/search/:journeyId', new ContactsSearchController(contactsService))
  post('/contacts/search/:journeyId', new ContactsSearchController(contactsService))
  get(
    '/contacts/view/:matchingContactId/:journeyId',
    new ContactViewController(contactsService, restrictionsService, referenceDataService, prisonerSearchService),
  )

  return router
}

export default SearchContactRoutes
