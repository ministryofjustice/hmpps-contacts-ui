import { formatISO, parse } from 'date-fns'
import ContactsApiClient from '../data/contactsApiClient'
import { RestrictionSchemaType } from '../routes/restrictions/schema/restrictionSchema'
import sortRestrictions from '../utils/sortGlobalRstrictions'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import PrisonerContactRestrictionDetails = contactsApiClientTypes.PrisonerContactRestrictionDetails
import CreatePrisonerContactRestrictionRequest = contactsApiClientTypes.CreatePrisonerContactRestrictionRequest
import CreateContactRestrictionRequest = contactsApiClientTypes.CreateContactRestrictionRequest
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import UpdateContactRestrictionRequest = contactsApiClientTypes.UpdateContactRestrictionRequest
import UpdatePrisonerContactRestrictionRequest = contactsApiClientTypes.UpdatePrisonerContactRestrictionRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRestrictionsResponse = contactsApiClientTypes.PrisonerContactRestrictionsResponse

export default class RestrictionsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createRestriction(
    journey: AddRestrictionJourney,
    user: Express.User,
  ): Promise<ContactRestrictionDetails | PrisonerContactRestrictionDetails> {
    const { type, startDate, expiryDate, comments } = journey.restriction
    const request: CreatePrisonerContactRestrictionRequest & CreateContactRestrictionRequest = {
      restrictionType: type,
      startDate: formatISO(parse(startDate, 'dd/MM/yyyy', new Date()), { representation: 'date' }),
      expiryDate: expiryDate
        ? formatISO(parse(expiryDate, 'dd/MM/yyyy', new Date()), { representation: 'date' })
        : undefined,
      comments,
      createdBy: user.username,
    }
    switch (journey.restrictionClass) {
      case 'CONTACT_GLOBAL':
        return this.contactsApiClient.createContactGlobalRestriction(journey.contactId, request, user)
      case 'PRISONER_CONTACT':
        return this.contactsApiClient.createPrisonerContactRestriction(journey.prisonerContactId, request, user)
      default:
        return Promise.reject()
    }
  }

  async updateContactGlobalRestriction(
    contactId: number,
    contactRestrictionId: number,
    form: RestrictionSchemaType,
    user: Express.User,
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
    return this.contactsApiClient.updateContactGlobalRestriction(contactId, contactRestrictionId, request, user)
  }

  async updatePrisonerContactRestriction(
    contactId: number,
    prisonerContactRestrictionId: number,
    form: RestrictionSchemaType,
    user: Express.User,
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
    return this.contactsApiClient.updatePrisonerContactRestriction(
      contactId,
      prisonerContactRestrictionId,
      request,
      user,
    )
  }

  async getGlobalRestrictionsEnriched(
    contact: ContactDetails,
    user: Express.User,
  ): Promise<ContactRestrictionDetails[]> {
    const globalRestrictions: ContactRestrictionDetails[] = await this.contactsApiClient.getGlobalContactRestrictions(
      contact.id,
      user,
    )

    return this.enrichRestrictionTitle(globalRestrictions)
  }

  async getPrisonerContactRestrictions(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionsResponse> {
    const restrictionsResponse: PrisonerContactRestrictionsResponse =
      await this.contactsApiClient.getPrisonerContactRestrictions(prisonerContactId, user)

    return {
      prisonerContactRestrictions: sortRestrictions(
        this.enrichRestrictionTitle(restrictionsResponse.prisonerContactRestrictions),
      ),
      contactGlobalRestrictions: sortRestrictions(
        this.enrichRestrictionTitle(restrictionsResponse.contactGlobalRestrictions),
      ),
    }
  }

  private enrichRestrictionTitle(globalRestrictions: ContactRestrictionDetails[]): ContactRestrictionDetails {
    return globalRestrictions.map(item => {
      const expiry = new Date(item.expiryDate)
      const now = new Date()

      if (expiry < now) {
        return {
          ...item,
          restrictionTypeDescription: `${item.restrictionTypeDescription} (expired)`,
        }
      }

      return item
    })
  }
}
