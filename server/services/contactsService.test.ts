import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ContactsService from './contactsService'
import CreateContactJourney = journeys.CreateContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import IsOverEighteenOptions = journeys.YesNoOrDoNotKnow
import { PaginationRequest } from '../data/prisonerOffenderSearchTypes'
import TestData from '../routes/testutils/testData'

jest.mock('../data/contactsApiClient')
const contacts = TestData.contacts()
const contactSearchRequest: ContactSearchRequest = {
  lastName: 'last',
  middleName: '',
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
      const journey: CreateContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        names: {
          title: 'Mr',
          lastName: 'last',
          firstName: 'first',
          middleName: 'middle',
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
        middleName: 'middle',
        dateOfBirth: new Date('1982-06-01T00:00:00.000Z'),
        isOverEighteen: undefined,
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
      const journey: CreateContactJourney = {
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
        middleName: undefined,
        dateOfBirth: undefined,
        isOverEighteen: 'DO_NOT_KNOW',
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
      const journey: CreateContactJourney = {
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
        middleName: undefined,
        dateOfBirth: undefined,
        isOverEighteen: expected,
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
      const contactResults = {
        totalPages: 1,
        totalElements: 1,
        first: true,
        last: true,
        size: 20,
        empty: false,
        content: [contacts],
      } as ContactSearchRequest

      // When
      await apiClient.searchContact.mockResolvedValue(contactResults)
      const results = await service.searchContact(contactSearchRequest, pagination, user)

      // Then
      expect(results?.content[0].lastName).toEqual(contacts.lastName)
      expect(results?.content[0].firstName).toEqual(contacts.firstName)
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
})
