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
    it('should create a contact from the journey dto with all fields', async () => {
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
        isOverEighteen: undefined,
        createdBy: 'user1',
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
        isCheckingAnswers: false,
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'No',
          isOverEighteen: 'Do not know',
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: undefined,
        lastName: 'last',
        firstName: 'first',
        middleName: undefined,
        dateOfBirth: undefined,
        isOverEighteen: 'DO_NOT_KNOW',
        createdBy: 'user1',
      }

      // When
      const created = await service.createContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
    })

    it.each([
      ['Yes', 'YES'],
      ['No', 'NO'],
      ['Do not know', 'DO_NOT_KNOW'],
    ])(
      'should map isOverEighteen if dob is not known',
      async (input: 'Yes' | 'No' | 'Do not know', expected: string) => {
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
            isOverEighteen: input,
          },
        }
        const expectedRequest: CreateContactRequest = {
          title: undefined,
          lastName: 'last',
          firstName: 'first',
          middleName: undefined,
          dateOfBirth: undefined,
          isOverEighteen: expected,
          createdBy: 'user1',
        }

        // When
        const created = await service.createContact(journey, user)

        // Then
        expect(created).toStrictEqual(expectedCreated)
        expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
      },
    )
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
