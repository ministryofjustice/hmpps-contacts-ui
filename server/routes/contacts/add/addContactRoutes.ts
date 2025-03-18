import { Router } from 'express'
import { z } from 'zod'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import EnterNameController from './enter-name/createContactEnterNameController'
import { SchemaFactory, validate } from '../../../middleware/validationMiddleware'
import { fullNameSchema } from '../common/name/nameSchemas'
import CreateContactEnterDobController from './enter-dob/createContactEnterDobController'
import StartAddContactJourneyController from './start/startAddContactJourneyController'
import ensureInAddContactJourney from './addContactMiddleware'
import { ContactsService, PrisonerAddressService, PrisonerSearchService, RestrictionsService } from '../../../services'
import CreateContactCheckAnswersController from './check-answers/createContactCheckAnswersController'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import ReferenceDataService from '../../../services/referenceDataService'
import SelectRelationshipToPrisonerController from './relationship-to-prisoner/selectRelationshipToPrisonerController'
import { selectRelationshipSchemaFactory } from '../common/relationship/selectRelationshipSchemas'
import populatePrisonerDetailsIfInCaseload from '../../../middleware/populatePrisonerDetailsIfInCaseload'
import EmergencyContactController from './emergency-contact/emergencyContactController'
import { selectEmergencyContactSchema } from './emergency-contact/emergencyContactSchemas'
import { selectNextOfKinSchema } from './next-of-kin/nextOfKinSchemas'
import NextOfKinController from './next-of-kin/nextOfKinController'
import EnterRelationshipCommentsController from './relationship-comments/enterRelationshipCommentsController'
import { enterRelationshipCommentsSchema } from './relationship-comments/enterRelationshipCommentsSchemas'
import ContactSearchController from './contact-search/contactSearchController'
import { contactSearchSchema } from './contact-search/contactSearchSchema'
import { selectToConfirmContactSchema } from './contact-confirmation/contactConfirmationSchema'
import AddContactModeController from './mode/addContactModeController'
import ContactConfirmationController from './contact-confirmation/contactConfirmationController'
import { enterDobSchema } from '../common/enter-dob/enterDobSchemas'
import SuccessfullyAddedContactController from './success/successfullyAddedContactController'
import { selectRelationshipTypeSchema } from './relationship-type/relationshipTypeSchema'
import RelationshipTypeController from './relationship-type/relationshipTypeController'
import CancelAddContactController from './cancel/cancelAddContactController'
import AddContactAdditionalInfoController from './additional-info/addContactAdditionalInfoController'
import AddAddressesController from './addresses/addAddressesController'
import { routerMethods } from '../../../utils/routerMethods'
import { PageHandler } from '../../../interfaces/pageHandler'
import ContactAddressTypeController from './addresses/select-type/contactAddressTypeController'
import { addressTypeSchema } from '../manage/addresses/address-type/addressTypeSchemas'
import ContactUsePrisonerAddressController from './addresses/use-prisoner-address/contactUsePrisonerAddressController'
import ContactEnterAddressController from './addresses/enter-address/contactEnterAddressController'
import { addressLinesSchema } from '../manage/addresses/enter-address/addressLinesSchemas'
import ContactAddressDatesController from './addresses/dates/contactAddressDatesController'
import { addressDatesSchema } from '../manage/addresses/dates/addressDatesSchemas'
import ContactAddressFlagsController from './addresses/primary-or-postal/contactAddressFlagsController'
import { addressFlagsSchema } from '../manage/addresses/primary-or-postal/addressFlagsSchemas'
import ContactAddressPhoneController from './addresses/add-address-phone/contactAddressPhoneController'
import { optionalPhonesSchema } from '../manage/addresses/add-address-phone/AddAddressPhonesSchema'
import ContactAddressCommentsController from './addresses/comments/contactAddressCommentsController'
import { addressCommentsSchema } from '../manage/addresses/comments/addressCommentsSchema'
import ContactDeleteAddressController from './addresses/delete/contactDeleteAddressController'
import ContactDeleteAddressPhoneController from './addresses/delete-address-phone/contactDeleteAddressPhoneController'
import AddContactAddPhoneController from './phone/addContactAddPhoneController'
import { optionalPhonesSchema } from '../manage/addresses/add-address-phone/AddAddressPhonesSchema'
import AddContactConfirmDeletePhoneController from './phone/addContactConfirmDeletePhoneController'

const AddContactRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
  restrictionsService: RestrictionsService,
  prisonerAddressService: PrisonerAddressService,
) => {
  const router = Router({ mergeParams: true })
  const { get, post } = routerMethods(router, auditService)

  const journeyRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    schema,
    noValidation,
  }: {
    path: string
    controller: PageHandler
    schema?: z.ZodTypeAny | SchemaFactory<P>
    noValidation?: boolean
  }) => {
    if (!schema && !noValidation) {
      throw Error('Missing validation schema for POST route')
    }
    get(
      path,
      controller,
      ensureInAddContactJourney,
      populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    )
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

  const contactsSearchController = new ContactSearchController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/search/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, contactsSearchController),
    asyncMiddleware(contactsSearchController.GET),
  )

  router.post(
    '/prisoner/:prisonerNumber/contacts/search/:journeyId',
    ensureInAddContactJourney,
    validate(contactSearchSchema()),
    asyncMiddleware(contactsSearchController.POST),
  )

  const contactConfirmationController = new ContactConfirmationController(contactsService, restrictionsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/add/confirmation/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, contactConfirmationController),
    asyncMiddleware(contactConfirmationController.GET),
  )

  router.post(
    '/prisoner/:prisonerNumber/contacts/add/confirmation/:journeyId',
    ensureInAddContactJourney,
    validate(selectToConfirmContactSchema()),
    asyncMiddleware(contactConfirmationController.POST),
  )

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

  const selectEmergencyContact = new EmergencyContactController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-emergency-contact/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, selectEmergencyContact),
    asyncMiddleware(selectEmergencyContact.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-emergency-contact/:journeyId',
    ensureInAddContactJourney,
    validate(selectEmergencyContactSchema()),
    asyncMiddleware(selectEmergencyContact.POST),
  )

  const selectNextOfKinController = new NextOfKinController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-next-of-kin/:journeyId',
    ensureInAddContactJourney,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, selectNextOfKinController),
    asyncMiddleware(selectNextOfKinController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-next-of-kin/:journeyId',
    ensureInAddContactJourney,
    validate(selectNextOfKinSchema()),
    asyncMiddleware(selectNextOfKinController.POST),
  )

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
    validate(enterDobSchema()),
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
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:journeyId',
    controller: new AddAddressesController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/select-type/:journeyId',
    controller: new ContactAddressTypeController(referenceDataService),
    schema: addressTypeSchema,
  })

  get(
    '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/use-prisoner-address/:journeyId',
    new ContactUsePrisonerAddressController(prisonerAddressService),
    ensureInAddContactJourney,
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/enter-address/:journeyId',
    controller: new ContactEnterAddressController(referenceDataService),
    schema: addressLinesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/dates/:journeyId',
    controller: new ContactAddressDatesController(referenceDataService),
    schema: addressDatesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/primary-or-postal/:journeyId',
    controller: new ContactAddressFlagsController(referenceDataService),
    schema: addressFlagsSchema(true),
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/phone/create/:journeyId',
    controller: new ContactAddressPhoneController(referenceDataService),
    schema: optionalPhonesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/comments/:journeyId',
    controller: new ContactAddressCommentsController(referenceDataService),
    schema: addressCommentsSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/delete/:journeyId',
    controller: new ContactDeleteAddressController(referenceDataService),
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/create/addresses/:addressIdx/phone/:phoneIdx/delete/:journeyId',
    controller: new ContactDeleteAddressPhoneController(referenceDataService),
    noValidation: true,
  })

  return router
}

export default AddContactRoutes
