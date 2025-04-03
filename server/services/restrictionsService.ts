import { formatISO, parse } from 'date-fns'
import ContactsApiClient from '../data/contactsApiClient'
import { RestrictionSchemaType } from '../routes/restrictions/schema/restrictionSchema'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import PrisonerContactRestrictionDetails = contactsApiClientTypes.PrisonerContactRestrictionDetails
import CreatePrisonerContactRestrictionRequest = contactsApiClientTypes.CreatePrisonerContactRestrictionRequest
import CreateContactRestrictionRequest = contactsApiClientTypes.CreateContactRestrictionRequest
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import UpdateContactRestrictionRequest = contactsApiClientTypes.UpdateContactRestrictionRequest
import UpdatePrisonerContactRestrictionRequest = contactsApiClientTypes.UpdatePrisonerContactRestrictionRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRestrictionsResponse = contactsApiClientTypes.PrisonerContactRestrictionsResponse
import AuditService from './auditService'
import AuditedService from './auditedService'

export default class RestrictionsService extends AuditedService {
  constructor(
    private readonly contactsApiClient: ContactsApiClient,
    override readonly auditService: AuditService,
  ) {
    super(auditService)
  }

  async createRestriction(
    journey: AddRestrictionJourney,
    user: Express.User,
    correlationId: string,
  ): Promise<ContactRestrictionDetails | PrisonerContactRestrictionDetails> {
    const { type, startDate, expiryDate, comments } = journey.restriction!
    const request: CreatePrisonerContactRestrictionRequest & CreateContactRestrictionRequest = {
      restrictionType: type,
      startDate: formatISO(parse(startDate!, 'dd/MM/yyyy', new Date()), { representation: 'date' }),
      expiryDate: expiryDate
        ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
        : undefined,
      comments,
      createdBy: user.username,
    }
    switch (journey.restrictionClass) {
      case 'CONTACT_GLOBAL':
        return this.handleAuditEvent(
          this.contactsApiClient.createContactGlobalRestriction(journey.contactId, request, user),
          {
            what: 'API_POST_CONTACT_RESTRICTION',
            who: user.username,
            subjectType: 'CONTACT_RESTRICTION',
            details: { contactId: journey.contactId },
            correlationId,
          },
        )
      case 'PRISONER_CONTACT':
        return this.handleAuditEvent(
          this.contactsApiClient.createPrisonerContactRestriction(journey.prisonerContactId!, request, user),
          {
            what: 'API_POST_CONTACT_RELATIONSHIP_RESTRICTION',
            who: user.username,
            subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
            details: {
              contactId: journey.contactId,
              prisonNumber: journey.prisonerNumber,
              prisonerContactId: journey.prisonerContactId,
            },
            correlationId,
          },
        )
      default:
        return Promise.reject()
    }
  }

  async updateContactGlobalRestriction(
    contactId: number,
    contactRestrictionId: number,
    form: RestrictionSchemaType,
    user: Express.User,
    correlationId: string,
  ): Promise<ContactRestrictionDetails> {
    const { type, startDate, expiryDate, comments } = form
    const request: UpdateContactRestrictionRequest = {
      restrictionType: type,
      startDate: formatISO(parse(startDate, 'dd/MM/yyyy', new Date()), { representation: 'date' }),
      expiryDate: expiryDate
        ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
        : undefined,
      comments,
      updatedBy: user.username,
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updateContactGlobalRestriction(contactId, contactRestrictionId, request, user),
      {
        what: 'API_PUT_CONTACT_RESTRICTION',
        who: user.username,
        subjectType: 'CONTACT_RESTRICTION',
        subjectId: String(contactRestrictionId),
        details: { contactId },
        correlationId,
      },
    )
  }

  async updatePrisonerContactRestriction(
    prisonerContactId: number,
    prisonerContactRestrictionId: number,
    form: RestrictionSchemaType,
    user: Express.User,
    correlationId: string,
  ): Promise<PrisonerContactRestrictionDetails> {
    const { type, startDate, expiryDate, comments } = form
    const request: UpdatePrisonerContactRestrictionRequest = {
      restrictionType: type,
      startDate: formatISO(parse(startDate, 'dd/MM/yyyy', new Date()), { representation: 'date' }),
      expiryDate: expiryDate
        ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
        : undefined,
      comments,
      updatedBy: user.username,
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updatePrisonerContactRestriction(
        prisonerContactId,
        prisonerContactRestrictionId,
        request,
        user,
      ),
      {
        what: 'API_PUT_CONTACT_RELATIONSHIP_RESTRICTION',
        who: user.username,
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        subjectId: String(prisonerContactRestrictionId),
        details: { prisonerContactId },
        correlationId,
      },
    )
  }

  async getGlobalRestrictions(contact: ContactDetails, user: Express.User): Promise<ContactRestrictionDetails[]> {
    return this.contactsApiClient.getGlobalContactRestrictions(contact.id, user)
  }

  async getRelationshipAndGlobalRestrictions(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionsResponse> {
    return this.contactsApiClient.getPrisonerContactRestrictions(prisonerContactId, user)
  }
}
