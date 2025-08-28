import express, { Express, Locals } from 'express'
import { NotFound } from 'http-errors'
import { v4 as uuidv4 } from 'uuid'
import dpsComponents from '@ministryofjustice/hmpps-connect-dps-components'
import { SessionData } from 'express-session'
import { PrisonerPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
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
import { auditPageViewMiddleware } from '../../middleware/auditPageViewMiddleware'
import Permission from '../../enumeration/permission'
import { prisonerMock } from './PrisonerMocks'

jest.mock('../../services/auditService')

export const basicPrisonUser: HmppsUser = {
  name: 'ALL PRISON STAFF',
  userId: 'all_prison_staff_id',
  token: 'token',
  username: 'all_prison_staff',
  displayName: 'All Prison Staff',
  authSource: 'nomis',
  staffId: 1234,
  userRoles: [],
}

export const readOnlyPermissions: Record<PrisonerPermission, boolean> = { [Permission.read_contacts]: true } as Record<
  PrisonerPermission,
  boolean
>

export const adminUser: HmppsUser = {
  name: 'CONTACTS ADMIN',
  userId: 'contacts_admin_id',
  token: 'token',
  username: 'contacts_admin',
  displayName: 'Contacts Admin',
  authSource: 'nomis',
  staffId: 4567,
  userRoles: ['CONTACTS_ADMINISTRATOR'],
}

export const adminUserPermissions: Record<PrisonerPermission, boolean> = {
  [Permission.read_contacts]: true,
  [Permission.edit_contacts]: true,
} as Record<PrisonerPermission, boolean>

export const authorisingUser: HmppsUser = {
  name: 'CONTACTS AUTHORISER',
  userId: 'contacts_authoriser_id',
  token: 'token',
  username: 'contacts_authoriser',
  displayName: 'Contacts Authoriser',
  authSource: 'nomis',
  staffId: 5678,
  userRoles: ['CONTACTS_AUTHORISER'],
}

export const authorisingUserPermissions: Record<PrisonerPermission, boolean> = {
  [Permission.read_contacts]: true,
  [Permission.edit_contacts]: true,
  [Permission.edit_contact_visit_approval]: true,
  [Permission.edit_contact_restrictions]: true,
} as Record<PrisonerPermission, boolean>

export const userWithMultipleRoles: HmppsUser = {
  name: 'CONTACTS MULTIPLE ROLES',
  userId: 'contacts_multi_role_user_id',
  token: 'token',
  username: 'contacts_multi_role_user',
  displayName: 'Contacts Multiple Roles',
  authSource: 'nomis',
  staffId: 6789,
  userRoles: ['CONTACTS_AUTHORISER', 'CONTACTS_ADMINISTRATOR', 'ROLE_PRISON'],
}

export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => HmppsUser,
  validationErrors?: Locals['validationErrors'],
  sessionReceiver?: (session: Partial<SessionData>) => void,
): Express {
  const app = express()

  app.set('view engine', 'njk')
  flashProvider.mockImplementation(_ => [])

  nunjucksSetup(app)
  app.use(setUpWebSession())
  if (services.auditService) {
    app.get('*any', auditPageViewMiddleware(services.auditService))
  }
  app.use(setUpAuth())
  app.use((req, res, next) => {
    req.user = userSupplier() as Express.User
    req.flash = flashProvider
    res.locals = {
      ...res.locals,
      user: { ...req.user } as HmppsUser,
    }
    req.middleware = { prisonerData: prisonerMock }
    req.session.activeCaseLoadId = 'HEI'
    req.session.activeCaseLoad = {
      caseLoadId: 'HEI',
      caseloadFunction: '',
      currentlyActive: true,
      description: 'Hewell',
      type: '',
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
    '*any',
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
  },
  userSupplier = () => basicPrisonUser,
  validationErrors,
  sessionReceiver = undefined,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => HmppsUser
  validationErrors?: Locals['validationErrors']
  sessionReceiver?: (session: Partial<SessionData>) => void
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier, validationErrors, sessionReceiver)
}
