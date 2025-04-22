import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ContactsService from './contactsService'
import { PaginationRequest } from '../data/prisonerOffenderSearchTypes'
import TestData from '../routes/testutils/testData'
import { MockedService } from '../testutils/mockedServices'
import {
  AddContactRelationshipRequest,
  ContactAddressDetails,
  ContactAddressPhoneDetails,
  ContactCreationResult,
  ContactDetails,
  ContactEmailDetails,
  ContactPhoneDetails,
  ContactSearchRequest,
  CreateContactAddressRequest,
  CreateContactRequest,
  CreateMultipleEmailsRequest,
  PagedModelContactSearchResultItem,
  PatchContactAddressRequest,
  PatchContactRequest,
  PatchRelationshipRequest,
  PrisonerContactRelationshipDetails,
  UpdateContactAddressPhoneRequest,
  UpdateEmailRequest,
  UpdatePhoneRequest,
} from '../@types/contactsApiClient'
import { AddContactJourney, AddressJourney, LanguageAndInterpreterRequiredForm, YesOrNo } from '../@types/journeys'

jest.mock('../data/contactsApiClient')
jest.mock('../services/auditService')
const searchResult = TestData.contactSearchResultItem()
const contactSearchRequest: ContactSearchRequest = {
  lastName: 'last',
  middleNames: '',
  firstName: 'first',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
}

const auditService = MockedService.AuditService()

describe('contactsService', () => {
  const user = { token: 'userToken', username: 'user1' } as Express.User
  const prisonerNumber = 'A1234BC'
  let apiClient: jest.Mocked<ContactsApiClient>
  let service: ContactsService
  beforeEach(() => {
    apiClient = new ContactsApiClient() as jest.Mocked<ContactsApiClient>
    service = new ContactsService(apiClient, auditService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('createContact', () => {
    it.each([
      ['S', 'MOT'],
      ['O', 'DR'],
    ])(
      'should create a contact from the journey dto with all fields',
      async (relationshipType: string, relationshipToPrisoner: string) => {
        // Given
        const expectedCreated = {
          createdContact: {
            id: 2136718213,
          },
          createdRelationship: {
            prisonerContactId: 987654,
          },
        }
        apiClient.createContact.mockResolvedValue(expectedCreated as unknown as ContactCreationResult)
        const journey: AddContactJourney = {
          id: '1',
          lastTouched: new Date().toISOString(),
          prisonerNumber,
          isCheckingAnswers: false,
          returnPoint: { url: '/foo-bar' },
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
          gender: 'M',
          isStaff: 'YES',
          domesticStatusCode: 'S',
          relationship: {
            relationshipType,
            relationshipToPrisoner,
            isEmergencyContact: false,
            isNextOfKin: true,
            isApprovedVisitor: true,
            comments: 'Some comments about this relationship',
          },
          phoneNumbers: [
            { type: 'MOB', phoneNumber: '0123456789' },
            { type: 'HOME', phoneNumber: '987654321', extension: '#123' },
          ],
          employments: [
            {
              employer: { organisationId: 123, organisationName: '', organisationActive: true },
              isActive: true,
            },
          ],
        }
        const expectedRequest: CreateContactRequest = {
          titleCode: 'Mr',
          lastName: 'last',
          firstName: 'first',
          middleNames: 'middle',
          dateOfBirth: '1982-06-01',
          isStaff: true,
          interpreterRequired: false,
          genderCode: 'M',
          domesticStatusCode: 'S',
          phoneNumbers: [
            { phoneType: 'MOB', phoneNumber: '0123456789' },
            { phoneType: 'HOME', phoneNumber: '987654321', extNumber: '#123' },
          ],
          createdBy: 'user1',
          relationship: {
            prisonerNumber,
            relationshipTypeCode: relationshipType,
            relationshipToPrisonerCode: relationshipToPrisoner,
            isNextOfKin: true,
            isEmergencyContact: false,
            isApprovedVisitor: true,
            comments: 'Some comments about this relationship',
          },
        }

        // When
        const created = await service.createContact(journey, user, 'correlationId')

        // Then
        expect(created).toStrictEqual(expectedCreated)
        if (relationshipType === 'O') {
          expect(apiClient.createContact).toHaveBeenCalledWith(
            {
              ...expectedRequest,
              employments: [{ organisationId: 123, isActive: true }],
            },
            user,
          )
        } else {
          expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
        }
        expect(auditService.logAuditEvent).toHaveBeenCalledWith({
          what: 'API_POST_CONTACT',
          who: 'user1',
          subjectType: 'CONTACT',
          correlationId: 'correlationId',
          details: { prisonNumber: 'A1234BC', isApprovedVisitor: true },
        })
      },
    )

    it.each([
      ['YES', true],
      ['NO', false],
      [undefined, false],
    ])(
      'should create a contact from the journey dto with all staff options',
      async (isStaffJourney: string | undefined, isStaffRequest: boolean) => {
        // Given
        const expectedCreated = {
          createdContact: {
            id: 2136718213,
          },
          createdRelationship: {
            prisonerContactId: 987654,
          },
        }
        apiClient.createContact.mockResolvedValue(expectedCreated as unknown as ContactCreationResult)
        const journey: AddContactJourney = {
          id: '1',
          lastTouched: new Date().toISOString(),
          prisonerNumber,
          isCheckingAnswers: false,
          returnPoint: { url: '/foo-bar' },
          names: {
            lastName: 'last',
            firstName: 'first',
          },
          relationship: {
            relationshipType: 'S',
            relationshipToPrisoner: 'MOT',
            isEmergencyContact: false,
            isNextOfKin: true,
          },
          isStaff: isStaffJourney as YesOrNo,
        }
        const expectedRequest: CreateContactRequest = {
          lastName: 'last',
          firstName: 'first',
          isStaff: isStaffRequest,
          interpreterRequired: false,
          relationship: {
            prisonerNumber,
            relationshipTypeCode: 'S',
            relationshipToPrisonerCode: 'MOT',
            isNextOfKin: true,
            isEmergencyContact: false,
            isApprovedVisitor: false,
          },
          createdBy: 'user1',
        }

        // When
        const created = await service.createContact(journey, user, 'correlationId')

        // Then
        expect(created).toStrictEqual(expectedCreated)
        expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
      },
    )

    it.each([
      [{ language: 'ENG', interpreterRequired: 'YES' }, 'ENG', true],
      [{ language: 'ENG', interpreterRequired: 'NO' }, 'ENG', false],
      [{ language: 'ENG' }, 'ENG', false],
      [{ interpreterRequired: 'YES' }, undefined, true],
      [undefined, undefined, false],
    ])(
      'should create a contact from the journey dto with all staff options',
      async (languageAndInterpreterJourney, expectedLanguage, expectedInterpreter) => {
        // Given
        const expectedCreated = {
          createdContact: {
            id: 2136718213,
          },
          createdRelationship: {
            prisonerContactId: 987654,
          },
        }
        apiClient.createContact.mockResolvedValue(expectedCreated as unknown as ContactCreationResult)
        const journey: AddContactJourney = {
          id: '1',
          lastTouched: new Date().toISOString(),
          prisonerNumber,
          isCheckingAnswers: false,
          returnPoint: { url: '/foo-bar' },
          names: {
            lastName: 'last',
            firstName: 'first',
          },
          relationship: {
            relationshipType: 'S',
            relationshipToPrisoner: 'MOT',
            isEmergencyContact: false,
            isNextOfKin: true,
          },
          languageAndInterpreter: languageAndInterpreterJourney as LanguageAndInterpreterRequiredForm,
        }
        const expectedRequest: CreateContactRequest = {
          lastName: 'last',
          firstName: 'first',
          isStaff: false,
          interpreterRequired: expectedInterpreter,
          relationship: {
            prisonerNumber,
            relationshipTypeCode: 'S',
            relationshipToPrisonerCode: 'MOT',
            isNextOfKin: true,
            isEmergencyContact: false,
            isApprovedVisitor: false,
          },
          createdBy: 'user1',
        }
        if (expectedLanguage) {
          expectedRequest.languageCode = expectedLanguage
        }

        // When
        const created = await service.createContact(journey, user, 'correlationId')

        // Then
        expect(created).toStrictEqual(expectedCreated)
        expect(apiClient.createContact).toHaveBeenCalledWith(expectedRequest, user)
      },
    )

    it('should create a contact from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated = {
        createdContact: {
          id: 2136718213,
        },
        createdRelationship: {
          prisonerContactId: 987654,
        },
      }
      apiClient.createContact.mockResolvedValue(expectedCreated as unknown as ContactCreationResult)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { url: '/foo-bar' },
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'NO',
        },
        relationship: {
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isEmergencyContact: true,
          isNextOfKin: false,
        },
      }
      const expectedRequest: CreateContactRequest = {
        lastName: 'last',
        firstName: 'first',
        isStaff: false,
        interpreterRequired: false,
        relationship: {
          prisonerNumber,
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.createContact(journey, user, 'correlationId')

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
            returnPoint: { url: '/foo-bar' },
            names: { firstName: 'first', lastName: 'last' },
            dateOfBirth: { isKnown: 'NO' },
            relationship: {
              relationshipToPrisoner: 'MOT',
              isEmergencyContact: true,
              isNextOfKin: false,
              isApprovedVisitor: false,
            },
          },
          user,
          'correlationId',
        ),
      ).rejects.toBeInstanceOf(BadRequest)

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_POST_CONTACT',
        who: 'user1',
        subjectType: 'CONTACT',
        correlationId: 'correlationId',
        details: { prisonNumber: 'A1234BC', statusCode: 400, isApprovedVisitor: false },
      })
    })
  })

  describe('searchContact', () => {
    const pagination = { page: 0, size: 20 } as PaginationRequest

    it('Retrieves search contact details matching the search criteria', async () => {
      // Given
      const contactResults: PagedModelContactSearchResultItem = {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [searchResult],
      }

      // When
      apiClient.searchContact.mockResolvedValue(contactResults)
      const results = await service.searchContact(contactSearchRequest, pagination, user)

      // Then
      expect(results?.content?.[0]?.lastName).toEqual(searchResult.lastName)
      expect(results?.content?.[0]?.firstName).toEqual(searchResult.firstName)
      expect(results.page?.totalPages).toEqual(1)
      expect(results.page?.totalElements).toEqual(1)
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
      const expectedContact = {
        id: 123456,
        lastName: 'last',
        firstName: 'middle',
        middleNames: 'first',
        dateOfBirth: '1980-12-10T00:00:00.000Z',
        createdBy: user.username,
        createdTime: '2024-01-01',
      }
      apiClient.getContact.mockResolvedValue(expectedContact as ContactDetails)

      const contact = await service.getContact(123456, user)

      expect(contact).toStrictEqual(expectedContact)
      expect(apiClient.getContact).toHaveBeenCalledWith(123456, user)
    })

    it('Propagates errors', async () => {
      apiClient.getContact.mockRejectedValue(new Error('some error'))
      await expect(apiClient.getContact(123456, user)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getPrisonerContactRelationship', () => {
    it('should get the prisoner contact relationship', async () => {
      const expected = {
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
        isEmergencyContact: false,
        isNextOfKin: true,
        isRelationshipActive: true,
        comments: 'Some comments',
      }
      apiClient.getPrisonerContactRelationship.mockResolvedValue(expected as PrisonerContactRelationshipDetails)

      const contact = await service.getPrisonerContactRelationship(123456, user)

      expect(contact).toStrictEqual(expected)
      expect(apiClient.getPrisonerContactRelationship).toHaveBeenCalledWith(123456, user)
    })

    it('Propagates errors', async () => {
      apiClient.getPrisonerContactRelationship.mockRejectedValue(new Error('some error'))
      await expect(apiClient.getPrisonerContactRelationship(123456, user)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('addContact', () => {
    it.each([
      ['S', 'MOT'],
      ['O', 'DR'],
    ])(
      'should add a contact relationship from the journey dto with all fields based on relationship type (%s, %s)',
      async (relationshipType: string, relationshipToPrisoner: string) => {
        // Given
        const expectedCreated = {
          prisonerContactId: 987654,
        }
        apiClient.addContactRelationship.mockResolvedValue(expectedCreated as PrisonerContactRelationshipDetails)
        const journey: AddContactJourney = {
          id: '1',
          lastTouched: new Date().toISOString(),
          prisonerNumber,
          isCheckingAnswers: false,
          returnPoint: { url: '/foo-bar' },
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
            relationshipType,
            relationshipToPrisoner,
            isEmergencyContact: false,
            isNextOfKin: true,
            comments: 'Some comments about this relationship',
          },
          contactId: 123456,
        }
        const expectedRequest: AddContactRelationshipRequest = {
          contactId: 123456,
          relationship: {
            prisonerNumber,
            relationshipTypeCode: relationshipType,
            relationshipToPrisonerCode: relationshipToPrisoner,
            isNextOfKin: true,
            isEmergencyContact: false,
            isApprovedVisitor: false,
            comments: 'Some comments about this relationship',
          },
          createdBy: 'user1',
        }

        // When
        const created = await service.addContact(journey, user, 'correlationId')

        // Then
        expect(created).toStrictEqual(expectedCreated)
        expect(apiClient.addContactRelationship).toHaveBeenCalledWith(expectedRequest, user)
        expect(auditService.logAuditEvent).toHaveBeenCalledWith({
          what: 'API_POST_CONTACT_RELATIONSHIP',
          who: 'user1',
          subjectType: 'CONTACT_RELATIONSHIP',
          correlationId: 'correlationId',
          details: { prisonNumber: 'A1234BC', contactId: 123456, isApprovedVisitor: false },
        })
      },
    )

    it('should add a contact relationship from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated = {
        prisonerContactId: 987654,
      }
      apiClient.addContactRelationship.mockResolvedValue(expectedCreated as PrisonerContactRelationshipDetails)
      const journey: AddContactJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { url: '/foo-bar' },
        names: {
          lastName: 'last',
          firstName: 'first',
        },
        dateOfBirth: {
          isKnown: 'NO',
        },
        relationship: {
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isEmergencyContact: true,
          isNextOfKin: false,
        },
        contactId: 123456,
      }
      const expectedRequest: AddContactRelationshipRequest = {
        contactId: 123456,
        relationship: {
          prisonerNumber,
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.addContact(journey, user, 'correlationId')

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.addContactRelationship).toHaveBeenCalledWith(expectedRequest, user)
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
            returnPoint: { url: '/foo-bar' },
            names: { firstName: 'first', lastName: 'last' },
            dateOfBirth: { isKnown: 'NO' },
            relationship: {
              relationshipToPrisoner: 'MOT',
              isEmergencyContact: true,
              isNextOfKin: false,
              isApprovedVisitor: true,
            },
            contactId: 123456,
          },
          user,
          'correlationId',
        ),
      ).rejects.toBeInstanceOf(BadRequest)

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_POST_CONTACT_RELATIONSHIP',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP',
        correlationId: 'correlationId',
        details: { prisonNumber: 'A1234BC', contactId: 123456, statusCode: 400, isApprovedVisitor: true },
      })
    })
  })

  describe('updateContactPhone', () => {
    it('should update a contact phone with all fields', async () => {
      // Given
      const expected = {
        contactPhoneId: 999,
      }
      apiClient.updateContactPhone.mockResolvedValue(expected as ContactPhoneDetails)
      const expectedRequest: UpdatePhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        extNumber: '000',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactPhone(99, 77, user, 'correlationId', 'MOB', '0123456789', '000')

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactPhone).toHaveBeenCalledWith(99, 77, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_PHONE',
        who: 'user1',
        subjectType: 'CONTACT_PHONE',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 99 },
      })
    })

    it('should update a contact phone with only required fields', async () => {
      // Given
      const expected = {
        contactPhoneId: 999,
      }
      apiClient.updateContactPhone.mockResolvedValue(expected as ContactPhoneDetails)
      const expectedRequest: UpdatePhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactPhone(99, 77, user, 'correlationId', 'MOB', '0123456789', undefined)

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactPhone).toHaveBeenCalledWith(99, 77, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactPhone.mockRejectedValue(createError.BadRequest())
      await expect(
        service.updateContactPhone(99, 77, user, 'correlationId', 'MOB', '0123456789', undefined),
      ).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PUT_CONTACT_PHONE',
        who: 'user1',
        subjectType: 'CONTACT_PHONE',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 99, statusCode: 400 },
      })
    })
  })

  describe('updateContactById', () => {
    // Given
    const request: PatchContactRequest = {
      languageCode: 'ENG',
      updatedBy: 'user1',
    }
    it('Should update the language reference', async () => {
      // When
      apiClient.updateContactById.mockResolvedValue(TestData.patchContact())
      const contact = await service.updateContactById(23, request, user, 'correlationId')

      // Then
      expect(contact).toStrictEqual(TestData.patchContact())
      expect(apiClient.updateContactById).toHaveBeenCalledWith(23, request, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PATCH_CONTACT',
        who: 'user1',
        subjectType: 'CONTACT',
        subjectId: '23',
        correlationId: 'correlationId',
      })
    })

    it('Propagates errors', async () => {
      apiClient.updateContactById.mockRejectedValue(createError.BadRequest())
      await expect(service.updateContactById(23, request, user, 'correlationId')).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PATCH_CONTACT',
        who: 'user1',
        subjectType: 'CONTACT',
        subjectId: '23',
        correlationId: 'correlationId',
        details: { statusCode: 400 },
      })
    })
  })

  describe('deleteContactPhone', () => {
    // Given
    it('should delete the contact phone', async () => {
      // When
      apiClient.deleteContactPhone.mockResolvedValue()
      await service.deleteContactPhone(23, 77, user, 'correlationId')

      // Then
      expect(apiClient.deleteContactPhone).toHaveBeenCalledWith(23, 77, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_DELETE_CONTACT_PHONE',
        who: 'user1',
        subjectType: 'CONTACT_PHONE',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 23 },
      })
    })

    it('Propagates errors', async () => {
      apiClient.deleteContactPhone.mockRejectedValue(new Error('some error'))
      await expect(service.deleteContactPhone(23, 77, user, 'correlationId')).rejects.toEqual(new Error('some error'))
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_DELETE_CONTACT_PHONE',
        who: 'user1',
        subjectType: 'CONTACT_PHONE',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 23, statusCode: undefined },
      })
    })
  })

  describe('createContactEmail', () => {
    const expectedRequest: CreateMultipleEmailsRequest = {
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      createdBy: 'user1',
    }

    it('should create contact emails with all fields', async () => {
      // Given
      const expectedCreated: ContactEmailDetails = {
        contactEmailId: 1,
        contactId: 1,
        emailAddress: 'test@example.com',
        createdBy: 'user1',
        createdTime: new Date().toISOString(),
        updatedBy: new Date().toISOString(),
        updatedTime: new Date().toISOString(),
      }
      apiClient.createContactEmails.mockResolvedValue([expectedCreated])

      // When
      const created = await service.createContactEmails(99, expectedRequest, user, 'correlationId')

      // Then
      expect(created).toStrictEqual([expectedCreated])
      expect(apiClient.createContactEmails).toHaveBeenCalledWith(99, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_POST_CONTACT_EMAILS',
        who: 'user1',
        subjectType: 'CONTACT_EMAIL',
        correlationId: 'correlationId',
        details: { contactId: 99 },
      })
    })

    it('should handle a bad request', async () => {
      apiClient.createContactEmails.mockRejectedValue(createError.BadRequest())
      await expect(service.createContactEmails(99, expectedRequest, user, 'correlationId')).rejects.toBeInstanceOf(
        BadRequest,
      )
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_POST_CONTACT_EMAILS',
        who: 'user1',
        subjectType: 'CONTACT_EMAIL',
        correlationId: 'correlationId',
        details: { contactId: 99, statusCode: 400 },
      })
    })
  })

  describe('updateContactEmail', () => {
    const expected: ContactEmailDetails = {
      contactEmailId: 1,
      contactId: 1,
      emailAddress: 'test@example.com',
      createdBy: 'user1',
      createdTime: new Date().toISOString(),
      updatedBy: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
    }

    const request: UpdateEmailRequest = {
      emailAddress: 'test@example.com',
      updatedBy: 'user1',
    }

    it('should update a contact email', async () => {
      // Given
      apiClient.updateContactEmail.mockResolvedValue(expected)

      // When
      const updated = await service.updateContactEmail(99, 1, request, user, 'correlationId')

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactEmail).toHaveBeenCalledWith(99, 1, request, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_EMAIL',
        who: 'user1',
        subjectType: 'CONTACT_EMAIL',
        subjectId: '1',
        correlationId: 'correlationId',
        details: { contactId: 99 },
      })
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactEmail.mockRejectedValue(createError.BadRequest())
      await expect(service.updateContactEmail(99, 1, request, user, 'correlationId')).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PUT_CONTACT_EMAIL',
        who: 'user1',
        subjectType: 'CONTACT_EMAIL',
        subjectId: '1',
        correlationId: 'correlationId',
        details: { contactId: 99, statusCode: 400 },
      })
    })
  })

  describe('deleteContactEmail', () => {
    // Given
    it('should delete the contact email', async () => {
      // When
      apiClient.deleteContactEmail.mockResolvedValue()
      await service.deleteContactEmail(23, 77, user, 'correlationId')

      // Then
      expect(apiClient.deleteContactEmail).toHaveBeenCalledWith(23, 77, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_DELETE_CONTACT_EMAIL',
        who: 'user1',
        subjectType: 'CONTACT_EMAIL',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 23 },
      })
    })

    it('Propagates errors', async () => {
      apiClient.deleteContactEmail.mockRejectedValue(new Error('some error'))
      await expect(service.deleteContactEmail(23, 77, user, 'correlationId')).rejects.toEqual(new Error('some error'))
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_DELETE_CONTACT_EMAIL',
        who: 'user1',
        subjectType: 'CONTACT_EMAIL',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 23, statusCode: undefined },
      })
    })
  })

  describe('createContactAddress', () => {
    it('should create a contact address from the journey dto with all fields', async () => {
      // Given
      const expectedCreated = {
        contactAddressId: 123456,
      }
      apiClient.createContactAddress.mockResolvedValue(expectedCreated as ContactAddressDetails)
      const journey: AddressJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId: 999,
        isCheckingAnswers: false,
        contactNames: { firstName: 'first', lastName: 'last' },
        addressType: 'WORK',
        addressLines: {
          noFixedAddress: true,
          flat: '1a',
          property: 'My block',
          street: 'A street',
          area: 'Downtown',
          cityCode: '1234',
          countyCode: 'DEVON',
          postcode: 'PC1 D3',
          countryCode: 'ENG',
        },
        addressMetadata: {
          fromMonth: '2',
          fromYear: '2001',
          toMonth: '12',
          toYear: '2012',
          primaryAddress: true,
          mailAddress: true,
          comments: 'My comments will be super useful',
        },
      }

      const expectedRequest: CreateContactAddressRequest = {
        addressType: 'WORK',
        flat: '1a',
        property: 'My block',
        street: 'A street',
        area: 'Downtown',
        cityCode: '1234',
        countyCode: 'DEVON',
        postcode: 'PC1 D3',
        countryCode: 'ENG',
        verified: false,
        primaryAddress: true,
        mailFlag: true,
        startDate: new Date('2001-02-01Z').toISOString(),
        endDate: new Date('2012-12-01Z').toISOString(),
        noFixedAddress: true,
        comments: 'My comments will be super useful',
        createdBy: user.username,
        phoneNumbers: [],
      }

      // When
      const created = await service.createContactAddress(journey, user, 'correlationId')

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactAddress).toHaveBeenCalledWith(999, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_POST_CONTACT_ADDRESSES',
        who: 'user1',
        subjectType: 'CONTACT_ADDRESS',
        correlationId: 'correlationId',
        details: { contactId: 999 },
      })
    })

    it('should create a contact address from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated = {
        contactAddressId: 123456,
      }
      apiClient.createContactAddress.mockResolvedValue(expectedCreated as ContactAddressDetails)
      const journey: AddressJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId: 999,
        isCheckingAnswers: false,
        contactNames: { firstName: 'first', lastName: 'last' },
        addressType: 'DO_NOT_KNOW',
        addressLines: { noFixedAddress: false, countryCode: 'ENG' },
        addressMetadata: { fromMonth: '2', fromYear: '2000', mailAddress: false, primaryAddress: false },
      }

      const expectedRequest: CreateContactAddressRequest = {
        countryCode: 'ENG',
        verified: false,
        primaryAddress: false,
        mailFlag: false,
        startDate: new Date('2000-02-01Z').toISOString(),
        noFixedAddress: false,
        createdBy: user.username,
        phoneNumbers: [],
      }

      // When
      const created = await service.createContactAddress(journey, user, 'correlationId')

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactAddress).toHaveBeenCalledWith(999, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.createContactAddress.mockRejectedValue(createError.BadRequest())
      await expect(
        service.createContactAddress(
          {
            id: '1',
            lastTouched: new Date().toISOString(),
            prisonerNumber,
            contactId: 999,
            isCheckingAnswers: false,
            contactNames: { firstName: 'first', lastName: 'last' },
            addressType: 'DO_NOT_KNOW',
            addressLines: { noFixedAddress: false, countryCode: 'ENG' },
            addressMetadata: { fromMonth: '01', fromYear: '2000' },
          },
          user,
          'correlationId',
        ),
      ).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_POST_CONTACT_ADDRESSES',
        who: 'user1',
        subjectType: 'CONTACT_ADDRESS',
        correlationId: 'correlationId',
        details: { contactId: 999, statusCode: 400 },
      })
    })
  })

  describe('updateContactAddress', () => {
    it('should update a contact address from the journey dto with all fields', async () => {
      // Given
      const expectedUpdated = {
        contactAddressId: 123456,
      }
      apiClient.updateContactAddress.mockResolvedValue(expectedUpdated as ContactAddressDetails)
      const journey = {
        contactId: 999,
        contactAddressId: 123456,
        addressType: 'WORK',
        noFixedAddress: true,
        flat: '1a',
        property: 'My block',
        street: 'A street',
        area: 'Downtown',
        cityCode: '1234',
        countyCode: 'DEVON',
        postcode: 'PC1 D3',
        countryCode: 'ENG',
        startDate: new Date('2001-02-01Z'),
        endDate: new Date('2012-12-01Z'),
        primaryAddress: true,
        mailAddress: true,
        comments: 'My comments will be super useful',
      }

      const expectedRequest: PatchContactAddressRequest = {
        // @ts-expect-error mistyped by openapi script
        addressType: 'WORK',
        flat: '1a',
        property: 'My block',
        street: 'A street',
        area: 'Downtown',
        cityCode: '1234',
        countyCode: 'DEVON',
        postcode: 'PC1 D3',
        countryCode: 'ENG',
        verified: false,
        primaryAddress: true,
        mailFlag: true,
        startDate: new Date('2001-02-01Z').toISOString(),
        endDate: new Date('2012-12-01Z').toISOString(),
        noFixedAddress: true,
        comments: 'My comments will be super useful',
        updatedBy: user.username,
      }

      // When
      const updated = await service.updateContactAddress(journey, user, 'correlationId')

      // Then
      expect(updated).toStrictEqual(expectedUpdated)
      expect(apiClient.updateContactAddress).toHaveBeenCalledWith(999, 123456, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PATCH_CONTACT_ADDRESS',
        who: 'user1',
        subjectType: 'CONTACT_ADDRESS',
        subjectId: '123456',
        correlationId: 'correlationId',
        details: { contactId: 999 },
      })
    })

    it('should update a contact address from the journey dto with partial fields', async () => {
      // Given
      const expectedUpdated = {
        contactAddressId: 123456,
      }
      apiClient.updateContactAddress.mockResolvedValue(expectedUpdated as ContactAddressDetails)
      const journey = {
        contactId: 999,
        contactAddressId: 123456,
        noFixedAddress: false,
        countryCode: 'ENG',
      }

      const expectedRequest: PatchContactAddressRequest = {
        countryCode: 'ENG',
        verified: false,
        noFixedAddress: false,
        updatedBy: user.username,
      }

      // When
      const updated = await service.updateContactAddress(journey, user, 'correlationId')

      // Then
      expect(updated).toStrictEqual(expectedUpdated)
      expect(apiClient.updateContactAddress).toHaveBeenCalledWith(999, 123456, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactAddress.mockRejectedValue(createError.BadRequest())
      await expect(
        service.updateContactAddress(
          {
            id: '1',
            lastTouched: new Date().toISOString(),
            prisonerNumber,
            contactId: 999,
            contactAddressId: 123456,
            isCheckingAnswers: false,
            contactNames: { firstName: 'first', lastName: 'last' },
            addressType: 'DO_NOT_KNOW',
            addressLines: { noFixedAddress: false, countryCode: 'ENG' },
            addressMetadata: { fromMonth: '01', fromYear: '2000' },
          },
          user,
          'correlationId',
        ),
      ).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PATCH_CONTACT_ADDRESS',
        who: 'user1',
        subjectType: 'CONTACT_ADDRESS',
        subjectId: '123456',
        correlationId: 'correlationId',
        details: { contactId: 999, statusCode: 400 },
      })
    })
  })

  describe('updateContactAddressPhone', () => {
    it('should update a contact address phone with all fields', async () => {
      // Given
      const expected = {
        contactAddressPhoneId: 123,
        contactAddressId: 321,
      }
      apiClient.updateContactAddressPhone.mockResolvedValue(expected as ContactAddressPhoneDetails)
      const expectedRequest: UpdateContactAddressPhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        extNumber: '000',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactAddressPhone(
        99,
        321,
        77,
        user,
        'correlationId',
        'MOB',
        '0123456789',
        '000',
      )

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactAddressPhone).toHaveBeenCalledWith(99, 321, 77, expectedRequest, user)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PUT_CONTACT_ADDRESS_PHONE',
        who: 'user1',
        subjectType: 'CONTACT_ADDRESS_PHONE',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 99, contactAddressId: 321 },
      })
    })

    it('should update a contact address phone with only required fields', async () => {
      // Given
      const expected = {
        contactAddressPhoneId: 123,
        contactAddressId: 321,
      }
      apiClient.updateContactAddressPhone.mockResolvedValue(expected as ContactAddressPhoneDetails)
      const expectedRequest: UpdateContactAddressPhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactAddressPhone(
        99,
        321,
        77,
        user,
        'correlationId',
        'MOB',
        '0123456789',
        undefined,
      )

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactAddressPhone).toHaveBeenCalledWith(99, 321, 77, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactAddressPhone.mockRejectedValue(createError.BadRequest())
      await expect(
        service.updateContactAddressPhone(99, 321, 77, user, 'correlationId', 'MOB', '0123456789', undefined),
      ).rejects.toBeInstanceOf(BadRequest)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'FAILURE_API_PUT_CONTACT_ADDRESS_PHONE',
        who: 'user1',
        subjectType: 'CONTACT_ADDRESS_PHONE',
        subjectId: '77',
        correlationId: 'correlationId',
        details: { contactId: 99, contactAddressId: 321, statusCode: 400 },
      })
    })
  })
  describe('updateContactRelationshipById', () => {
    it('should audit all details excluding comments as those may contain PII or be large', async () => {
      apiClient.updateContactRelationshipById.mockResolvedValue(undefined)
      const request: PatchRelationshipRequest = {
        relationshipTypeCode: 'S',
        relationshipToPrisonerCode: 'FRO',
        isEmergencyContact: true,
        isApprovedVisitor: true,
        isNextOfKin: true,
        isRelationshipActive: true,
        comments: 'SOME COMMENTS',
        updatedBy: 'USER1',
      }
      await expect(service.updateContactRelationshipById(99, request, user, 'correlationId')).resolves.toStrictEqual(
        undefined,
      )

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PATCH_CONTACT_RELATIONSHIP',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP',
        subjectId: '99',
        correlationId: 'correlationId',
        details: {
          prisonerContactId: 99,
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'FRO',
          isEmergencyContact: true,
          isApprovedVisitor: true,
          isNextOfKin: true,
          isRelationshipActive: true,
        },
      })
    })

    it('should audit only provided details when doing an update', async () => {
      apiClient.updateContactRelationshipById.mockResolvedValue(undefined)
      const request: PatchRelationshipRequest = {
        updatedBy: 'USER1',
      }
      await expect(service.updateContactRelationshipById(99, request, user, 'correlationId')).resolves.toStrictEqual(
        undefined,
      )

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: 'API_PATCH_CONTACT_RELATIONSHIP',
        who: 'user1',
        subjectType: 'CONTACT_RELATIONSHIP',
        subjectId: '99',
        correlationId: 'correlationId',
        details: {
          prisonerContactId: 99,
        },
      })
    })
  })
})
