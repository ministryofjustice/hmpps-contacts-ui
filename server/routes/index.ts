import { Router } from 'express'
import type { Services } from '../services'
import ContactsRoutes from './contacts/routes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes({ auditService }: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('/', ContactsRoutes(auditService))

  return router
}
