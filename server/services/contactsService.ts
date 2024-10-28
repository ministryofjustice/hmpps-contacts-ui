import ContactsApiClient from '../data/contactsApiClient'
import { components } from '../@types/contactsApi'
import AddContactJourney = journeys.AddContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import Pageable = contactsApiClientTypes.Pageable
import AddContactRelationshipRequest = contactsApiClientTypes.AddContactRelationshipRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import PrisonerContactSummaryPage = contactsApiClientTypes.PrisonerContactSummaryPage
import GetContactResponse = contactsApiClientTypes.GetContactResponse
import CreatePhoneRequest = contactsApiClientTypes.CreatePhoneRequest

type PageableObject = components['schemas']['PageableObject']
export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: AddContactJourney, user: Express.User): Promise<Contact> {
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
      middleNames: journey.names.middleNames,
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

  async addContact(journey: AddContactJourney, user: Express.User): Promise<Contact> {
    const request: AddContactRelationshipRequest = {
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipCode: journey.relationship.type,
        isNextOfKin: journey.relationship.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship.isEmergencyContact === 'YES',
        comments: journey.relationship.comments,
      },
      createdBy: user.username,
    }
    return this.contactsApiClient.addContactRelationship(journey.contactId, request, user)
  }

  async getPrisonerContacts(
    prisonerNumber: string,
    active: boolean,
    user: Express.User,
    pagination: PageableObject,
  ): Promise<PrisonerContactSummaryPage[]> {
    return this.contactsApiClient.getPrisonerContacts(prisonerNumber, active, user, pagination)
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    pagination: Pageable,
    user: Express.User,
  ): Promise<ContactSearchResultItemPage> {
    return this.contactsApiClient.searchContact(contactSearchRequest, user, pagination)
  }

  async getContact(contactId: number, user: Express.User): Promise<GetContactResponse> {
    return this.contactsApiClient.getContact(contactId, user)
  }

  async createContactPhone(
    contactId: number,
    user: Express.User,
    type: string,
    phoneNumber: string,
    extension?: string,
  ) {
    const request: CreatePhoneRequest = {
      phoneType: type,
      phoneNumber,
      extNumber: extension,
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactPhone(contactId, request, user)
  }
}
