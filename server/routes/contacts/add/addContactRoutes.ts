import { Router } from 'express'
import { z } from 'zod'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import EnterNameController from './enter-name/createContactEnterNameController'
import { SchemaFactory, validate } from '../../../middleware/validationMiddleware'
import { fullNameSchema } from '../common/name/nameSchemas'
import CreateContactEnterDobController from './enter-dob/createContactEnterDobController'
import StartAddContactJourneyController from './start/startAddContactJourneyController'
import { ContactsService, PrisonerAddressService, PrisonerSearchService, RestrictionsService } from '../../../services'
import CreateContactCheckAnswersController from './check-answers/createContactCheckAnswersController'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import ReferenceDataService from '../../../services/referenceDataService'
import SelectRelationshipToPrisonerController from './relationship-to-prisoner/selectRelationshipToPrisonerController'
import { selectRelationshipSchemaFactory } from '../common/relationship/selectRelationshipSchemas'
import populatePrisonerDetailsIfInCaseload from '../../../middleware/populatePrisonerDetailsIfInCaseload'
import EnterRelationshipCommentsController from './relationship-comments/enterRelationshipCommentsController'
import { enterRelationshipCommentsSchema } from './relationship-comments/enterRelationshipCommentsSchemas'
import ContactSearchController from './contact-search/contactSearchController'
import { contactSearchSchema } from './contact-search/contactSearchSchema'
import { contactMatchSchema } from './contact-match/contactMatchSchema'
import AddContactModeController from './mode/addContactModeController'
import ContactMatchController from './contact-match/contactMatchController'
import { optionalDobSchema } from './enter-dob/enterDobSchemas'
import SuccessfullyAddedContactController from './success/successfullyAddedContactController'
import { selectRelationshipTypeSchema } from './relationship-type/relationshipTypeSchema'
import RelationshipTypeController from './relationship-type/relationshipTypeController'
import CancelAddContactController from './cancel/cancelAddContactController'
import AddContactAdditionalInfoController from './additional-info/addContactAdditionalInfoController'
import AddAddressesController from './addresses/addAddressesController'
import { routerMethods } from '../../../utils/routerMethods'
import { PageHandler } from '../../../interfaces/pageHandler'
import CreateContactAddressTypeController from './addresses/select-type/createContactAddressTypeController'
import CreateContactUsePrisonerAddressController from './addresses/use-prisoner-address/createContactUsePrisonerAddressController'
import CreateContactEnterAddressController from './addresses/enter-address/createContactEnterAddressController'
import { addressLinesSchema } from '../manage/addresses/enter-address/addressLinesSchemas'
import CreateContactAddressDatesController from './addresses/dates/createContactAddressDatesController'
import { addressDatesSchema } from '../manage/addresses/dates/addressDatesSchemas'
import CreateContactAddressFlagsController from './addresses/primary-or-postal/createContactAddressFlagsController'
import { addressFlagsSchema } from '../manage/addresses/primary-or-postal/addressFlagsSchemas'
import CreateContactAddressPhoneController from './addresses/add-address-phone/createContactAddressPhoneController'
import CreateContactAddressCommentsController from './addresses/comments/createContactAddressCommentsController'
import { addressCommentsSchema } from '../manage/addresses/comments/addressCommentsSchema'
import CreateContactDeleteAddressController from './addresses/delete/createContactDeleteAddressController'
import CreateContactDeleteAddressPhoneController from './addresses/delete-address-phone/createContactDeleteAddressPhoneController'
import AddContactAddPhoneController from './phone/addContactAddPhoneController'
import { optionalPhonesSchema } from '../manage/addresses/add-address-phone/AddAddressPhonesSchema'
import AddContactConfirmDeletePhoneController from './phone/addContactConfirmDeletePhoneController'
import AddContactGenderController from './gender/addContactGenderController'
import CreateContactIsStaffController from './is-staff/createContactIsStaffController'
import CreateContactLanguageAndInterpreterController from './language-interpreter/createContactLanguageAndInterpreterController'
import AddContactAddIdentitiesController from './identities/addContactAddIdentitiesController'
import { optionalIdentitiesSchema } from '../manage/identities/IdentitySchemas'
import AddContactConfirmDeleteIdentityController from './identities/addContactConfirmDeleteIdentityController'
import AddContactDomesticStatusController from './domestic-status/addContactDomesticStatusController'
import AddContactAddEmailsController from './emails/addContactAddEmailsController'
import AddContactConfirmDeleteEmailController from './emails/addContactConfirmDeleteEmailController'
import { optionalEmailsSchema } from '../manage/email/emailSchemas'
import ApprovedToVisitController from './approved-to-visit/approvedToVisitController'
import EmergencyContactOrNextOfKinController from './emergency-contact-or-next-of-kin/emergencyContactOrNextOfKinController'
import { optionalEmergencyContactOrNextOfKinSchema } from '../manage/relationship/emergency-contact-or-next-of-kin/manageEmergencyContactOrNextOfKinSchema'
import AddEmploymentsController from './employments/addEmploymentsController'
import CreateContactOrganisationSearchController from './employments/organisation-search/createContactOrganisationSearchController'
import OrganisationsService from '../../../services/organisationsService'
import CreateContactCheckEmployerController from './employments/check-employer/createContactCheckEmployerController'
import { checkEmployerSchema } from '../manage/update-employments/check-employer/checkEmployerSchema'
import CreateContactEmploymentStatusController from './employments/employment-status/createContactEmploymentStatusController'
import { employmentStatusSchema } from '../manage/update-employments/employment-status/employmentStatusSchema'
import CreateContactDeleteEmploymentController from './employments/delete-employment/createContactDeleteEmploymentController'
import { ensureInAddContactJourney, resetAddContactJourney } from './addContactMiddleware'

const AddContactRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
  restrictionsService: RestrictionsService,
  prisonerAddressService: PrisonerAddressService,
  organisationsService: OrganisationsService,
) => {
  const router = Router({ mergeParams: true })
  const { get, post } = routerMethods(router, auditService)

  const journeyRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    schema,
    noValidation,
    resetJourney,
  }: {
    path: string
    controller: PageHandler
    schema?: z.ZodTypeAny | SchemaFactory<P>
    noValidation?: boolean
    resetJourney?: boolean
  }) => {
    if (!schema && !noValidation) {
      throw Error('Missing validation schema for POST route')
    }
    const getMiddleware = [
      ensureInAddContactJourney,
      populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ]
    if (resetJourney) {
      getMiddleware.push(resetAddContactJourney)
    }
    get(path, controller, ...getMiddleware)
    if (schema && !noValidation) {
      post(path, controller, ensureInAddContactJourney, validate(schema))
    } else {
      post(path, controller, ensureInAddContactJourney)
    }
  }

  const startController = new StartAddContactJourneyController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/start',
    logPageViewMiddleware(auditService, startController),
    asyncMiddleware(startController.GET),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/search/:journeyId',
    controller: new ContactSearchController(contactsService),
    schema: contactSearchSchema,
    resetJourney: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/add/match/:matchingContactId/:journeyId',
    controller: new ContactMatchController(contactsService, restrictionsService, referenceDataService),
    schema: contactMatchSchema,
    resetJourney: true,
  })

  const modeController = new AddContactModeController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/add/mode/:mode/:journeyId',
    ensureInAddContactJourney,
    logPageViewMiddleware(auditService, modeController),
    asyncMiddleware(modeController.GET),
  )

  const enterNameController = new EnterNameController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, enterNameController),
    asyncMiddleware(enterNameController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId',
    ensureInAddContactJourney,
    validate(fullNameSchema),
    asyncMiddleware(enterNameController.POST),
  )

  const selectRelationshipTypeController = new RelationshipTypeController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship-type/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, selectRelationshipTypeController),
    asyncMiddleware(selectRelationshipTypeController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship-type/:journeyId',
    ensureInAddContactJourney,
    validate(selectRelationshipTypeSchema()),
    asyncMiddleware(selectRelationshipTypeController.POST),
  )

  const selectRelationshipToPrisonerController = new SelectRelationshipToPrisonerController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship-to-prisoner/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, selectRelationshipToPrisonerController),
    asyncMiddleware(selectRelationshipToPrisonerController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship-to-prisoner/:journeyId',
    ensureInAddContactJourney,
    validate(selectRelationshipSchemaFactory()),
    asyncMiddleware(selectRelationshipToPrisonerController.POST),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/emergency-contact-or-next-of-kin/:journeyId',
    controller: new EmergencyContactOrNextOfKinController(),
    schema: optionalEmergencyContactOrNextOfKinSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/approved-to-visit/:journeyId',
    controller: new ApprovedToVisitController(),
    noValidation: true,
  })

  const enterDobController = new CreateContactEnterDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, enterDobController),
    asyncMiddleware(enterDobController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId',
    ensureInAddContactJourney,
    validate(optionalDobSchema),
    asyncMiddleware(enterDobController.POST),
  )

  const enterRelationshipCommentsController = new EnterRelationshipCommentsController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-relationship-comments/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, enterRelationshipCommentsController),
    asyncMiddleware(enterRelationshipCommentsController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-relationship-comments/:journeyId',
    ensureInAddContactJourney,
    validate(enterRelationshipCommentsSchema),
    asyncMiddleware(enterRelationshipCommentsController.POST),
  )

  const checkAnswersController = new CreateContactCheckAnswersController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, checkAnswersController),
    asyncMiddleware(checkAnswersController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId',
    ensureInAddContactJourney,
    asyncMiddleware(checkAnswersController.POST),
  )

  const successfullyAddedContactController = new SuccessfullyAddedContactController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contact/:mode/:contactId/:prisonerContactId/success',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, successfullyAddedContactController),
    asyncMiddleware(successfullyAddedContactController.GET),
  )

  const cancelAddContactController = new CancelAddContactController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/add/cancel/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, cancelAddContactController),
    asyncMiddleware(cancelAddContactController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/add/cancel/:journeyId',
    ensureInAddContactJourney,
    asyncMiddleware(cancelAddContactController.POST),
  )

  const addContactAdditionalInfoController = new AddContactAdditionalInfoController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/add/enter-additional-info/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, addContactAdditionalInfoController),
    asyncMiddleware(addContactAdditionalInfoController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/add/enter-additional-info/:journeyId',
    ensureInAddContactJourney,
    asyncMiddleware(addContactAdditionalInfoController.POST),
  )

  const addPhoneController = new AddContactAddPhoneController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/add-phone-numbers/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, addPhoneController),
    asyncMiddleware(addPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/add-phone-numbers/:journeyId',
    ensureInAddContactJourney,
    validate(optionalPhonesSchema),
    asyncMiddleware(addPhoneController.POST),
  )

  const removePhoneController = new AddContactConfirmDeletePhoneController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/delete-phone-number/:index/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, removePhoneController),
    asyncMiddleware(removePhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/delete-phone-number/:index/:journeyId',
    ensureInAddContactJourney,
    asyncMiddleware(removePhoneController.POST),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/enter-gender/:journeyId',
    controller: new AddContactGenderController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/is-staff/:journeyId',
    controller: new CreateContactIsStaffController(),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/language-and-interpreter/:journeyId',
    controller: new CreateContactLanguageAndInterpreterController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/domestic-status/:journeyId',
    controller: new AddContactDomesticStatusController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/employments/:journeyId',
    controller: new AddEmploymentsController(),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/organisation-search/:journeyId',
    controller: new CreateContactOrganisationSearchController(organisationsService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/check-employer/:journeyId',
    controller: new CreateContactCheckEmployerController(organisationsService),
    schema: checkEmployerSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/employment-status/:journeyId',
    controller: new CreateContactEmploymentStatusController(),
    schema: employmentStatusSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/delete-employment/:journeyId',
    controller: new CreateContactDeleteEmploymentController(),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:journeyId',
    controller: new AddAddressesController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/select-type/:journeyId',
    controller: new CreateContactAddressTypeController(referenceDataService),
    noValidation: true,
  })

  get(
    '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/use-prisoner-address/:journeyId',
    new CreateContactUsePrisonerAddressController(prisonerAddressService),
    ensureInAddContactJourney,
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/enter-address/:journeyId',
    controller: new CreateContactEnterAddressController(referenceDataService),
    schema: addressLinesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/dates/:journeyId',
    controller: new CreateContactAddressDatesController(referenceDataService),
    schema: addressDatesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/primary-or-postal/:journeyId',
    controller: new CreateContactAddressFlagsController(referenceDataService),
    schema: addressFlagsSchema(true),
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/phone/create/:journeyId',
    controller: new CreateContactAddressPhoneController(referenceDataService),
    schema: optionalPhonesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/comments/:journeyId',
    controller: new CreateContactAddressCommentsController(referenceDataService),
    schema: addressCommentsSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/delete/:journeyId',
    controller: new CreateContactDeleteAddressController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/phone/:phoneIdx/delete/:journeyId',
    controller: new CreateContactDeleteAddressPhoneController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/identities/:journeyId',
    controller: new AddContactAddIdentitiesController(referenceDataService),
    schema: optionalIdentitiesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/delete-identity/:index/:journeyId',
    controller: new AddContactConfirmDeleteIdentityController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/emails/:journeyId',
    controller: new AddContactAddEmailsController(),
    schema: optionalEmailsSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/delete-email/:index/:journeyId',
    controller: new AddContactConfirmDeleteEmailController(),
    noValidation: true,
  })

  return router
}

export default AddContactRoutes
