import createError, { BadRequest } from 'http-errors'
import { v4 as uuidv4 } from 'uuid'
import ContactsApiClient from '../data/contactsApiClient'
import RestrictionsService from './restrictionsService'
import { RestrictionSchemaType } from '../routes/restrictions/schema/restrictionSchema'
import { MockedService } from '../testutils/mockedServices'
import { AddRestrictionJourney } from '../@types/journeys'
import {
  ContactDetails,
  ContactRestrictionDetails,
  CreateContactRestrictionRequest,
  CreatePrisonerContactRestrictionRequest,
  PrisonerContactRestrictionDetails,
  PrisonerContactRestrictionsResponse,
  UpdateContactRestrictionRequest,
} from '../@types/contactsApiClient'

jest.mock('../data/contactsApiClient')
jest.mock('../services/auditService')

const auditService = MockedService.AuditService()

describe('restrictionsService', () => {
  const user = { token: 'userToken', username: 'user1' } as Express.User
  let apiClient: jest.Mocked<ContactsApiClient>
  let service: RestrictionsService
  const journey: AddRestrictionJourney = {
    id: uuidv4(),
    lastTouched: new Date().toISOString(),
    restrictionClass: 'PRISONER_CONTACT',
    prisonerNumber: 'A1234BC',
    contactId: Number(99),
    prisonerContactId: Number(66),
    contactNames: { firstName: 'First', lastName: 'Last' },
  }

  beforeEach(() => {
    apiClient = new ContactsApiClient() as jest.Mocked<ContactsApiClient>
    service = new RestrictionsService(apiClient, auditService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('createRestriction', () => {
    it('should create global restriction with minimal details', async () => {
      // Given
      const expectedResponse = { contactRestrictionId: 999 }
      apiClient.createContactGlobalRestriction.mockResolvedValue(expectedResponse as ContactRestrictionDetails)
      journey.restrictionClass = 'CONTACT_GLOBAL'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }

      // When
      const created = await service.createRestriction(journey, user, 'correlationId')

      // Then
      const expectedRequest: CreateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createContactGlobalRestriction).toHaveBeenCalledWith(99, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_POST_CONTACT_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RESTRICTION',
        correlationId: 'correlationId',
        details: { contactId: 99, type: 'BAN', startDate: '2009-02-01', expiryDate: null },
      })
    })

    it('should create global restriction with full details', async () => {
      // Given
      const expectedResponse = { contactRestrictionId: 999 }
      apiClient.createContactGlobalRestriction.mockResolvedValue(expectedResponse as ContactRestrictionDetails)
      journey.restrictionClass = 'CONTACT_GLOBAL'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009', expiryDate: '02/03/2020', comments: 'Some comments' }

      // When
      const created = await service.createRestriction(journey, user, 'correlationId')

      // Then
      const expectedRequest: CreateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
        expiryDate: '2020-03-02',
        comments: 'Some comments',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createContactGlobalRestriction).toHaveBeenCalledWith(99, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_POST_CONTACT_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RESTRICTION',
        correlationId: 'correlationId',
        details: { contactId: 99, type: 'BAN', startDate: '2009-02-01', expiryDate: '2020-03-02' },
      })
    })

    it('should handle a bad request creating global restriction', async () => {
      apiClient.createContactGlobalRestriction.mockRejectedValue(createError.BadRequest())
      journey.restrictionClass = 'CONTACT_GLOBAL'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }
      await expect(service.createRestriction(journey, user, 'correlationId')).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_POST_CONTACT_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RESTRICTION',
        correlationId: 'correlationId',
        details: { contactId: 99, statusCode: 400, type: 'BAN', startDate: '2009-02-01', expiryDate: null },
      })
    })

    it('should create prisoner-contact restriction with minimal details', async () => {
      // Given
      const expectedResponse = { prisonerContactRestrictionId: 999 }
      apiClient.createPrisonerContactRestriction.mockResolvedValue(
        expectedResponse as PrisonerContactRestrictionDetails,
      )
      journey.restrictionClass = 'PRISONER_CONTACT'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }

      // When
      const created = await service.createRestriction(journey, user, 'correlationId')

      // Then
      const expectedRequest: CreatePrisonerContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createPrisonerContactRestriction).toHaveBeenCalledWith(66, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_POST_CONTACT_RELATIONSHIP_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        correlationId: 'correlationId',
        details: {
          prisonNumber: 'A1234BC',
          contactId: 99,
          prisonerContactId: 66,
          type: 'BAN',
          startDate: '2009-02-01',
          expiryDate: null,
        },
      })
    })

    it('should create global restriction with full details', async () => {
      // Given
      const expectedResponse = { prisonerContactRestrictionId: 999 }
      apiClient.createPrisonerContactRestriction.mockResolvedValue(
        expectedResponse as PrisonerContactRestrictionDetails,
      )
      journey.restrictionClass = 'PRISONER_CONTACT'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009', expiryDate: '02/03/2020', comments: 'Some comments' }

      // When
      const created = await service.createRestriction(journey, user, 'correlationId')

      // Then
      const expectedRequest: CreatePrisonerContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2009-02-01',
        expiryDate: '2020-03-02',
        comments: 'Some comments',
      }
      expect(created).toStrictEqual(expectedResponse)
      expect(apiClient.createPrisonerContactRestriction).toHaveBeenCalledWith(66, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_POST_CONTACT_RELATIONSHIP_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        correlationId: 'correlationId',
        details: {
          prisonNumber: 'A1234BC',
          contactId: 99,
          prisonerContactId: 66,
          type: 'BAN',
          startDate: '2009-02-01',
          expiryDate: '2020-03-02',
        },
      })
    })

    it('should handle a bad request creating prisoner-contact restriction', async () => {
      apiClient.createPrisonerContactRestriction.mockRejectedValue(createError.BadRequest())
      journey.restrictionClass = 'PRISONER_CONTACT'
      journey.restriction = { type: 'BAN', startDate: '1/2/2009' }
      await expect(service.createRestriction(journey, user, 'correlationId')).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_POST_CONTACT_RELATIONSHIP_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        correlationId: 'correlationId',
        details: {
          prisonNumber: 'A1234BC',
          contactId: 99,
          prisonerContactId: 66,
          statusCode: 400,
          type: 'BAN',
          startDate: '2009-02-01',
          expiryDate: null,
        },
      })
    })
  })

  describe('updateContactGlobalRestriction', () => {
    const contactId = 999
    const restrictionId = 555
    it('should update global restriction with minimal details', async () => {
      // Given
      const expectedResponse = { contactRestrictionId: 999 }
      const form: RestrictionSchemaType = {
        type: 'BAN',
        startDate: '1/2/1999',
        expiryDate: undefined,
        comments: undefined,
      }
      apiClient.updateContactGlobalRestriction.mockResolvedValue(expectedResponse as ContactRestrictionDetails)

      // When
      const updated = await service.updateContactGlobalRestriction(
        contactId,
        restrictionId,
        form,
        user,
        'correlationId',
      )

      // Then
      const expectedRequest: UpdateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '1999-02-01',
      }
      expect(updated).toStrictEqual(expectedResponse)
      expect(apiClient.updateContactGlobalRestriction).toHaveBeenCalledWith(
        contactId,
        restrictionId,
        expectedRequest,
        user,
      )
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RESTRICTION',
        subjectId: '555',
        correlationId: 'correlationId',
        details: {
          contactId: 999,
          type: 'BAN',
          startDate: '1999-02-01',
          expiryDate: null,
        },
      })
    })

    it('should update global restriction with full details', async () => {
      // Given
      const expectedResponse = { contactRestrictionId: 999 }
      const form: RestrictionSchemaType = {
        type: 'BAN',
        startDate: '1/2/1999',
        expiryDate: '2/3/2099',
        comments: 'Comments',
      }
      apiClient.updateContactGlobalRestriction.mockResolvedValue(expectedResponse as ContactRestrictionDetails)

      // When
      const updated = await service.updateContactGlobalRestriction(
        contactId,
        restrictionId,
        form,
        user,
        'correlationId',
      )

      // Then
      const expectedRequest: UpdateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '1999-02-01',
        expiryDate: '2099-03-02',
        comments: 'Comments',
      }
      expect(updated).toStrictEqual(expectedResponse)
      expect(apiClient.updateContactGlobalRestriction).toHaveBeenCalledWith(
        contactId,
        restrictionId,
        expectedRequest,
        user,
      )
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RESTRICTION',
        subjectId: '555',
        correlationId: 'correlationId',
        details: {
          contactId: 999,
          type: 'BAN',
          startDate: '1999-02-01',
          expiryDate: '2099-03-02',
        },
      })
    })

    it('should handle a bad request updating global restriction', async () => {
      const form: RestrictionSchemaType = {
        type: 'BAN',
        startDate: '1/2/1999',
        expiryDate: undefined,
        comments: undefined,
      }

      apiClient.updateContactGlobalRestriction.mockRejectedValue(createError.BadRequest())
      await expect(
        service.updateContactGlobalRestriction(contactId, restrictionId, form, user, 'correlationId'),
      ).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PUT_CONTACT_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RESTRICTION',
        subjectId: '555',
        correlationId: 'correlationId',
        details: {
          contactId: 999,
          statusCode: 400,
          type: 'BAN',
          startDate: '1999-02-01',
          expiryDate: null,
        },
      })
    })
  })

  describe('updatePrisonerContactRestriction', () => {
    const contactId = 999
    const restrictionId = 555
    it('should update prisoner restriction with minimal details', async () => {
      // Given
      const expectedResponse = { prisonerContactRestrictionId: restrictionId }
      const form: RestrictionSchemaType = {
        type: 'BAN',
        startDate: '1/2/1999',
        expiryDate: undefined,
        comments: undefined,
      }
      apiClient.updatePrisonerContactRestriction.mockResolvedValue(
        expectedResponse as PrisonerContactRestrictionDetails,
      )

      // When
      const updated = await service.updatePrisonerContactRestriction(
        contactId,
        restrictionId,
        form,
        user,
        'correlationId',
      )

      // Then
      const expectedRequest: UpdateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '1999-02-01',
      }
      expect(updated).toStrictEqual(expectedResponse)
      expect(apiClient.updatePrisonerContactRestriction).toHaveBeenCalledWith(
        contactId,
        restrictionId,
        expectedRequest,
        user,
      )
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_RELATIONSHIP_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        subjectId: '555',
        correlationId: 'correlationId',
        details: {
          prisonerContactId: 999,
          type: 'BAN',
          startDate: '1999-02-01',
          expiryDate: null,
        },
      })
    })

    it('should update prisoner-contact restriction with full details', async () => {
      // Given
      const expectedResponse = { prisonerContactRestrictionId: restrictionId }
      const form: RestrictionSchemaType = {
        type: 'BAN',
        startDate: '1/2/1999',
        expiryDate: '2/3/2099',
        comments: 'Comments',
      }
      apiClient.updatePrisonerContactRestriction.mockResolvedValue(
        expectedResponse as PrisonerContactRestrictionDetails,
      )

      // When
      const updated = await service.updatePrisonerContactRestriction(
        contactId,
        restrictionId,
        form,
        user,
        'correlationId',
      )

      // Then
      const expectedRequest: UpdateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '1999-02-01',
        expiryDate: '2099-03-02',
        comments: 'Comments',
      }
      expect(updated).toStrictEqual(expectedResponse)
      expect(apiClient.updatePrisonerContactRestriction).toHaveBeenCalledWith(
        contactId,
        restrictionId,
        expectedRequest,
        user,
      )
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_RELATIONSHIP_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        subjectId: '555',
        correlationId: 'correlationId',
        details: {
          prisonerContactId: 999,
          type: 'BAN',
          startDate: '1999-02-01',
          expiryDate: '2099-03-02',
        },
      })
    })

    it('should handle a bad request creating global restriction', async () => {
      const form: RestrictionSchemaType = {
        type: 'BAN',
        startDate: '1/2/1999',
        expiryDate: undefined,
        comments: undefined,
      }

      apiClient.updatePrisonerContactRestriction.mockRejectedValue(createError.BadRequest())
      await expect(
        service.updatePrisonerContactRestriction(contactId, restrictionId, form, user, 'correlationId'),
      ).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PUT_CONTACT_RELATIONSHIP_RESTRICTION',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP_RESTRICTION',
        subjectId: '555',
        correlationId: 'correlationId',
        details: {
          prisonerContactId: 999,
          statusCode: 400,
          type: 'BAN',
          startDate: '1999-02-01',
          expiryDate: null,
        },
      })
    })
  })

  describe('getGlobalRestrictionsEnriched', () => {
    it('should fetch and process contact restrictions correctly', async () => {
      // Arrange
      const contactId = 123456

      const expectedContact: ContactDetails = {
        id: contactId,
        isStaff: false,
        interpreterRequired: false,
        addresses: [],
        phoneNumbers: [],
        emailAddresses: [],
        employments: [],
        identities: [],
        lastName: 'last',
        firstName: 'middle',
        middleNames: 'first',
        dateOfBirth: '1980-12-10T00:00:00.000Z',
        createdBy: user.username,
        createdTime: '2024-01-01',
      }

      const expectedResponse = [
        {
          restrictionTypeDescription: 'No Contact',
          expiryDate: '2053-12-31',
        },
        {
          restrictionTypeDescription: 'Limited Contact',
          expiryDate: '2022-01-01',
        },
      ]

      apiClient.getGlobalContactRestrictions.mockResolvedValue(expectedResponse as ContactRestrictionDetails[])

      // Act
      const result = await service.getGlobalRestrictions(expectedContact, user)

      // Assert
      expect(apiClient.getGlobalContactRestrictions).toHaveBeenCalledWith(contactId, user)

      expect(result).toEqual([
        {
          restrictionTypeDescription: 'No Contact',
          expiryDate: '2053-12-31',
        },
        {
          restrictionTypeDescription: 'Limited Contact',
          expiryDate: '2022-01-01',
        },
      ])
    })
  })

  describe('getPrisonerContactRestrictions', () => {
    it('should fetch and process prisoner contact restrictions correctly', async () => {
      // Arrange
      const prisonerContactId = 123

      const mockRestrictionsResponse = {
        prisonerContactRestrictions: [
          {
            restrictionTypeDescription: 'No Contact',
            expiryDate: '2053-12-31',
          },
          {
            restrictionTypeDescription: 'Limited Contact',
            expiryDate: '2022-01-01',
          },
        ],
        contactGlobalRestrictions: [
          {
            restrictionTypeDescription: 'Estate Wide Ban',
            expiryDate: '2054-01-01',
          },
        ],
      }

      apiClient.getPrisonerContactRestrictions.mockResolvedValue(
        mockRestrictionsResponse as PrisonerContactRestrictionsResponse,
      )

      // Act
      const result = await service.getRelationshipAndGlobalRestrictions(prisonerContactId, user)

      // Assert
      expect(apiClient.getPrisonerContactRestrictions).toHaveBeenCalledWith(prisonerContactId, user)

      expect(result).toEqual({
        prisonerContactRestrictions: [
          {
            restrictionTypeDescription: 'No Contact',
            expiryDate: '2053-12-31',
          },
          {
            restrictionTypeDescription: 'Limited Contact',
            expiryDate: '2022-01-01',
          },
        ],
        contactGlobalRestrictions: [
          {
            restrictionTypeDescription: 'Estate Wide Ban',
            expiryDate: '2054-01-01',
          },
        ],
      })
    })
  })
})
