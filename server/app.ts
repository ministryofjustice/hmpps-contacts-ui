import express from 'express'
import * as Sentry from '@sentry/node'
import './sentry'
import createError from 'http-errors'
import { getFrontendComponents, retrieveCaseLoadData } from '@ministryofjustice/hmpps-connect-dps-components'

// @ts-expect-error Import untyped middleware for cypress coverage
import cypressCoverage from '@cypress/code-coverage/middleware/express'
import config from './config'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { appInsightsMiddleware } from './utils/azureAppInsights'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import routes from './routes'
import type { Services } from './services'
import AuthorisedRoles from './enumeration/authorisedRoles'
import populateValidationErrors from './middleware/populateValidationErrors'
import setUpSuccessNotificationBanner from './middleware/setUpSuccessNotificationBanner'
import sentryMiddleware from './middleware/sentryMiddleware'
import logger from '../logger'
import { auditPageViewMiddleware } from './middleware/auditPageViewMiddleware'

export default function createApp(services: Services): express.Application {
  const app = express()

  if (process.env.NODE_ENV === 'e2e-test') {
    cypressCoverage(app)
  }

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(sentryMiddleware())
  app.use(appInsightsMiddleware())
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app)
  app.get('*any', auditPageViewMiddleware(services.auditService))
  app.use(setUpAuthentication())
  app.use(
    authorisationMiddleware([
      AuthorisedRoles.ROLE_PRISON,
      AuthorisedRoles.ROLE_CONTACTS_ADMINISTRATOR,
      AuthorisedRoles.ROLE_CONTACTS_AUTHORISER,
    ]),
  )
  app.use(setUpCsrf())
  app.use(
    '*any',
    getFrontendComponents({
      logger,
      componentApiConfig: config.apis.componentApi,
      dpsUrl: config.serviceUrls.digitalPrison,
      requestOptions: { includeSharedData: true },
    }),
  )

  app.use(
    retrieveCaseLoadData({
      logger,
      prisonApiConfig: config.apis.prisonApi,
    }),
  )
  app.use(setUpCurrentUser())
  app.use(populateValidationErrors())
  app.use(setUpSuccessNotificationBanner())
  app.use(routes(services))

  if (config.sentry.dsn) Sentry.setupExpressErrorHandler(app)

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
