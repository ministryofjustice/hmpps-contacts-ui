import { Router } from 'express'
import { validate } from '../../../middleware/validationMiddleware'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import { ensureInManageContactsJourney, prepareStandaloneManageContactJourney } from './manageContactsMiddleware'
import StartManageContactsJourneyController from './start/startManageContactsJourneyController'
import PrisonerSearchController from './prisoner-search/prisonerSearchController'
import PrisonerSearchResultsController from './prisoner-search/prisonerSearchResultsController'
import { prisonerSearchSchemaFactory } from './prisoner-search/prisonerSearchSchema'
import ListContactsController from './list/listContactsController'
import { ContactsService, PrisonerSearchService } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import populatePrisonerDetailsIfInCaseload from '../../../middleware/populatePrisonerDetailsIfInCaseload'
import ContactDetailsController from './contact-details/contactDetailsController'
import ReferenceDataService from '../../../services/referenceDataService'
import ManageSpokenLanguageController from './spoken-language/manageSpokenLanguageController'
import ManageContactAddPhoneController from './phone/add/manageContactAddPhoneController'
import ManageContactStaffController from './staff/manageContactStaffController'
import { phoneNumberSchemaFactory } from './phone/phoneSchemas'
import ManageInterpreterController from './interpreter/manageInterpreterController'
import ManageContactEditPhoneController from './phone/edit/manageContactEditPhoneController'
import ManageDomesticStatusController from './domestic-status/manageDomesticStatusController'
import ManageContactDeletePhoneController from './phone/delete/manageContactDeletePhoneController'
import { identitySchemaFactory } from './identities/IdentitySchemas'
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
import { emailSchemaFactory } from './email/emailSchemas'
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

const ManageContactsRoutes = (
  auditService: AuditService,
  prisonerSearchService: PrisonerSearchService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  restrictionsService: RestrictionsService,
  prisonerAddressService: PrisonerAddressService,
) => {
  const router = Router({ mergeParams: true })

  // Part 1: Start manage contacts
  const startController = new StartManageContactsJourneyController()
  router.get(
    '/contacts/manage/start',
    logPageViewMiddleware(auditService, startController),
    asyncMiddleware(startController.GET),
  )

  // Part 2: Prisoner search
  const prisonerSearchController = new PrisonerSearchController()
  router.get(
    '/contacts/manage/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchController),
    asyncMiddleware(prisonerSearchController.GET),
  )
  router.post(
    '/contacts/manage/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    validate(prisonerSearchSchemaFactory()),
    asyncMiddleware(prisonerSearchController.POST),
  )

  // Part 3: Prisoner search results
  const prisonerSearchResultsController = new PrisonerSearchResultsController(prisonerSearchService)
  router.get(
    '/contacts/manage/prisoner-search-results/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchResultsController),
    asyncMiddleware(prisonerSearchResultsController.GET),
  )
  router.post(
    '/contacts/manage/prisoner-search-results/:journeyId',
    ensureInManageContactsJourney(),
    validate(prisonerSearchSchemaFactory()),
    asyncMiddleware(prisonerSearchResultsController.POST),
  )

  // Part 4: List contacts for a prisoner
  const listContactsController = new ListContactsController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/list',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, listContactsController),
    asyncMiddleware(listContactsController.GET),
  )

  // Part 5: View one contact
  const contactDetailsController = new ContactDetailsController(
    contactsService,
    referenceDataService,
    restrictionsService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, contactDetailsController),
    asyncMiddleware(contactDetailsController.GET),
  )

  // Part 6: Manage the attribute of one contact (phones, addresses, IDs, emails, restrictions)
  const spokenLanguageController = new ManageSpokenLanguageController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/language',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, spokenLanguageController),
    asyncMiddleware(spokenLanguageController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/language',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(spokenLanguageController.POST),
  )

  const manageInterpreterController = new ManageInterpreterController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageInterpreterController),
    asyncMiddleware(manageInterpreterController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageInterpreterController.POST),
  )

  const manageApprovedToVisitController = new ManageApprovedToVisitController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageApprovedToVisitController),
    asyncMiddleware(manageApprovedToVisitController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageApprovedToVisitController.POST),
  )

  const manageContactStaffController = new ManageContactStaffController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/staff',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactStaffController),
    asyncMiddleware(manageContactStaffController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/staff',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageContactStaffController.POST),
  )

  const manageContactAddPhoneController = new ManageContactAddPhoneController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/create',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactAddPhoneController),
    asyncMiddleware(manageContactAddPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/create',
    prepareStandaloneManageContactJourney(),
    validate(phoneNumberSchemaFactory()),
    asyncMiddleware(manageContactAddPhoneController.POST),
  )

  const manageContactEditPhoneController = new ManageContactEditPhoneController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/edit',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactEditPhoneController),
    asyncMiddleware(manageContactEditPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/edit',
    prepareStandaloneManageContactJourney(),
    validate(phoneNumberSchemaFactory()),
    asyncMiddleware(manageContactEditPhoneController.POST),
  )

  const manageContactDeletePhoneController = new ManageContactDeletePhoneController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/delete',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactDeletePhoneController),
    asyncMiddleware(manageContactDeletePhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/delete',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageContactDeletePhoneController.POST),
  )

  const manageContactAddIdentityController = new ManageContactAddIdentityController(
    contactsService,
    referenceDataService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/create',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactAddIdentityController),
    asyncMiddleware(manageContactAddIdentityController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/create',
    prepareStandaloneManageContactJourney(),
    validate(identitySchemaFactory()),
    asyncMiddleware(manageContactAddIdentityController.POST),
  )

  const manageContactEditIdentityController = new ManageContactEditIdentityController(
    contactsService,
    referenceDataService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactEditIdentityController),
    asyncMiddleware(manageContactEditIdentityController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit',
    prepareStandaloneManageContactJourney(),
    validate(identitySchemaFactory()),
    asyncMiddleware(manageContactEditIdentityController.POST),
  )

  const manageContactDeleteIdentityController = new ManageContactDeleteIdentityController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/delete',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactDeleteIdentityController),
    asyncMiddleware(manageContactDeleteIdentityController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/delete',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageContactDeleteIdentityController.POST),
  )

  const manageDomesticStatusController = new ManageDomesticStatusController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageDomesticStatusController),
    asyncMiddleware(manageDomesticStatusController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageDomesticStatusController.POST),
  )

  const manageContactUpdateDateOfBirthController = new ManageContactEnterDobController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactUpdateDateOfBirthController),
    asyncMiddleware(manageContactUpdateDateOfBirthController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob',
    prepareStandaloneManageContactJourney(),
    validate(enterDobSchema()),
    asyncMiddleware(manageContactUpdateDateOfBirthController.POST),
  )

  const manageGenderController = new ManageGenderController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/gender',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageGenderController),
    asyncMiddleware(manageGenderController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/gender',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageGenderController.POST),
  )

  const updateNameController = new UpdateNameController(referenceDataService, contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/name',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, updateNameController),
    asyncMiddleware(updateNameController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/name',
    prepareStandaloneManageContactJourney(),
    validate(restrictedEditingNameSchema()),
    asyncMiddleware(updateNameController.POST),
  )

  const manageEmergencyContactStatusController = new ManageEmergencyContactController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    prepareStandaloneManageContactJourney(),
    logPageViewMiddleware(auditService, manageEmergencyContactStatusController),
    asyncMiddleware(manageEmergencyContactStatusController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageEmergencyContactStatusController.POST),
  )

  const updateRelationshipController = new ManageContactRelationshipController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-relationship',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, updateRelationshipController),
    asyncMiddleware(updateRelationshipController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-relationship',
    prepareStandaloneManageContactJourney(),
    validate(selectRelationshipSchemaFactory()),
    asyncMiddleware(updateRelationshipController.POST),
  )

  const manageAddressesController = new ManageAddressesController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/view-addresses',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageAddressesController),
    asyncMiddleware(manageAddressesController.GET),
  )

  const manageNextOfKinContactController = new ManageNextOfKinContactController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/next-of-kin',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    prepareStandaloneManageContactJourney(),
    logPageViewMiddleware(auditService, manageNextOfKinContactController),
    asyncMiddleware(manageNextOfKinContactController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/next-of-kin',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageNextOfKinContactController.POST),
  )

  const manageRelationshipStatusController = new ManageRelationshipStatusController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    prepareStandaloneManageContactJourney(),
    logPageViewMiddleware(auditService, manageRelationshipStatusController),
    asyncMiddleware(manageRelationshipStatusController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageRelationshipStatusController.POST),
  )

  const manageContactAddEmailController = new ManageContactAddEmailController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/create',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactAddEmailController),
    asyncMiddleware(manageContactAddEmailController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/create',
    prepareStandaloneManageContactJourney(),
    validate(emailSchemaFactory()),
    asyncMiddleware(manageContactAddEmailController.POST),
  )

  const manageContactEditEmailController = new ManageContactEditEmailController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/edit',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactEditEmailController),
    asyncMiddleware(manageContactEditEmailController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/edit',
    prepareStandaloneManageContactJourney(),
    validate(emailSchemaFactory()),
    asyncMiddleware(manageContactEditEmailController.POST),
  )

  const manageContactDeleteEmailController = new ManageContactDeleteEmailController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/delete',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactDeleteEmailController),
    asyncMiddleware(manageContactDeleteEmailController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/delete',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageContactDeleteEmailController.POST),
  )

  const manageRelationshipCommentsController = new ManageRelationshipCommentsController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-comments',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    prepareStandaloneManageContactJourney(),
    logPageViewMiddleware(auditService, manageRelationshipCommentsController),
    asyncMiddleware(manageRelationshipCommentsController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-comments',
    prepareStandaloneManageContactJourney(),
    validate(enterRelationshipCommentsSchema()),
    asyncMiddleware(manageRelationshipCommentsController.POST),
  )

  // Addresses
  const startAddressJourneyController = new StartAddressJourneyController(contactsService)
  // Add
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/add/start',
    logPageViewMiddleware(auditService, startAddressJourneyController),
    asyncMiddleware(startAddressJourneyController.GET),
  )
  // Edit
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/edit/:contactAddressId/start',
    logPageViewMiddleware(auditService, startAddressJourneyController),
    asyncMiddleware(startAddressJourneyController.GET),
  )

  const addressTypeController = new AddressTypeController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/select-type/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddressJourney(),
    logPageViewMiddleware(auditService, addressTypeController),
    asyncMiddleware(addressTypeController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/select-type/:journeyId',
    ensureInAddressJourney(),
    validate(addressTypeSchema()),
    asyncMiddleware(addressTypeController.POST),
  )

  const enterAddressController = new EnterAddressController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/enter-address/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddressJourney(),
    logPageViewMiddleware(auditService, enterAddressController),
    asyncMiddleware(enterAddressController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/enter-address/:journeyId',
    ensureInAddressJourney(),
    validate(addressLinesSchema()),
    asyncMiddleware(enterAddressController.POST),
  )

  const usePrisonerAddressController = new UsePrisonerAddressController(prisonerAddressService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/use-prisoner-address/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddressJourney(),
    logPageViewMiddleware(auditService, usePrisonerAddressController),
    asyncMiddleware(usePrisonerAddressController.GET),
  )

  const addressMetadataController = new AddressMetadataController(referenceDataService, contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/address-metadata/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddressJourney(),
    logPageViewMiddleware(auditService, addressMetadataController),
    asyncMiddleware(addressMetadataController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/address-metadata/:journeyId',
    ensureInAddressJourney(),
    validate(addressMetadataSchema()),
    asyncMiddleware(addressMetadataController.POST),
  )

  const addressCheckAnswersController = new AddressCheckAnswersController(referenceDataService, contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/check-answers/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddressJourney(),
    logPageViewMiddleware(auditService, addressCheckAnswersController),
    asyncMiddleware(addressCheckAnswersController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/check-answers/:journeyId',
    ensureInAddressJourney(),
    asyncMiddleware(addressCheckAnswersController.POST),
  )

  const manageContactAddAddressPhoneController = new ManageContactAddAddressPhoneController(
    contactsService,
    referenceDataService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/create',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactAddAddressPhoneController),
    asyncMiddleware(manageContactAddAddressPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/create',
    prepareStandaloneManageContactJourney(),
    validate(phoneNumberSchemaFactory()),
    asyncMiddleware(manageContactAddAddressPhoneController.POST),
  )

  const manageContactEditAddressPhoneController = new ManageContactEditAddressPhoneController(
    contactsService,
    referenceDataService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/:contactAddressPhoneId/edit',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactEditAddressPhoneController),
    asyncMiddleware(manageContactEditAddressPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/:contactAddressPhoneId/edit',
    prepareStandaloneManageContactJourney(),
    validate(phoneNumberSchemaFactory()),
    asyncMiddleware(manageContactEditAddressPhoneController.POST),
  )

  const manageContactDeleteAddressPhoneController = new ManageContactDeleteAddressPhoneController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/:contactAddressPhoneId/delete',
    prepareStandaloneManageContactJourney(),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, manageContactDeleteAddressPhoneController),
    asyncMiddleware(manageContactDeleteAddressPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/address/:contactAddressId/phone/:contactAddressPhoneId/delete',
    prepareStandaloneManageContactJourney(),
    asyncMiddleware(manageContactDeleteAddressPhoneController.POST),
  )

  return router
}

export default ManageContactsRoutes
