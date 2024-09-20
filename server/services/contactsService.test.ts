import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ContactsService from './contactsService'
import CreateContactJourney = journeys.CreateContactJourney
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import IsOverEighteenOptions = journeys.YesNoOrDoNotKnow

jest.mock('../data/contactsApiClient')

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
        returnPoint: { type: 'HOME', url: '/foo-bar' },
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
      const journey: CreateContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'HOME', url: '/foo-bar' },
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
      const journey: CreateContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'HOME', url: '/foo-bar' },
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
            returnPoint: { type: 'HOME', url: '/foo-bar' },
            names: { firstName: 'first', lastName: 'last' },
            dateOfBirth: { isKnown: 'NO' },
            relationship: { type: 'MOT', isEmergencyContact: 'YES', isNextOfKin: 'NO' },
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })
})
