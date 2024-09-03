import { Router } from 'express'
import type { Services } from '../services'
import ContactsRoutes from './contacts/contactRoutes'
import HomeRoutes from './home/routes'

export default function routes({ auditService, prisonerSearchService }: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('/contacts', ContactsRoutes(auditService, prisonerSearchService))
  router.use('/', HomeRoutes(auditService))

  return router
}
