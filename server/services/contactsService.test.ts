import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ContactsService from './contactsService'
import CreateContactJourney = journeys.CreateContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest

jest.mock('../data/contactsApiClient')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('contactsService', () => {
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
    it('should create a contact from the journey dto', async () => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
      const journey: CreateContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        isCheckingAnswers: false,
        names: {
          title: 'Mr',
          lastName: 'last',
          firstName: 'first',
          middleName: 'middle',
        },
        dateOfBirth: {
          isKnown: 'Yes',
          day: 1,
          month: 6,
          year: 1982,
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: 'Mr',
        lastName: 'last',
        firstName: 'first',
        middleName: 'middle',
        dateOfBirth: new Date('1982-06-01T00:00:00.000Z'),
        createdBy: 'user1',
      }

      // When
      const created = await service.createContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
    })
    it('should create a contact from the journey dto with optional fields', async () => {
      // Given
      const expectedCreated: Contact = {
        id: 2136718213,
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
      const journey: CreateContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        isCheckingAnswers: false,
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'No',
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: undefined,
        lastName: 'last',
        firstName: 'first',
        middleName: undefined,
        dateOfBirth: undefined,
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
            isCheckingAnswers: false,
            names: { firstName: 'first', lastName: 'last' },
            dateOfBirth: { isKnown: 'No' },
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })
})
