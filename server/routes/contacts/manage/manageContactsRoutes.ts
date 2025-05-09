import { RequestHandler, Router } from 'express'
import { z } from 'zod'
import { SchemaFactory, validate } from '../../../middleware/validationMiddleware'
import AuditService from '../../../services/auditService'
import ListContactsController from './list/listContactsController'
import { ContactsService, PrisonerSearchService } from '../../../services'
import populatePrisonerDetailsIfInCaseload from '../../../middleware/populatePrisonerDetailsIfInCaseload'
import ContactDetailsController from './contact-details/contactDetailsController'
import ReferenceDataService from '../../../services/referenceDataService'
import ManageLanguageAndInterpreterController from './additional-information/language-and-interpreter/manageLanguageAndInterpreterController'
import ManageContactAddPhoneController from './phone/add/manageContactAddPhoneController'
import ManageContactStaffController from './staff/manageContactStaffController'
import { phoneNumberSchema } from './phone/phoneSchemas'
import ManageContactEditPhoneController from './phone/edit/manageContactEditPhoneController'
import ManageDomesticStatusController from './additional-information/domestic-status/manageDomesticStatusController'
import ManageContactDeletePhoneController from './phone/delete/manageContactDeletePhoneController'
import { identitiesSchema, identitySchema } from './identities/IdentitySchemas'
import ManageContactAddIdentityController from './identities/add/manageContactAddIdentityController'
import ManageContactEditIdentityController from './identities/edit/manageContactEditIdentityController'
import ManageContactDeleteIdentityController from './identities/delete/manageContactDeleteIdentityController'
import ManageContactEnterDobController from './update-dob/manageContactEnterDobController'
import ManageGenderController from './gender/contactGenderController'
import ChangeTitleOrMiddleNamesController from './name/changeTitleOrMiddleNamesController'
import ManageRelationshipCommentsController from './relationship/comments/manageRelationshipCommentsController'
import { restrictedEditingNameSchema } from '../common/name/nameSchemas'
import ManageContactAddEmailController from './email/add/manageContactAddEmailController'
import ManageContactEditEmailController from './email/edit/manageContactEditEmailController'
import { emailSchema, emailsSchema } from './email/emailSchemas'
import ManageContactRelationshipToPrisonerController from './relationship/relationship-to-prisoner/manageContactRelationshipToPrisonerController'
import { selectRelationshipSchemaFactory } from '../common/relationship/selectRelationshipSchemas'
import ManageContactDeleteEmailController from './email/delete/manageContactDeleteEmailController'
import { enterRelationshipCommentsSchema } from '../add/relationship-comments/enterRelationshipCommentsSchemas'
import StartAddressJourneyController from './addresses/start/startAddressJourneyController'
import AddressTypeController from './addresses/address-type/addressTypeController'
import ensureInAddressJourney from './addresses/addressesMiddleware'
import { addressTypeSchema } from './addresses/address-type/addressTypeSchemas'
import EnterAddressController from './addresses/enter-address/enterAddressController'
import { addressLinesSchema } from './addresses/enter-address/addressLinesSchemas'
import AddressCheckAnswersController from './addresses/address-check-answers/addressCheckAnswersController'
import RestrictionsService from '../../../services/restrictionsService'
import ManageApprovedToVisitController from './relationship/approved-to-visit/manageApprovedToVisitController'
import ManageRelationshipStatusController from './relationship/status/manageRelationshipStatusController'
import ManageContactAddAddressPhoneController from './addresses/add-address-phone/manageContactAddAddressPhoneController'
import ManageContactEditAddressPhoneController from './addresses/edit-address-phone/manageContactEditAddressPhoneController'
import ManageContactDeleteAddressPhoneController from './addresses/delete-address-phone/manageContactDeleteAddressPhoneController'
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
import EditContactMethodsController from './edit-contact-methods/editContactMethodsController'
import CheckEmployerController from './update-employments/check-employer/checkEmployerController'
import { checkEmployerSchema } from './update-employments/check-employer/checkEmployerSchema'
import { employmentStatusSchema } from './update-employments/employment-status/employmentStatusSchema'
import EmploymentStatusController from './update-employments/employment-status/employmentStatusController'
import DeleteEmploymentController from './update-employments/delete-employment/deleteEmploymentController'
import { updateDobSchema } from './update-dob/manageContactDobSchema'
import { contactGenderSchema } from './gender/contactGenderSchema'
import { manageContactStaffSchema } from './staff/manageContactStaffSchema'
import ChangeRelationshipTypeStartController from './relationship/type/start/changeRelationshipTypeStartController'
import ChangeRelationshipTypeController from './relationship/type/select-new-relationship-type/changeRelationshipTypeController'
import { selectRelationshipTypeSchema } from '../add/relationship-type/relationshipTypeSchema'
import { ensureInChangeRelationshipTypeJourney } from './relationship/type/changeRelationshipTypeMiddleware'
import ChangeRelationshipTypeRelationshipToPrisonerController from './relationship/type/select-new-relationship-to-prisoner/changeRelationshipTypeRelationshipToPrisonerController'
import { manageRelationshipStatusSchema } from './relationship/status/manageRelationshipStatusSchema'
import ManageContactEnterDateOfDeathController from './date-of-death/manageContactEnterDateOfDeathController'
import { dateOfDeathSchema } from './date-of-death/manageContactDateOfDeathSchema'
import ManageContactDeleteDateOfDeathController from './date-of-death/manageContactDeleteDateOfDeathController'
import { manageApprovedToVisitSchema } from './relationship/approved-to-visit/manageApprovedToVisitSchema'
import ManageEmergencyContactOrNextOfKinController from './relationship/emergency-contact-or-next-of-kin/manageEmergencyContactOrNextOfKinController'
import { manageEmergencyContactOrNextOfKinSchema } from './relationship/emergency-contact-or-next-of-kin/manageEmergencyContactOrNextOfKinSchema'
import { manageDomesticStatusSchema } from './additional-information/domestic-status/manageDomesticStatusSchema'
import { manageLanguageAndInterpreterSchema } from './additional-information/language-and-interpreter/manageLanguageAndInterpreterSchema'
import ChangeAddressTypeController from './addresses/address-type/changeAddressTypeController'
import ChangeAddressLinesController from './addresses/enter-address/changeAddressLinesController'
import AddressDatesController from './addresses/dates/addressDatesController'
import { addressDatesSchema } from './addresses/dates/addressDatesSchemas'
import ChangeAddressDatesController from './addresses/dates/changeAddressDatesController'
import AddressFlagsController from './addresses/primary-or-postal/addressFlagsController'
import { addressFlagsSchema } from './addresses/primary-or-postal/addressFlagsSchemas'
import ChangeAddressFlagsController from './addresses/primary-or-postal/changeAddressFlagsController'
import AddressCommentsController from './addresses/comments/addressCommentsController'
import { addressCommentsSchema } from './addresses/comments/addressCommentsSchema'
import ChangeAddressCommentsController from './addresses/comments/changeAddressCommentsController'
import CancelAddAddressController from './addresses/cancel/cancelAddAddressController'
import { optionalPhonesSchema, phonesSchema } from './addresses/add-address-phone/AddAddressPhonesSchema'
import AddressPhoneController from './addresses/add-address-phone/addressPhoneController'
import { routerMethods } from '../../../utils/routerMethods'
import DeleteAddressPhoneController from './addresses/delete-address-phone/deleteAddressPhoneController'
import EditRestrictionsController from './edit-restrictions/editRestrictionsController'
import ChangeRelationshipTypeHandleDuplicateController from './relationship/type/handle-duplicate/changeRelationshipTypeHandleDuplicateController'
import { handleDuplicateRelationshipSchemaFactory } from '../common/relationship/handleDuplicateRelationshipSchemas'

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
  const { get, post } = routerMethods(router, auditService)

  const standAloneRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    schema,
    noValidation,
    prisonerDetailsRequiredOnPost,
  }: {
    path: string
    controller: PageHandler
    schema?: z.ZodTypeAny | SchemaFactory<P>
    noValidation?: boolean
    prisonerDetailsRequiredOnPost?: boolean
  }) => {
    if (!schema && !noValidation) {
      throw Error('Missing validation schema for POST route')
    }
    get(path, controller)

    const postMiddleware: (RequestHandler<P> | RequestHandler)[] = []
    if (schema) {
      postMiddleware.push(validate(schema))
    }
    if (prisonerDetailsRequiredOnPost) {
      postMiddleware.push(populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService) as RequestHandler)
    }
    post(path, controller, ...postMiddleware)
  }

  const journeyRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    journeyEnsurer,
    schema,
    noValidation,
    prisonerDetailsRequiredOnPost,
  }: {
    path: string
    controller: PageHandler
    journeyEnsurer: RequestHandler<P> | (RequestHandler<P> | RequestHandler)[]
    schema?: z.ZodTypeAny | SchemaFactory<P>
    noValidation?: boolean
    prisonerDetailsRequiredOnPost?: boolean
  }) => {
    if (!schema && !noValidation) {
      throw Error('Missing validation schema for POST route')
    }

    const journeyMiddleware = Array.isArray(journeyEnsurer) ? journeyEnsurer : [journeyEnsurer]

    get(path, controller, ...journeyMiddleware)
    const postMiddleware: (RequestHandler<P> | RequestHandler)[] = [...journeyMiddleware]
    if (schema) {
      postMiddleware.push(validate(schema))
    }
    if (prisonerDetailsRequiredOnPost) {
      postMiddleware.push(populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService) as RequestHandler)
    }
    post(path, controller, ...postMiddleware)
  }

  router.get('/prisoner/:prisonerNumber/*any', populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService))

  // List contacts for a prisoner
  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/list',
    controller: new ListContactsController(contactsService),
    noValidation: true,
  })

  // View one contact
  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId',
    new ContactDetailsController(contactsService, restrictionsService, referenceDataService),
  )

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-contact-details',
    new EditContactDetailsController(contactsService),
  )

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-contact-methods',
    new EditContactMethodsController(contactsService, referenceDataService),
  )

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-restrictions',
    new EditRestrictionsController(contactsService, restrictionsService),
  )

  // Contact details (relationship, name, dob, identity docs, etc.)
  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/language-and-interpreter',
    controller: new ManageLanguageAndInterpreterController(contactsService, referenceDataService),
    schema: manageLanguageAndInterpreterSchema,
    prisonerDetailsRequiredOnPost: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit',
    controller: new ManageApprovedToVisitController(contactsService),
    schema: manageApprovedToVisitSchema,
    prisonerDetailsRequiredOnPost: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/staff',
    controller: new ManageContactStaffController(contactsService),
    schema: manageContactStaffSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/create',
    controller: new ManageContactAddIdentityController(contactsService, referenceDataService),
    schema: identitiesSchema(),
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/:contactIdentityId/edit',
    controller: new ManageContactEditIdentityController(contactsService, referenceDataService),
    schema: identitySchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/:contactIdentityId/delete',
    controller: new ManageContactDeleteIdentityController(contactsService),
    noValidation: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/domestic-status',
    controller: new ManageDomesticStatusController(contactsService, referenceDataService),
    schema: manageDomesticStatusSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-dob',
    controller: new ManageContactEnterDobController(contactsService),
    schema: updateDobSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/enter-date-of-death',
    controller: new ManageContactEnterDateOfDeathController(contactsService),
    schema: dateOfDeathSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete-date-of-death',
    controller: new ManageContactDeleteDateOfDeathController(contactsService),
    noValidation: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/gender',
    controller: new ManageGenderController(contactsService, referenceDataService),
    schema: contactGenderSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/change-contact-title-or-middle-names',
    controller: new ChangeTitleOrMiddleNamesController(referenceDataService, contactsService),
    schema: restrictedEditingNameSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact-or-next-of-kin',
    controller: new ManageEmergencyContactOrNextOfKinController(contactsService),
    schema: manageEmergencyContactOrNextOfKinSchema,
    prisonerDetailsRequiredOnPost: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status',
    controller: new ManageRelationshipStatusController(contactsService),
    schema: manageRelationshipStatusSchema,
    prisonerDetailsRequiredOnPost: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-comments',
    controller: new ManageRelationshipCommentsController(contactsService),
    schema: enterRelationshipCommentsSchema,
    prisonerDetailsRequiredOnPost: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-relationship-to-prisoner',
    controller: new ManageContactRelationshipToPrisonerController(contactsService, referenceDataService),
    schema: selectRelationshipSchemaFactory(),
    prisonerDetailsRequiredOnPost: true,
  })

  // Relationship type mini journey
  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/type/start',
    new ChangeRelationshipTypeStartController(contactsService),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/type/select-new-relationship-type/:journeyId',
    controller: new ChangeRelationshipTypeController(),
    schema: selectRelationshipTypeSchema(),
    journeyEnsurer: [ensureInChangeRelationshipTypeJourney],
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/type/select-new-relationship-to-prisoner/:journeyId',
    controller: new ChangeRelationshipTypeRelationshipToPrisonerController(contactsService, referenceDataService),
    schema: selectRelationshipSchemaFactory(),
    journeyEnsurer: [ensureInChangeRelationshipTypeJourney],
    prisonerDetailsRequiredOnPost: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/type/handle-duplicate/:journeyId',
    controller: new ChangeRelationshipTypeHandleDuplicateController(contactsService, referenceDataService),
    schema: handleDuplicateRelationshipSchemaFactory(),
    journeyEnsurer: [ensureInChangeRelationshipTypeJourney],
  })

  // Contact methods (email, phone address)
  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/create',
    controller: new ManageContactAddEmailController(contactsService),
    schema: emailsSchema(),
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/:contactEmailId/edit',
    controller: new ManageContactEditEmailController(contactsService),
    schema: emailSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/:contactEmailId/delete',
    controller: new ManageContactDeleteEmailController(contactsService),
    noValidation: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/phone/create',
    controller: new ManageContactAddPhoneController(contactsService, referenceDataService),
    schema: phonesSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/phone/:contactPhoneId/edit',
    controller: new ManageContactEditPhoneController(contactsService, referenceDataService),
    schema: phoneNumberSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/phone/:contactPhoneId/delete',
    controller: new ManageContactDeletePhoneController(contactsService),
    noValidation: true,
  })

  // Addresses
  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/select-type',
    controller: new ChangeAddressTypeController(contactsService, referenceDataService),
    schema: addressTypeSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/enter-address',
    controller: new ChangeAddressLinesController(contactsService, referenceDataService),
    schema: addressLinesSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/dates',
    controller: new ChangeAddressDatesController(contactsService),
    schema: addressDatesSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/primary-or-postal',
    controller: new ChangeAddressFlagsController(contactsService),
    schema: addressFlagsSchema(false),
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/comments',
    controller: new ChangeAddressCommentsController(contactsService),
    schema: addressCommentsSchema,
  })

  // Add
  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/start',
    new StartAddressJourneyController(contactsService),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/select-type/:journeyId',
    controller: new AddressTypeController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/enter-address/:journeyId',
    controller: new EnterAddressController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressLinesSchema,
  })

  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/use-prisoner-address/:journeyId',
    new UsePrisonerAddressController(prisonerAddressService),
    ensureInAddressJourney,
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/dates/:journeyId',
    controller: new AddressDatesController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressDatesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/primary-or-postal/:journeyId',
    controller: new AddressFlagsController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressFlagsSchema(true),
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/phone/:journeyId',
    controller: new AddressPhoneController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: optionalPhonesSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/phone/:phoneIdx/delete/:journeyId',
    controller: new DeleteAddressPhoneController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/comments/:journeyId',
    controller: new AddressCommentsController(referenceDataService),
    journeyEnsurer: ensureInAddressJourney,
    schema: addressCommentsSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/check-answers/:journeyId',
    controller: new AddressCheckAnswersController(referenceDataService, contactsService),
    journeyEnsurer: ensureInAddressJourney,
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/cancel/:journeyId',
    controller: new CancelAddAddressController(),
    journeyEnsurer: ensureInAddressJourney,
    noValidation: true,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/phone/create',
    controller: new ManageContactAddAddressPhoneController(contactsService, referenceDataService),
    schema: phonesSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/phone/:contactAddressPhoneId/edit',
    controller: new ManageContactEditAddressPhoneController(contactsService, referenceDataService),
    schema: phoneNumberSchema,
  })

  standAloneRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/phone/:contactAddressPhoneId/delete',
    controller: new ManageContactDeleteAddressPhoneController(contactsService),
    noValidation: true,
  })

  // Edit employments
  get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-employments',
    new UpdateEmploymentsStartController(contactsService),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:journeyId',
    controller: new UpdateEmploymentsController(contactsService),
    journeyEnsurer: ensureInUpdateEmploymentsJourney,
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:employmentIdx/organisation-search/:journeyId',
    controller: new OrganisationSearchController(organisationsService),
    journeyEnsurer: [ensureInUpdateEmploymentsJourney, ensureValidEmploymentIdx()],
    noValidation: true,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:employmentIdx/check-employer/:journeyId',
    controller: new CheckEmployerController(organisationsService),
    journeyEnsurer: [ensureInUpdateEmploymentsJourney, ensureValidEmploymentIdx()],
    schema: checkEmployerSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:employmentIdx/employment-status/:journeyId',
    controller: new EmploymentStatusController(),
    journeyEnsurer: [ensureInUpdateEmploymentsJourney, ensureValidEmploymentIdx(false)],
    schema: employmentStatusSchema,
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:employmentIdx/delete-employment/:journeyId',
    controller: new DeleteEmploymentController(),
    journeyEnsurer: [ensureInUpdateEmploymentsJourney, ensureValidEmploymentIdx(false)],
    noValidation: true,
  })

  return router
}

export default ManageContactsRoutes
