import ContactsApiClient from '../data/contactsApiClient'
import CreateContactJourney = journeys.CreateContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: CreateContactJourney, user: Express.User): Promise<Contact> {
    let dateOfBirth: Date
    if (journey.dateOfBirth.isKnown === 'Yes') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    }
    const request: CreateContactRequest = {
      title: journey.names.title,
      lastName: journey.names.lastName,
      firstName: journey.names.firstName,
      middleName: journey.names.middleName,
      dateOfBirth,
      createdBy: user.username,
    }
    return this.contactsApiClient.createContact(request, user)
  }

  async getPrisonerContacts(
    prisonerNumber: string,
    active: boolean,
    user: Express.User,
  ): Promise<PrisonerContactSummary[]> {
    return this.contactsApiClient.getPrisonerContacts(prisonerNumber, active, user)
  }
}
