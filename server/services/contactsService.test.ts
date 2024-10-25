import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ContactsService from './contactsService'
import { PaginationRequest } from '../data/prisonerOffenderSearchTypes'
import TestData from '../routes/testutils/testData'
import { components } from '../@types/contactsApi'
import AddContactJourney = journeys.AddContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import IsOverEighteenOptions = journeys.YesNoOrDoNotKnow
import AddContactRelationshipRequest = contactsApiClientTypes.AddContactRelationshipRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import GetContactResponse = contactsApiClientTypes.GetContactResponse

type Language = components['schemas']['Language']

jest.mock('../data/contactsApiClient')
const searchResult = TestData.contactSearchResultItem()
const contactSearchRequest: ContactSearchRequest = {
  lastName: 'last',
  middleNames: '',
  firstName: 'first',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
}

describe('contactsService', () => {
  const user = { token: 'userToken', username: 'user1' } as Express.User
  const prisonerNumber = 'A1234BC'
  let apiClient: jest.Mocked<ContactsApiClient>
  let service: ContactsService
  beforeEach(() => {
    apiClient = new ContactsApiClient() as jest.Mocked<ContactsApiClient>
    service = new ContactsService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('createContact', () => {
    it('should create a contact from the journey dto with all fields', async () => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        names: {
          title: 'Mr',
          lastName: 'last',
          firstName: 'first',
          middleNames: 'middle',
        },
        dateOfBirth: {
          isKnown: 'YES',
          day: 1,
          month: 6,
          year: 1982,
        },
        relationship: {
          type: 'MOT',
          isEmergencyContact: 'NO',
          isNextOfKin: 'YES',
          comments: 'Some comments about this relationship',
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: 'Mr',
        lastName: 'last',
        firstName: 'first',
        middleNames: 'middle',
        dateOfBirth: new Date('1982-06-01T00:00:00.000Z'),
        estimatedIsOverEighteen: undefined,
        createdBy: 'user1',
        relationship: {
          prisonerNumber,
          relationshipCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some comments about this relationship',
        },
      }

      // When
      const created = await service.createContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
    })

    it('should create a contact from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'NO',
          isOverEighteen: 'DO_NOT_KNOW',
        },
        relationship: {
          type: 'MOT',
          isEmergencyContact: 'YES',
          isNextOfKin: 'NO',
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: undefined,
        lastName: 'last',
        firstName: 'first',
        middleNames: undefined,
        dateOfBirth: undefined,
        estimatedIsOverEighteen: 'DO_NOT_KNOW',
        relationship: {
          prisonerNumber,
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.createContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
    })

    it.each([
      ['YES', 'YES'],
      ['NO', 'NO'],
      ['DO_NOT_KNOW', 'DO_NOT_KNOW'],
    ])('should map isOverEighteen if dob is not known', async (input: IsOverEighteenOptions, expected: string) => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'NO',
          isOverEighteen: input,
        },
        relationship: {
          type: 'MOT',
          isEmergencyContact: 'YES',
          isNextOfKin: 'NO',
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: undefined,
        lastName: 'last',
        firstName: 'first',
        middleNames: undefined,
        dateOfBirth: undefined,
        estimatedIsOverEighteen: expected,
        relationship: {
          prisonerNumber,
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.createContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.createContact.mockRejectedValue(createError.BadRequest())
      await expect(
        service.createContact(
          {
            id: '1',
            lastTouched: new Date().toISOString(),
            prisonerNumber,
            isCheckingAnswers: false,
            returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
            names: { firstName: 'first', lastName: 'last' },
            dateOfBirth: { isKnown: 'NO' },
            relationship: { type: 'MOT', isEmergencyContact: 'YES', isNextOfKin: 'NO' },
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('searchContact', () => {
    const pagination = { page: 0, size: 20 } as PaginationRequest

    it('Retrieves search contact details matching the search criteria', async () => {
      // Given
      const contactResults: ContactSearchResultItemPage = {
        totalPages: 1,
        totalElements: 1,
        first: true,
        last: true,
        size: 20,
        empty: false,
        content: [searchResult],
      }

      // When
      apiClient.searchContact.mockResolvedValue(contactResults)
      const results = await service.searchContact(contactSearchRequest, pagination, user)

      // Then
      expect(results?.content[0].lastName).toEqual(searchResult.lastName)
      expect(results?.content[0].firstName).toEqual(searchResult.firstName)
      expect(results.totalPages).toEqual(1)
      expect(results.totalElements).toEqual(1)
    })

    it('Propagates errors', async () => {
      apiClient.searchContact.mockRejectedValue(new Error('some error'))
      await expect(apiClient.searchContact(contactSearchRequest, user, pagination)).rejects.toEqual(
        new Error('some error'),
      )
    })
  })

  describe('getContact', () => {
    it('Should get the contact', async () => {
      const expectedContact: GetContactResponse = {
        id: 123456,
        lastName: 'last',
        firstName: 'middle',
        middleNames: 'first',
        dateOfBirth: '1980-12-10T00:00:00.000Z',
        createdBy: user.username,
        createdTime: '2024-01-01',
      }
      apiClient.getContact.mockResolvedValue(expectedContact)

      const contact = await service.getContact(123456, user)

      expect(contact).toStrictEqual(expectedContact)
      expect(apiClient.getContact).toHaveBeenCalledWith(123456, user)
    })

    it('Propagates errors', async () => {
      apiClient.getContact.mockRejectedValue(new Error('some error'))
      await expect(apiClient.getContact(123456, user)).rejects.toEqual(new Error('some error'))
    })
  })
  describe('addContact', () => {
    it('should add a contact relationship from the journey dto with all fields', async () => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.addContactRelationship.mockResolvedValue(expectedCreated)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        names: {
          title: 'Mr',
          lastName: 'last',
          firstName: 'first',
          middleNames: 'middle',
        },
        dateOfBirth: {
          isKnown: 'YES',
          day: 1,
          month: 6,
          year: 1982,
        },
        relationship: {
          type: 'MOT',
          isEmergencyContact: 'NO',
          isNextOfKin: 'YES',
          comments: 'Some comments about this relationship',
        },
        contactId: 123456,
      }
      const expectedRequest: AddContactRelationshipRequest = {
        relationship: {
          prisonerNumber,
          relationshipCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some comments about this relationship',
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.addContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.addContactRelationship).toHaveBeenCalledWith(123456, expectedRequest, user)
    })

    it('should add a contact relationship from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.addContactRelationship.mockResolvedValue(expectedCreated)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'NO',
          isOverEighteen: 'DO_NOT_KNOW',
        },
        relationship: {
          type: 'MOT',
          isEmergencyContact: 'YES',
          isNextOfKin: 'NO',
        },
        contactId: 123456,
      }
      const expectedRequest: AddContactRelationshipRequest = {
        relationship: {
          prisonerNumber,
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.addContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.addContactRelationship).toHaveBeenCalledWith(123456, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.addContactRelationship.mockRejectedValue(createError.BadRequest())
      await expect(
        service.addContact(
          {
            id: '1',
            lastTouched: new Date().toISOString(),
            prisonerNumber,
            isCheckingAnswers: false,
            returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
            names: { firstName: 'first', lastName: 'last' },
            dateOfBirth: { isKnown: 'NO' },
            relationship: { type: 'MOT', isEmergencyContact: 'YES', isNextOfKin: 'NO' },
            contactId: 123456,
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('getLanguageReference', () => {
    it('Should get the language reference', async () => {
      const expectedLanguage: Language = {
        languageId: 23,
        nomisCode: 'ENG',
        nomisDescription: 'English',
        isoAlpha2: 'en',
        isoAlpha3: 'eng',
        isoLanguageDesc: 'English',
        displaySequence: 1,
      }
      apiClient.getLanguageReference.mockResolvedValue(expectedLanguage)

      const contact = await service.getLanguageReference(user)

      expect(contact).toStrictEqual(expectedLanguage)
      expect(apiClient.getLanguageReference).toHaveBeenCalledWith(user)
    })

    it('Propagates errors', async () => {
      apiClient.getLanguageReference.mockRejectedValue(new Error('some error'))
      await expect(apiClient.getLanguageReference(user)).rejects.toEqual(new Error('some error'))
    })
  })
})
