import express, { Express, Locals } from 'express'
import { NotFound } from 'http-errors'
import { v4 as uuidv4 } from 'uuid'
import dpsComponents from '@ministryofjustice/hmpps-connect-dps-components'
import { SessionData } from 'express-session'
import config from '../../config'
import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import type { Services } from '../../services'
import { HmppsUser } from '../../interfaces/hmppsUser'
import setUpWebSession from '../../middleware/setUpWebSession'
import populateValidationErrors from '../../middleware/populateValidationErrors'
import setUpAuth from '../../middleware/setUpAuthentication'
import { MockedService } from '../../testutils/mockedServices'
import InMemoryTokenStore from '../../data/tokenStore/inMemoryTokenStore'
import JourneyData = journeys.JourneyData

jest.mock('../../services/auditService')

export const user: HmppsUser = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  authSource: 'nomis',
  staffId: 1234,
  userRoles: [],
}

export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => HmppsUser,
  validationErrors?: Locals['validationErrors'],
  sessionReceiver?: (session: Partial<SessionData>) => void,
  suppliedJourneyData?: { data: JourneyData },
): Express {
  const app = express()

  app.set('view engine', 'njk')
  flashProvider.mockImplementation(_ => [])

  nunjucksSetup(app)
  app.use(setUpWebSession())
  app.use(setUpAuth())
  app.use((req, res, next) => {
    req.user = userSupplier() as Express.User
    req.flash = flashProvider
    res.locals = {
      ...res.locals,
      user: { ...req.user } as HmppsUser,
    }
    req.session.activeCaseLoadId = 'HEI'
    req.session.activeCaseLoad = {
      caseLoadId: 'HEI',
      caseloadFunction: '',
      currentlyActive: true,
      description: 'Hewell',
      type: '',
    }
    if (suppliedJourneyData) {
      req.journey = suppliedJourneyData.data
    }
    next()
  })
  app.use((req, res, next) => {
    req.id = uuidv4()
    next()
  })
  app.use((req, res, next) => {
    if (sessionReceiver) sessionReceiver(req.session)
    next()
  })
  if (validationErrors) {
    app.use((req, _res, next) => {
      req.flash('validationErrors', JSON.stringify(validationErrors))
      next()
    })
  }
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(populateValidationErrors())
  app.use(routes(services))
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  app.get(
    '*',
    dpsComponents.getPageComponents({
      dpsUrl: config.serviceUrls.digitalPrison,
    }),
  )

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {
    auditService: MockedService.AuditService(),
    tokenStore: new InMemoryTokenStore(),
  },
  userSupplier = () => user,
  validationErrors,
  sessionReceiver = undefined,
  suppliedJourneyData = undefined,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => HmppsUser
  validationErrors?: Locals['validationErrors']
  sessionReceiver?: (session: Partial<SessionData>) => void
  suppliedJourneyData?: { data: JourneyData }
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(
    services as Services,
    production,
    userSupplier,
    validationErrors,
    sessionReceiver,
    suppliedJourneyData,
  )
}
