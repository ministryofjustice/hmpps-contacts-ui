import createError, { BadRequest } from 'http-errors'
import { v4 as uuidv4 } from 'uuid'
import ContactsApiClient from '../data/contactsApiClient'
import RestrictionsService from './restrictionsService'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import CreateContactRestrictionRequest = contactsApiClientTypes.CreateContactRestrictionRequest
import PrisonerContactRestrictionDetails = contactsApiClientTypes.PrisonerContactRestrictionDetails
import CreatePrisonerContactRestrictionRequest = contactsApiClientTypes.CreatePrisonerContactRestrictionRequest

jest.mock('../data/contactsApiClient')

describe('referenceDataService', () => {
  const user = { token: 'userToken', username: 'user1' } as Express.User
  let apiClient: jest.Mocked<ContactsApiClient>
  let service: RestrictionsService
  const journey: AddRestrictionJourney = {
    id: uuidv4(),
    lastTouched: new Date().toISOString(),
    restrictionClass: 'PRISONER_CONTACT',
    returnPoint: { url: '/foo' },
    prisonerNumber: 'A1234BC',
    contactId: Number(99),
    prisonerContactId: Number(66),
    contactNames: { firstName: 'First', lastName: 'Last' },
  }

  beforeEach(() => {
    apiClient = new ContactsApiClient() as jest.Mocked<ContactsApiClient>
    service = new RestrictionsService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('createRestriction', () => {
    it('should create global restriction with minimal details', async () => {
      // Given
      const expectedResponse: ContactRestrictionDetails = { contactRestrictionId: 999 }
      apiClient.createContactGlobalRestriction.mockResolvedValue(expectedResponse)
      journey.restrictionClass = 'CONTACT_GLOBAL'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }

      // When
      const created = await service.createRestriction(journey, user)

      // Then
      const expectedRequest: CreateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
        expiryDate: undefined,
        comments: undefined,
        createdBy: 'user1',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createContactGlobalRestriction).toHaveBeenCalledWith(99, expectedRequest, user)
    })

    it('should create global restriction with full details', async () => {
      // Given
      const expectedResponse: ContactRestrictionDetails = { contactRestrictionId: 999 }
      apiClient.createContactGlobalRestriction.mockResolvedValue(expectedResponse)
      journey.restrictionClass = 'CONTACT_GLOBAL'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009', expiryDate: '02/03/2020', comments: 'Some comments' }

      // When
      const created = await service.createRestriction(journey, user)

      // Then
      const expectedRequest: CreateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
        expiryDate: '2020-03-02',
        comments: 'Some comments',
        createdBy: 'user1',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createContactGlobalRestriction).toHaveBeenCalledWith(99, expectedRequest, user)
    })

    it('should handle a bad request creating global restriction', async () => {
      apiClient.createContactGlobalRestriction.mockRejectedValue(createError.BadRequest())
      journey.restrictionClass = 'CONTACT_GLOBAL'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }
      await expect(service.createRestriction(journey, user)).rejects.toBeInstanceOf(BadRequest)
    })

    it('should create prisoner-contact restriction with minimal details', async () => {
      // Given
      const expectedResponse: PrisonerContactRestrictionDetails = { prisonerContactRestrictionId: 999 }
      apiClient.createPrisonerContactRestriction.mockResolvedValue(expectedResponse)
      journey.restrictionClass = 'PRISONER_CONTACT'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }

      // When
      const created = await service.createRestriction(journey, user)

      // Then
      const expectedRequest: CreatePrisonerContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
        expiryDate: undefined,
        comments: undefined,
        createdBy: 'user1',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createPrisonerContactRestriction).toHaveBeenCalledWith(66, expectedRequest, user)
    })

    it('should create global restriction with full details', async () => {
      // Given
      const expectedResponse: PrisonerContactRestrictionDetails = { prisonerContactRestrictionId: 999 }
      apiClient.createPrisonerContactRestriction.mockResolvedValue(expectedResponse)
      journey.restrictionClass = 'PRISONER_CONTACT'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009', expiryDate: '02/03/2020', comments: 'Some comments' }

      // When
      const created = await service.createRestriction(journey, user)

      // Then
      const expectedRequest: CreatePrisonerContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
        expiryDate: '2020-03-02',
        comments: 'Some comments',
        createdBy: 'user1',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createPrisonerContactRestriction).toHaveBeenCalledWith(66, expectedRequest, user)
    })

    it('should handle a bad request creating prisoner-contact restriction', async () => {
      apiClient.createPrisonerContactRestriction.mockRejectedValue(createError.BadRequest())
      journey.restrictionClass = 'PRISONER_CONTACT'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }
      await expect(service.createRestriction(journey, user)).rejects.toBeInstanceOf(BadRequest)
    })
  })
})
