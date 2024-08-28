import { Router } from 'express'
import type { Services } from '../services'
import ContactsRoutes from './contacts/routes'
import SearchRoutes from './search/routes'
import HomeRoutes from './home/routes'

export default function routes({ auditService, prisonerSearchService }: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('/search/prisoner', SearchRoutes(auditService, prisonerSearchService))
  router.use('/contacts', ContactsRoutes(auditService))
  router.use('/', HomeRoutes(auditService))

  return router
}
