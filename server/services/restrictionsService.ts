import { formatISO, parse } from 'date-fns'
import ContactsApiClient from '../data/contactsApiClient'
import { RestrictionSchemaType } from '../routes/restrictions/schema/restrictionSchema'
import AuditService from './auditService'
import AuditedService from './auditedService'
import { AddRestrictionJourney } from '../@types/journeys'
import {
  ContactDetails,
  ContactRestrictionDetails,
  CreateContactRestrictionRequest,
  CreatePrisonerContactRestrictionRequest,
  PrisonerContactRestrictionDetails,
  PrisonerRestrictionDetails,
  PrisonerContactRestrictionsResponse,
  UpdateContactRestrictionRequest,
  UpdatePrisonerContactRestrictionRequest,
} from '../@types/contactsApiClient'

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
    const parsedStartDate = formatISO(parse(startDate!, 'dd/MM/yyyy', new Date()), { representation: 'date' })
    const parsedExpiryDate = expiryDate
      ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
      : undefined
    const request: CreatePrisonerContactRestrictionRequest & CreateContactRestrictionRequest = {
      restrictionType: type,
      startDate: parsedStartDate,
      ...(parsedExpiryDate ? { expiryDate: parsedExpiryDate } : {}),
      ...(comments ? { comments } : {}),
    }

    switch (journey.restrictionClass) {
      case 'CONTACT_GLOBAL':
        return this.handleAuditEvent(
          this.contactsApiClient.createContactGlobalRestriction(journey.contactId, request, user.username),
          {
            what: 'API_POST_CONTACT_RESTRICTION',
            who: user.username,
            subjectType: 'CONTACT_RESTRICTION',
            details: {
              contactId: journey.contactId,
              type,
              startDate: parsedStartDate,
              expiryDate: parsedExpiryDate ?? null,
            },
            correlationId,
          },
        )
      case 'PRISONER_CONTACT':
        return this.handleAuditEvent(
          this.contactsApiClient.createPrisonerContactRestriction(journey.prisonerContactId!, request, user.username),
          {
            what: 'API_POST_CONTACT_RELATIONSHIP_RESTRICTION',
            who: user.username,
            subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
            details: {
              contactId: journey.contactId,
              prisonNumber: journey.prisonerNumber,
              prisonerContactId: journey.prisonerContactId,
              type,
              startDate: parsedStartDate,
              expiryDate: parsedExpiryDate ?? null,
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
    const parsedStartDate = formatISO(parse(startDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
    const parsedExpiryDate = expiryDate
      ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
      : undefined
    const request: UpdateContactRestrictionRequest = {
      restrictionType: type,
      startDate: parsedStartDate,
      ...(parsedExpiryDate ? { expiryDate: parsedExpiryDate } : {}),
      ...(comments ? { comments } : {}),
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updateContactGlobalRestriction(contactId, contactRestrictionId, request, user.username),
      {
        what: 'API_PUT_CONTACT_RESTRICTION',
        who: user.username,
        subjectType: 'CONTACT_RESTRICTION',
        subjectId: String(contactRestrictionId),
        details: { contactId, type, startDate: parsedStartDate, expiryDate: parsedExpiryDate ?? null },
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
    const parsedStartDate = formatISO(parse(startDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
    const parsedExpiryDate = expiryDate
      ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
      : undefined
    const request: UpdatePrisonerContactRestrictionRequest = {
      restrictionType: type,
      startDate: parsedStartDate,
      ...(parsedExpiryDate ? { expiryDate: parsedExpiryDate } : {}),
      ...(comments ? { comments } : {}),
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updatePrisonerContactRestriction(
        prisonerContactId,
        prisonerContactRestrictionId,
        request,
        user.username,
      ),
      {
        what: 'API_PUT_CONTACT_RELATIONSHIP_RESTRICTION',
        who: user.username,
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        subjectId: String(prisonerContactRestrictionId),
        details: { prisonerContactId, type, startDate: parsedStartDate, expiryDate: parsedExpiryDate ?? null },
        correlationId,
      },
    )
  }

  async getGlobalRestrictions(contact: ContactDetails, user: Express.User): Promise<ContactRestrictionDetails[]> {
    return this.contactsApiClient.getGlobalContactRestrictions(contact.id, user.username)
  }

  async getRelationshipAndGlobalRestrictions(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionsResponse> {
    return this.contactsApiClient.getPrisonerContactRestrictions(prisonerContactId, user.username)
  }

  private toPrisonerRestrictionRequest(form: RestrictionSchemaType) {
    const { type, startDate, expiryDate, comments } = form
    const parsedStartDate = formatISO(parse(startDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
    const parsedExpiryDate = expiryDate
      ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
      : undefined
    return {
      request: {
        restrictionType: type,
        effectiveDate: parsedStartDate,
        ...(parsedExpiryDate ? { expiryDate: parsedExpiryDate } : {}),
        ...(comments ? { commentText: comments } : {}),
      },
      details: { type, startDate: parsedStartDate, expiryDate: parsedExpiryDate ?? null },
    }
  }

  async createPrisonerRestriction(
    prisonerNumber: string,
    form: RestrictionSchemaType,
    user: Express.User,
    correlationId: string,
  ): Promise<PrisonerRestrictionDetails> {
    const { request, details } = this.toPrisonerRestrictionRequest(form)
    return this.handleAuditEvent(
      this.contactsApiClient.createPrisonerRestriction(prisonerNumber, request, user.username),
      {
        what: 'API_POST_PRISONER_RESTRICTION',
        who: user.username,
        subjectType: 'PRISONER_RESTRICTION',
        subjectId: prisonerNumber,
        details,
        correlationId,
      },
    )
  }

  async updatePrisonerRestriction(
    prisonerNumber: string,
    prisonerRestrictionId: number,
    form: RestrictionSchemaType,
    user: Express.User,
    correlationId: string,
  ): Promise<PrisonerRestrictionDetails> {
    const { request, details } = this.toPrisonerRestrictionRequest(form)
    return this.handleAuditEvent(
      this.contactsApiClient.updatePrisonerRestriction(prisonerNumber, prisonerRestrictionId, request, user.username),
      {
        what: 'API_PUT_PRISONER_RESTRICTION',
        who: user.username,
        subjectType: 'PRISONER_RESTRICTION',
        subjectId: String(prisonerRestrictionId),
        details: { prisonerNumber, ...details },
        correlationId,
      },
    )
  }

  async closePrisonerRestriction(
    prisonerNumber: string,
    prisonerRestrictionId: number,
    expiryDate: string,
    user: Express.User,
    correlationId: string,
  ): Promise<PrisonerRestrictionDetails> {
    return this.handleAuditEvent(
      this.contactsApiClient.closePrisonerRestriction(
        prisonerNumber,
        prisonerRestrictionId,
        { expiryDate },
        user.username,
      ),
      {
        what: 'API_POST_CLOSE_PRISONER_RESTRICTION',
        who: user.username,
        subjectType: 'PRISONER_RESTRICTION',
        subjectId: String(prisonerRestrictionId),
        details: { prisonerNumber, expiryDate },
        correlationId,
      },
    )
  }
}
