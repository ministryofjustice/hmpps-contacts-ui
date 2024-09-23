import ContactsApiClient from '../data/contactsApiClient'
import CreateContactJourney = journeys.CreateContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import { PaginationRequest } from '../data/prisonerOffenderSearchTypes'

export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: CreateContactJourney, user: Express.User): Promise<Contact> {
    let dateOfBirth: Date
    let isOverEighteen
    if (journey.dateOfBirth.isKnown === 'YES') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    } else {
      switch (journey.dateOfBirth.isOverEighteen) {
        case 'YES':
          isOverEighteen = 'YES'
          break
        case 'NO':
          isOverEighteen = 'NO'
          break
        case 'DO_NOT_KNOW':
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
      estimatedIsOverEighteen: isOverEighteen,
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipCode: journey.relationship.type,
        isNextOfKin: journey.relationship.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship.isEmergencyContact === 'YES',
        comments: journey.relationship.comments,
      },
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

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    pagination: PaginationRequest,
    user: Express.User,
  ): Promise<Contact> {
    return this.contactsApiClient.searchContact(contactSearchRequest, user, pagination)
  }
}
