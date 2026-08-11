import { Router } from 'express'
import { VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import auth from '../authentication/auth'
import populateCurrentUser from './populateCurrentUser'
import config from '../config'
import logger from '../../logger'

export default function setUpCurrentUser(): Router {
  const router = Router({ mergeParams: true })
  const verificationClient = new VerificationClient(config.apis.tokenVerification, logger)
  router.use(auth.authenticationMiddleware(request => verificationClient.verifyToken(request)))
  router.use(populateCurrentUser())
  return router
}
