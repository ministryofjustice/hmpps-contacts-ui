import ContactsApiClient from '../data/contactsApiClient'
import CreateContactJourney = journeys.CreateContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: CreateContactJourney, user: Express.User): Promise<Contact> {
    let dateOfBirth: Date
    let isOverEighteen
    if (journey.dateOfBirth.isKnown === 'Yes') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    } else {
      switch (journey.dateOfBirth.isOverEighteen) {
        case 'Yes':
          isOverEighteen = 'YES'
          break
        case 'No':
          isOverEighteen = 'NO'
          break
        case 'Do not know':
          isOverEighteen = 'DO_NOT_KNOW'
          break
        default:
          isOverEighteen = undefined
      }
    }
    const request: CreateContactRequest = {
      title: journey.names.title,
      lastName: journey.names.lastName,
      firstName: journey.names.firstName,
      middleName: journey.names.middleName,
      dateOfBirth,
      isOverEighteen,
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
