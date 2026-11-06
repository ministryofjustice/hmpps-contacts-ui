import { Router } from 'express'
import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import AuditService from '../../services/auditService'
import ContactsService from '../../services/contactsService'
import PrisonerSearchService from '../../services/prisonerSearchService'
import ReferenceDataService from '../../services/referenceDataService'
import RestrictionsService from '../../services/restrictionsService'
import AlertsService from '../../services/alertsService'
import populatePrisonerDetailsIfInCaseload from '../../middleware/populatePrisonerDetailsIfInCaseload'
import { validate } from '../../middleware/validationMiddleware'
import { restrictionSchema } from '../restrictions/schema/restrictionSchema'
import { routerMethods } from '../../utils/routerMethods'
import AddPrisonerRestrictionController from './addPrisonerRestrictionController'
import ClosePrisonerRestrictionController from './closePrisonerRestrictionController'
import { closePrisonerRestrictionSchema } from './closePrisonerRestrictionSchema'
import {
  requireMaintainRestrictionsRole,
  requirePrisonerRestrictionsMaintenanceEnabled,
} from './prisonerRestrictionCommon'
import UpdatePrisonerRestrictionController from './updatePrisonerRestrictionController'

const PrisonerRestrictionsRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
  restrictionsService: RestrictionsService,
  permissionsService: PermissionsService,
  alertsService: AlertsService,
) => {
  const router = Router({ mergeParams: true })
  const { get, post } = routerMethods(router, permissionsService, auditService)
  const populatePrisoner = populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)
  // Routes are registered for every prison; the feature is only available to enabled prisons and permitted roles
  const guards = [requirePrisonerRestrictionsMaintenanceEnabled, requireMaintainRestrictionsRole]

  const addPath = '/prisoner/:prisonerNumber/restrictions/add'
  const addController = new AddPrisonerRestrictionController(referenceDataService, restrictionsService)
  get(addPath, addController, ...guards, populatePrisoner)
  post(addPath, addController, ...guards, populatePrisoner, validate(restrictionSchema()))

  const updatePath = '/prisoner/:prisonerNumber/restrictions/:prisonerRestrictionId/update'
  const updateController = new UpdatePrisonerRestrictionController(
    contactsService,
    referenceDataService,
    restrictionsService,
  )
  get(updatePath, updateController, ...guards, populatePrisoner)
  post(updatePath, updateController, ...guards, populatePrisoner, validate(restrictionSchema()))

  const closePath = '/prisoner/:prisonerNumber/restrictions/:prisonerRestrictionId/close'
  const closeController = new ClosePrisonerRestrictionController(contactsService, restrictionsService)
  get(closePath, closeController, ...guards, populatePrisoner)
  post(closePath, closeController, ...guards, populatePrisoner, validate(closePrisonerRestrictionSchema()))

  return router
}

export default PrisonerRestrictionsRoutes
