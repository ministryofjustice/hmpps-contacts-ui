import { Router } from 'express'
import type { Services } from '../services'
import ContactsRoutes from './contacts/routes'
import SearchRoutes from './search/routes'
import SEARCH_PRISONER_URL from './urls'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes({ auditService, prisonerSearchService }: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('/', ContactsRoutes(auditService))
  router.use(SEARCH_PRISONER_URL, SearchRoutes(auditService, prisonerSearchService))

  return router
}
