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
import config from '../../config'
import AddPrisonerRestrictionController from './addPrisonerRestrictionController'
import DeletePrisonerRestrictionController from './deletePrisonerRestrictionController'
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
  if (!config.feature.prisonerRestrictionsMaintenanceEnabled) return router

  const { get, post } = routerMethods(router, permissionsService, auditService)
  const populatePrisoner = populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)

  const addPath = '/prisoner/:prisonerNumber/restrictions/add'
  const addController = new AddPrisonerRestrictionController(referenceDataService, restrictionsService)
  get(addPath, addController, populatePrisoner)
  post(addPath, addController, populatePrisoner, validate(restrictionSchema()))

  const updatePath = '/prisoner/:prisonerNumber/restrictions/:prisonerRestrictionId/update'
  const updateController = new UpdatePrisonerRestrictionController(
    contactsService,
    referenceDataService,
    restrictionsService,
  )
  get(updatePath, updateController, populatePrisoner)
  post(updatePath, updateController, populatePrisoner, validate(restrictionSchema()))

  const deletePath = '/prisoner/:prisonerNumber/restrictions/:prisonerRestrictionId/delete'
  const deleteController = new DeletePrisonerRestrictionController(contactsService, restrictionsService)
  get(deletePath, deleteController, populatePrisoner)
  post(deletePath, deleteController, populatePrisoner)

  return router
}

export default PrisonerRestrictionsRoutes
