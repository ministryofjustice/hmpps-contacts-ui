import { Router } from 'express'
import type { Services } from '../services'
import ContactsRoutes from './contacts/routes'
import SearchRoutes from './search/routes'
import SEARCH_PRISONER_URL from './urls'
import HomeRoutes from './home/routes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes({ auditService, prisonerSearchService }: Services): Router {
  const router = Router({ mergeParams: true })

  router.use(SEARCH_PRISONER_URL, SearchRoutes(auditService, prisonerSearchService))
  router.use('/contacts', ContactsRoutes(auditService))
  router.use('/', HomeRoutes(auditService))

  return router
}
