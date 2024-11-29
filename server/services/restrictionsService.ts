import { formatISO, parse } from 'date-fns'
import ContactsApiClient from '../data/contactsApiClient'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import PrisonerContactRestrictionDetails = contactsApiClientTypes.PrisonerContactRestrictionDetails
import CreatePrisonerContactRestrictionRequest = contactsApiClientTypes.CreatePrisonerContactRestrictionRequest
import CreateContactRestrictionRequest = contactsApiClientTypes.CreateContactRestrictionRequest
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails

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
}
