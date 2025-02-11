import { RequestHandler, Router } from 'express'
import { z } from 'zod'
import { SchemaFactory, validate } from '../../../middleware/validationMiddleware'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import { ensureInManageContactsJourney, prepareStandaloneManageContactJourney } from './manageContactsMiddleware'
import StartManageContactsJourneyController from './start/startManageContactsJourneyController'
import PrisonerSearchController from './prisoner-search/prisonerSearchController'
import PrisonerSearchResultsController from './prisoner-search/prisonerSearchResultsController'
import { prisonerSearchSchema } from './prisoner-search/prisonerSearchSchema'
import ListContactsController from './list/listContactsController'
import { ContactsService, PrisonerSearchService } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import populatePrisonerDetailsIfInCaseload from '../../../middleware/populatePrisonerDetailsIfInCaseload'
import ContactDetailsController from './contact-details/contactDetailsController'
import ReferenceDataService from '../../../services/referenceDataService'
import ManageSpokenLanguageController from './spoken-language/manageSpokenLanguageController'
import ManageContactAddPhoneController from './phone/add/manageContactAddPhoneController'
import ManageContactStaffController from './staff/manageContactStaffController'
import { phoneNumberSchema } from './phone/phoneSchemas'
import ManageInterpreterController from './interpreter/manageInterpreterController'
import ManageContactEditPhoneController from './phone/edit/manageContactEditPhoneController'
import ManageDomesticStatusController from './domestic-status/manageDomesticStatusController'
import ManageContactDeletePhoneController from './phone/delete/manageContactDeletePhoneController'
import { identitySchema } from './identities/IdentitySchemas'
import ManageContactAddIdentityController from './identities/add/manageContactAddIdentityController'
import ManageContactEditIdentityController from './identities/edit/manageContactEditIdentityController'
import ManageContactDeleteIdentityController from './identities/delete/manageContactDeleteIdentityController'
import { enterDobSchema } from '../common/enter-dob/enterDobSchemas'
import ManageContactEnterDobController from './update-dob/manageContactEnterDobController'
import ManageGenderController from './gender/contactGenderController'
import UpdateNameController from './name/updateNameController'
import ManageRelationshipCommentsController from './relationship/manageRelationshipCommentsController'
import { restrictedEditingNameSchema } from '../common/name/nameSchemas'
import ManageContactAddEmailController from './email/add/manageContactAddEmailController'
import ManageContactEditEmailController from './email/edit/manageContactEditEmailController'
import { emailSchema } from './email/emailSchemas'
import ManageEmergencyContactController from './relationship/manageEmergencyContactController'
import ManageContactRelationshipController from './relationship/manageContactRelationshipController'
import { selectRelationshipSchemaFactory } from '../common/relationship/selectRelationshipSchemas'
import ManageNextOfKinContactController from './relationship/manageNextOfKinContactController'
import ManageContactDeleteEmailController from './email/delete/manageContactDeleteEmailController'
import { enterRelationshipCommentsSchema } from '../add/relationship-comments/enterRelationshipCommentsSchemas'
import ManageAddressesController from './addresses/manageAddressesController'
import StartAddressJourneyController from './addresses/start/startAddressJourneyController'
import AddressTypeController from './addresses/address-type/addressTypeController'
import ensureInAddressJourney from './addresses/addressesMiddleware'
import { addressTypeSchema } from './addresses/address-type/addressTypeSchemas'
import EnterAddressController from './addresses/enter-address/enterAddressController'
import { addressLinesSchema } from './addresses/enter-address/addressLinesSchemas'
import AddressMetadataController from './addresses/address-metadata/addressMetadataController'
import { addressMetadataSchema } from './addresses/address-metadata/addressMetadataSchemas'
import AddressCheckAnswersController from './addresses/address-check-answers/addressCheckAnswersController'
import RestrictionsService from '../../../services/restrictionsService'
import ManageApprovedToVisitController from './approved-to-visit/manageApprovedToVisitController'
import ManageRelationshipStatusController from './relationship/manageRelationshipStatusController'
import ManageContactAddAddressPhoneController from './phone/add-address-phone/manageContactAddAddressPhoneController'
import ManageContactEditAddressPhoneController from './phone/edit-address-phone/manageContactEditAddressPhoneController'
import ManageContactDeleteAddressPhoneController from './phone/delete-address-phone/manageContactDeleteAddressPhoneController'
import UsePrisonerAddressController from './addresses/use-prisoner-address/usePrisonerAddressController'
import PrisonerAddressService from '../../../services/prisonerAddressService'
import { PageHandler } from '../../../interfaces/pageHandler'
import UpdateEmploymentsController from './update-employments/updateEmploymentsController'
import {
  ensureInUpdateEmploymentsJourney,
  ensureValidEmploymentIdx,
} from './update-employments/updateEmploymentsMiddleware'
import UpdateEmploymentsStartController from './update-employments/start/updateEmploymentsStartController'
import OrganisationSearchController from './update-employments/organisation-search/organisationSearchController'
import OrganisationsService from '../../../services/organisationsService'
import EditContactDetailsController from './edit-contact-details/editContactDetailsController'
import CheckEmployerController from './update-employments/check-employer/checkEmployerController'
import { checkEmployerSchema } from './update-employments/check-employer/checkEmployerSchema'

const ManageContactsRoutes = (
  auditService: AuditService,
  prisonerSearchService: PrisonerSearchService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  restrictionsService: RestrictionsService,
  prisonerAddressService: PrisonerAddressService,
  organisationsService: OrganisationsService,
) => {
  const router = Router({ mergeParams: true })

  const get = <P extends { [key: string]: string }>(
    path: string,
    controller: PageHandler,
    ...handlers: (RequestHandler | RequestHandler<P>)[]
  ) => router.get(path, ...handlers, logPageViewMiddleware(auditService, controller), asyncMiddleware(controller.GET))
  const post = <P extends { [key: string]: string }>(
    path: string,
    controller: PageHandler,
    ...handlers: (RequestHandler<P> | RequestHandler<journeys.PrisonerJourneyParams>)[]
  ) => router.post(path, ...(handlers as RequestHandler[]), asyncMiddleware(controller.POST!))

  const standAloneJourneyRoute = <P extends { [key: string]: string }>({
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
    get(path, controller, prepareStandaloneManageContactJourney)
    if (schema) {
      post(path, controller, prepareStandaloneManageContactJourney, validate(schema))
    } else {
      post(path, controller, prepareStandaloneManageContactJourney)
    }
  }

  const journeyRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    journeyEnsurer,
    schema,
    noValidation,
  }: {
    path: string
    controller: PageHandler
    journeyEnsurer: RequestHandler<P> | (RequestHandler<P> | RequestHandler)[]
    schema?: z.ZodTypeAny | SchemaFactory<P>
    noValidation?: boolean
  }) => {
    if (!schema && !noValidation) {
      throw Error('Missing validation schema for POST route')
    }

    const journeyMiddleware = Array.isArray(journeyEnsurer) ? journeyEnsurer : [journeyEnsurer]

    get(path, controller, ...journeyMiddleware)
    if (schema) {
      post(path, controller, ...journeyMiddleware, validate(schema))
    } else {
      post(path, controller, ...journeyMiddleware)
    }
  }

  router.get('/prisoner/:prisonerNumber/*', populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService))

  // Part 1: Start manage contacts
  get('/contacts/manage/start', new StartManageContactsJourneyController())

  // Part 2: Prisoner search
  journeyRoute({
    path: '/contacts/manage/prisoner-search/:journeyId',
    controller: new PrisonerSearchController(),
    journeyEnsurer: ensureInManageContactsJourney,
    schema: prisonerSearchSchema,
  })

  // Part 3: Prisoner search results
  journeyRoute({
    path: '/contacts/manage/prisoner-search/:journeyId',
    controller: new PrisonerSearchController(),
    journeyEnsurer: ensureInManageContactsJourney,
    schema: prisonerSearchSchema,
  })

  journeyRoute({
    path: '/contacts/manage/prisoner-search-results/:journeyId',
    controller: new PrisonerSearchResultsController(prisonerSearchService),
    journeyEnsurer: ensureInManageContactsJourney,
    schema: prisonerSearchSchema,
  })

  // Part 4: List contacts for a prisoner
  get('/prisoner/:prisonerNumber/contacts/list', new ListContactsController(contactsService))

  // Part 5: View one contact
  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId',
    new ContactDetailsController(contactsService, referenceDataService, restrictionsService),
  )

  // Part 6: Manage the attribute of one contact (phones, addresses, IDs, emails, restrictions)
  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/language',
    controller: new ManageSpokenLanguageController(contactsService, referenceDataService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter',
    controller: new ManageInterpreterController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit',
    controller: new ManageApprovedToVisitController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/staff',
    controller: new ManageContactStaffController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/create',
    controller: new ManageContactAddPhoneController(contactsService, referenceDataService),
    schema: phoneNumberSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/edit',
    controller: new ManageContactEditPhoneController(contactsService, referenceDataService),
    schema: phoneNumberSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/delete',
    controller: new ManageContactDeletePhoneController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/create',
    controller: new ManageContactAddIdentityController(contactsService, referenceDataService),
    schema: identitySchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit',
    controller: new ManageContactEditIdentityController(contactsService, referenceDataService),
    schema: identitySchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/delete',
    controller: new ManageContactDeleteIdentityController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status',
    controller: new ManageDomesticStatusController(contactsService, referenceDataService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob',
    controller: new ManageContactEnterDobController(contactsService),
    schema: enterDobSchema(),
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/gender',
    controller: new ManageGenderController(contactsService, referenceDataService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/name',
    controller: new UpdateNameController(referenceDataService, contactsService),
    schema: restrictedEditingNameSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact',
    controller: new ManageEmergencyContactController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-relationship',
    controller: new ManageContactRelationshipController(contactsService, referenceDataService),
    schema: selectRelationshipSchemaFactory(),
  })

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/view-addresses',
    new ManageAddressesController(contactsService),
  )

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/next-of-kin',
    controller: new ManageNextOfKinContactController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status',
    controller: new ManageRelationshipStatusController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/create',
    controller: new ManageContactAddEmailController(contactsService),
    schema: emailSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/edit',
    controller: new ManageContactEditEmailController(contactsService),
    schema: emailSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/delete',
    controller: new ManageContactDeleteEmailController(contactsService),
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-comments',
    controller: new ManageRelationshipCommentsController(contactsService),
    schema: enterRelationshipCommentsSchema,
  })

  // Addresses
  const startAddressJourneyController = new StartAddressJourneyController(contactsService)
  // Add
  get('/prisoner/:prisonerNumber/contacts/manage/:contactId/address/add/start', startAddressJourneyController)
  // Edit
  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/edit/:contactAddressId/start',
    startAddressJourneyController,
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/select-type/:journeyId',
    controller: new AddressTypeController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressTypeSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/enter-address/:journeyId',
    controller: new EnterAddressController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressLinesSchema,
  })

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/use-prisoner-address/:journeyId',
    new UsePrisonerAddressController(prisonerAddressService),
    ensureInAddressJourney,
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/address-metadata/:journeyId',
    controller: new AddressMetadataController(referenceDataService, contactsService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressMetadataSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/check-answers/:journeyId',
    controller: new AddressCheckAnswersController(referenceDataService, contactsService),
    journeyEnsurer: ensureInAddressJourney,
    noValidation: true,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/create',
    controller: new ManageContactAddAddressPhoneController(contactsService, referenceDataService),
    schema: phoneNumberSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/:contactAddressPhoneId/edit',
    controller: new ManageContactEditAddressPhoneController(contactsService, referenceDataService),
    schema: phoneNumberSchema,
  })

  standAloneJourneyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/:contactAddressPhoneId/delete',
    controller: new ManageContactDeleteAddressPhoneController(contactsService),
    noValidation: true,
  })

  // Edit employments
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-employments',
    asyncMiddleware(new UpdateEmploymentsStartController(contactsService).GET),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-employments/:journeyId',
    controller: new UpdateEmploymentsController(),
    journeyEnsurer: ensureInUpdateEmploymentsJourney,
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-employments/:employmentIdx/organisation-search/:journeyId',
    controller: new OrganisationSearchController(organisationsService),
    journeyEnsurer: [ensureInUpdateEmploymentsJourney, ensureValidEmploymentIdx],
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-employments/:employmentIdx/check-employer/:journeyId',
    controller: new CheckEmployerController(organisationsService),
    journeyEnsurer: [ensureInUpdateEmploymentsJourney, ensureValidEmploymentIdx],
    schema: checkEmployerSchema,
  })

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-contact-details',
    new EditContactDetailsController(contactsService),
    prepareStandaloneManageContactJourney,
  )

  return router
}

export default ManageContactsRoutes
