import { Router } from 'express'
import EnterNameRoutes from './enter-name/routes'
import SuccessRoutes from './success/routes'
import AuditService from '../../../services/auditService'

const CreateContactRoutes = (auditService: AuditService) => {
  const router = Router({ mergeParams: true })

  router.use('/enter-name', EnterNameRoutes(auditService))
  router.use('/success', SuccessRoutes(auditService))

  return router
}

export default CreateContactRoutes
