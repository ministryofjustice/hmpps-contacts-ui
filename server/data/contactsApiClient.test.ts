import nock from 'nock'
import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import ContactsApiClient from './contactsApiClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import TestData from '../routes/testutils/testData'
import {
  AddContactRelationshipRequest,
  ContactAddressDetails,
  ContactAddressPhoneDetails,
  ContactCreationResult,
  ContactDetails,
  ContactEmailDetails,
  ContactIdentityDetails,
  ContactPhoneDetails,
  ContactRestrictionDetails,
  ContactSearchRequest,
  CreateContactAddressRequest,
  CreateContactRequest,
  CreateContactRestrictionRequest,
  CreateMultipleEmailsRequest,
  CreateMultipleIdentitiesRequest,
  CreatePrisonerContactRestrictionRequest,
  PagedModelContactSearchResultItem, PagedModelPrisonerContactSummary,
  PatchContactAddressRequest,
  PatchContactRequest,
  PatchContactResponse, PrisonerContactFilter, PrisonerContactPagination,
  PrisonerContactRelationshipDetails,
  PrisonerContactRestrictionDetails,
  ReferenceCode,
  UpdateContactAddressPhoneRequest,
  UpdateContactRestrictionRequest,
  UpdateEmailRequest,
  UpdateIdentityRequest,
  UpdatePhoneRequest,
  UpdatePrisonerContactRestrictionRequest,
} from '../@types/contactsApiClient'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('contactsApiClient', () => {
  let fakeContactsApi: nock.Scope
  let contactsApiClient: ContactsApiClient

  beforeEach(() => {
    fakeContactsApi = nock(config.apis.contactsApi.url)
    contactsApiClient = new ContactsApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('createContact', () => {
    it('should create the request and return the response', async () => {
      // Given
      const expectedContact: ContactCreationResult = {
        createdContact: {
          id: 1,
          lastName: 'last',
          firstName: 'first',
          createdBy: 'user1',
          createdTime: new Date().toISOString(),
        },
      }
      const request: CreateContactRequest = {
        lastName: 'last',
        firstName: 'first',
        isStaff: false,
        interpreterRequired: false,
        identities: [],
        addresses: [],
        phoneNumbers: [],
        createdBy: 'user1',
      }

      fakeContactsApi
        .post('/contact', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expectedContact)

      // When
      const createdContact = await contactsApiClient.createContact(request, user)

      // Then
      expect(createdContact).toEqual(expectedContact)
    })

    it.each([400, 401, 403, 500])('should propagate errors', async (errorCode: number) => {
      // Given
      const request: CreateContactRequest = {
        lastName: 'last',
        firstName: 'first',
        isStaff: false,
        interpreterRequired: false,
        identities: [],
        addresses: [],
        phoneNumbers: [],
        createdBy: 'user1',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .post('/contact', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.createContact(request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('addContactRelationship', () => {
    it('should create the request and return the response', async () => {
      // Given
      const expected: PrisonerContactRelationshipDetails = {
        prisonerContactId: 123456,
      }
      const request: AddContactRelationshipRequest = {
        contactId: 123456,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
          comments: 'Some comments about this relationship',
        },
        createdBy: 'user1',
      }

      fakeContactsApi
        .post('/prisoner-contact', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const result = await contactsApiClient.addContactRelationship(request, user)

      // Then
      expect(result).toStrictEqual(expected)
      expect(nock.isDone()).toBe(true)
    })

    it.each([400, 401, 403, 500])('should propagate errors', async (errorCode: number) => {
      // Given
      const request: AddContactRelationshipRequest = {
        contactId: 123456,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
          comments: 'Some comments about this relationship',
        },
        createdBy: 'user1',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .post('/prisoner-contact', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.addContactRelationship(request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('getReferenceCodes', () => {
    describe('createContact', () => {
      it('should create the request and return the response', async () => {
        // Given
        const expectedCodes: ReferenceCode[] = [
          {
            code: 'MR',
            description: 'Mr',
            groupCode: 'TITLE',
            referenceCodeId: 1,
          },
          {
            code: 'MRS',
            description: 'Mrs',
            groupCode: 'TITLE',
            referenceCodeId: 2,
          },
        ]
        fakeContactsApi
          .get('/reference-codes/group/TITLE')
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(200, expectedCodes)

        // When
        const createdContact = await contactsApiClient.getReferenceCodes(ReferenceCodeType.TITLE, user)

        // Then
        expect(createdContact).toEqual(expectedCodes)
      })

      it.each([401, 403])('should propagate errors', async (errorCode: number) => {
        // Given
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .get('/reference-codes/group/TITLE')
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.getReferenceCodes(ReferenceCodeType.TITLE, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      })
    })
  })

  describe('searchContact', () => {
    it('should return expected data', async () => {
      const contactSearchRequest: ContactSearchRequest = {
        lastName: 'last',
        middleNames: 'middle',
        firstName: 'first',
        dateOfBirth: '1980-12-10T00:00:00.000Z',
      }

      const results: PagedModelContactSearchResultItem = {
        totalPage: 1,
        totalElements: 1,
        content: [
          {
            lastName: 'last',
            firstName: 'middle',
            middleNames: 'first',
            dateOfBirth: '1980-12-10T00:00:00.000Z',
            createdBy: user.username,
            createdTime: '2024-01-01',
          },
        ],
      }

      fakeContactsApi
        .get('/contact/search')
        .query({
          lastName: contactSearchRequest.lastName,
          firstName: contactSearchRequest.firstName,
          middleNames: contactSearchRequest.middleNames,
          dateOfBirth: contactSearchRequest.dateOfBirth,
          page: 0,
          size: 20,
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, results)

      const output = await contactsApiClient.searchContact(contactSearchRequest, user, { page: 0, size: 20 })

      expect(output).toEqual(results)
    })
  })
  describe('getContact', () => {
    it('should create the request and return the response', async () => {
      // Given
      const expectedContact: ContactDetails = {
        id: 123456,
        lastName: 'last',
        firstName: 'middle',
        middleNames: 'first',
        dateOfBirth: '1980-12-10T00:00:00.000Z',
        createdBy: user.username,
        createdTime: '2024-01-01',
      }
      fakeContactsApi
        .get('/contact/123456')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, expectedContact)

      // When
      const createdContact = await contactsApiClient.getContact(123456, user)

      // Then
      expect(createdContact).toEqual(expectedContact)
    })

    it.each([401, 403])('should propagate errors', async (errorCode: number) => {
      // Given
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .get('/contact/123456')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.getContact(123456, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('getPrisonerContactRelationship', () => {
    it('should get the prisoner contact relationship', async () => {
      // Given
      const expected: PrisonerContactRelationshipDetails = {
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
        isEmergencyContact: false,
        isNextOfKin: true,
        isRelationshipActive: true,
        comments: 'Some comments',
      }
      fakeContactsApi
        .get('/prisoner-contact/123456')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, expected)

      // When
      const contact = await contactsApiClient.getPrisonerContactRelationship(123456, user)

      // Then
      expect(contact).toEqual(expected)
    })

    it.each([401, 403])('should propagate errors', async (errorCode: number) => {
      // Given
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .get('/prisoner-contact/123456')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.getPrisonerContactRelationship(123456, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('updateContactPhone', () => {
    it('should update the contact and return the response', async () => {
      // Given
      const expectedContactPhoneDetails: ContactPhoneDetails = {
        id: 1,
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        createdBy: 'user1',
        createdTime: new Date().toISOString(),
        updatedBy: 'user1',
        updatedTime: new Date().toISOString(),
      }
      const request: UpdatePhoneRequest = {
        type: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }

      fakeContactsApi
        .put('/contact/99/phone/77', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, expectedContactPhoneDetails)

      // When
      const updated = await contactsApiClient.updateContactPhone(99, 77, request, user)

      // Then
      expect(updated).toEqual(expectedContactPhoneDetails)
    })

    it.each([400, 401, 403, 500])('should propagate errors updating contact phone', async (errorCode: number) => {
      // Given
      const request: UpdatePhoneRequest = {
        type: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .put('/contact/99/phone/77', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.updateContactPhone(99, 77, request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('deleteContactPhone', () => {
    it('should delete the contact', async () => {
      // Given

      fakeContactsApi.delete('/contact/99/phone/77').matchHeader('authorization', `Bearer systemToken`).reply(204)

      // When
      await contactsApiClient.deleteContactPhone(99, 77, user)
    })

    it.each([400, 401, 403])('should propagate errors deleting contact phone %s', async (errorCode: number) => {
      // Given
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .delete('/contact/99/phone/77')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.deleteContactPhone(99, 77, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('updateContactById', () => {
    it('should return the response for a valid request', async () => {
      // Given
      const request: PatchContactRequest = {
        languageCode: 'ENG',
        updatedBy: 'user1',
      }

      const expectedContact: PatchContactResponse = {
        languageCode: 'ENG',
        updatedBy: 'user1',
      }

      fakeContactsApi
        .patch('/contact/23', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expectedContact)

      // When
      const updatedContact = await contactsApiClient.updateContactById(23, request, user)

      // Then
      expect(nock.isDone()).toBe(true)
      expect(updatedContact).toEqual(expectedContact)
    })
  })

  describe('Identity', () => {
    describe('createContactIdentities', () => {
      it('should create the contact identity and return the response', async () => {
        // Given
        const expectedContactIdentityDetails: ContactIdentityDetails = {
          id: 1,
          identityType: 'PASS',
          identityNumber: '0123456789',
          issuingAuthority: 'UK',
          createdBy: 'user1',
          createdTime: new Date().toISOString(),
        }
        const request: CreateMultipleIdentitiesRequest = {
          identities: [
            {
              identityType: 'PASS',
              identityValue: '0123456789',
              issuingAuthority: 'UK',
            },
          ],
          createdBy: 'user1',
        }

        fakeContactsApi
          .post('/contact/99/identities', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(201, [expectedContactIdentityDetails])

        // When
        const createdContact = await contactsApiClient.createContactIdentities(99, request, user)

        // Then
        expect(createdContact).toEqual([expectedContactIdentityDetails])
      })

      it.each([400, 401, 403, 500])('should propagate errors creating contact identity', async (errorCode: number) => {
        // Given
        const request: CreateMultipleIdentitiesRequest = {
          identities: [
            {
              identityType: 'PASS',
              identityValue: '0123456789',
              issuingAuthority: 'UK',
            },
          ],
          createdBy: 'user1',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .post('/contact/99/identities', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.createContactIdentities(99, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      })
    })

    describe('updateContactIdentity', () => {
      it('should update the contact identity and return the response', async () => {
        // Given
        const expectedContactIdentityDetails: ContactIdentityDetails = {
          id: 1,
          identityType: 'PASS',
          identityNumber: '0123456789',
          issuingAuthority: 'UK',
          createdBy: 'user1',
          createdTime: new Date().toISOString(),
          updatedBy: 'user1',
          updatedTime: new Date().toISOString(),
        }
        const request: UpdateIdentityRequest = {
          type: 'PASS',
          identityNumber: '0123456789',
          updatedBy: 'user1',
        }

        fakeContactsApi
          .put('/contact/99/identity/77', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(200, expectedContactIdentityDetails)

        // When
        const updated = await contactsApiClient.updateContactIdentity(99, 77, request, user)

        // Then
        expect(updated).toEqual(expectedContactIdentityDetails)
      })

      it.each([400, 401, 403, 500])('should propagate errors updating contact identity', async (errorCode: number) => {
        // Given
        const request: UpdateIdentityRequest = {
          type: 'PASS',
          identityNumber: '0123456789',
          issuingAuthority: 'UK',
          updatedBy: 'user1',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .put('/contact/99/identity/77', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.updateContactIdentity(99, 77, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      })
    })

    describe('deleteContactIdentity', () => {
      it('should delete the contact', async () => {
        // Given

        fakeContactsApi.delete('/contact/99/identity/77').matchHeader('authorization', `Bearer systemToken`).reply(204)

        // When
        await contactsApiClient.deleteContactIdentity(99, 77, user)
      })

      it.each([400, 401, 403])('should propagate errors deleting contact identity %s', async (errorCode: number) => {
        // Given
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .delete('/contact/99/identity/77')
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.deleteContactIdentity(99, 77, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      })
    })
  })

  describe('Email Address', () => {
    describe('createContactEmail', () => {
      it('should create the contact email and return the response', async () => {
        // Given
        const expectedContactEmailDetails: ContactEmailDetails = {
          contactEmailId: 1,
          contactId: 1,
          emailAddress: 'test@example.com',
          createdBy: 'user1',
          createdTime: new Date().toISOString(),
          updatedBy: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
        }

        const request: CreateMultipleEmailsRequest = {
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          createdBy: 'user1',
        }

        fakeContactsApi
          .post('/contact/99/emails', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(201, [expectedContactEmailDetails])

        // When
        const createdContact = await contactsApiClient.createContactEmails(99, request, user)

        // Then
        expect(createdContact).toEqual([expectedContactEmailDetails])
      })

      it.each([400, 401, 403, 500])('should propagate errors creating contact identity', async (errorCode: number) => {
        // Given
        const request: CreateMultipleEmailsRequest = {
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          createdBy: 'user1',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .post('/contact/99/emails', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.createContactEmails(99, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      })
    })

    describe('updateContactEmail', () => {
      it('should update the contact email and return the response', async () => {
        // Given
        const expectedContactEmailDetails: ContactEmailDetails = {
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

        fakeContactsApi
          .put('/contact/99/email/1', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(200, expectedContactEmailDetails)

        // When
        const updated = await contactsApiClient.updateContactEmail(99, 1, request, user)

        // Then
        expect(updated).toEqual(expectedContactEmailDetails)
      })

      it.each([400, 401, 403, 500])('should propagate errors updating contact identity', async (errorCode: number) => {
        // Given
        const request: UpdateEmailRequest = {
          emailAddress: 'test@example.com',
          updatedBy: 'user1',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .put('/contact/99/email/1', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.updateContactEmail(99, 1, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      })
    })
  })

  describe('deleteContactEmail', () => {
    it('should delete the contact email', async () => {
      // Given

      fakeContactsApi.delete('/contact/99/email/77').matchHeader('authorization', `Bearer systemToken`).reply(204)

      // When
      await contactsApiClient.deleteContactEmail(99, 77, user)
    })

    it.each([400, 401, 403])('should propagate errors deleting contact email %s', async (errorCode: number) => {
      // Given
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .delete('/contact/99/email/77')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.deleteContactEmail(99, 77, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('createContactGlobalRestriction', () => {
    it('should create the contact restriction', async () => {
      // Given
      const request: CreateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2020-01-01',
      }
      const expected: ContactRestrictionDetails = {
        contactRestrictionId: 123456,
        contactId: 99,
      }
      fakeContactsApi
        .post('/contact/99/restriction', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const created = await contactsApiClient.createContactGlobalRestriction(99, request, user)

      // Then
      expect(created).toEqual(expected)
    })

    it.each([400, 401, 403])('should propagate errors creating the restriction %s', async (errorCode: number) => {
      // Given
      const request: CreateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2020-01-01',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .post('/contact/99/restriction')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.createContactGlobalRestriction(99, request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('createPrisonerContactRestriction', () => {
    it('should create the prisoner contact restriction', async () => {
      // Given
      const request: CreatePrisonerContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2020-01-01',
      }
      const expected: PrisonerContactRestrictionDetails = {
        prisonerContactRestrictionId: 123456,
        prisonerContactId: 66,
        contactId: 99,
      }
      fakeContactsApi
        .post('/prisoner-contact/66/restriction', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const created = await contactsApiClient.createPrisonerContactRestriction(66, request, user)

      // Then
      expect(created).toEqual(expected)
    })

    it.each([400, 401, 403])(
      'should propagate errors creating the prisoner contact restriction %s',
      async (errorCode: number) => {
        // Given
        const request: CreatePrisonerContactRestrictionRequest = {
          restrictionType: 'BAN',
          startDate: '2020-01-01',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .post('/prisoner-contact/99/restriction')
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.createPrisonerContactRestriction(99, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      },
    )
  })

  describe('updateContactGlobalRestriction', () => {
    it('should update the contact restriction', async () => {
      // Given
      const request: UpdateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2020-01-01',
      }
      const expected: ContactRestrictionDetails = {
        contactRestrictionId: 123456,
        contactId: 99,
      }
      fakeContactsApi
        .put('/contact/99/restriction/123456', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const created = await contactsApiClient.updateContactGlobalRestriction(99, 123456, request, user)

      // Then
      expect(created).toEqual(expected)
    })

    it.each([400, 401, 403])('should propagate errors creating the restriction %s', async (errorCode: number) => {
      // Given
      const request: UpdateContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2020-01-01',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .put('/contact/99/restriction/123456')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.updateContactGlobalRestriction(99, 123456, request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('updatePrisonerContactRestriction', () => {
    it('should update the prisoner contact restriction', async () => {
      // Given
      const request: UpdatePrisonerContactRestrictionRequest = {
        restrictionType: 'BAN',
        startDate: '2020-01-01',
      }
      const expected: PrisonerContactRestrictionDetails = {
        prisonerContactRestrictionId: 123456,
        prisonerContactId: 66,
        contactId: 99,
      }
      fakeContactsApi
        .put('/prisoner-contact/66/restriction/123456', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const created = await contactsApiClient.updatePrisonerContactRestriction(66, 123456, request, user)

      // Then
      expect(created).toEqual(expected)
    })

    it.each([400, 401, 403])(
      'should propagate errors creating the prisoner contact restriction %s',
      async (errorCode: number) => {
        // Given
        const request: UpdatePrisonerContactRestrictionRequest = {
          restrictionType: 'BAN',
          startDate: '2020-01-01',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .put('/prisoner-contact/99/restriction/123456')
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.updatePrisonerContactRestriction(99, 123456, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      },
    )
  })

  describe('createContactAddress', () => {
    it('should create the contact address', async () => {
      // Given
      const request: CreateContactAddressRequest = {
        addressType: 'HOME',
        countryCode: 'ENG',
        startDate: '2020-01-01',
      }
      const expected: ContactAddressDetails = {
        contactAddressId: 123456,
      }
      fakeContactsApi
        .post('/contact/99/address', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const created = await contactsApiClient.createContactAddress(99, request, user)

      // Then
      expect(created).toEqual(expected)
    })

    it.each([400, 401, 403])('should propagate errors creating the contact address %s', async (errorCode: number) => {
      // Given
      const request: CreateContactAddressRequest = {
        addressType: 'HOME',
        countryCode: 'ENG',
        startDate: '2020-01-01',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .post('/contact/99/address')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.createContactAddress(99, request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('updateContactAddress', () => {
    it('should update the contact address', async () => {
      // Given
      const request: PatchContactAddressRequest = {
        addressType: 'HOME',
        countryCode: 'ENG',
        startDate: '2020-01-01',
      }
      const expected: ContactAddressDetails = {
        contactAddressId: 123456,
      }
      fakeContactsApi
        .patch('/contact/99/address/123456', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, expected)

      // When
      const created = await contactsApiClient.updateContactAddress(99, 123456, request, user)

      // Then
      expect(created).toEqual(expected)
    })

    it.each([400, 401, 403])('should propagate errors updating the contact address %s', async (errorCode: number) => {
      // Given
      const request: PatchContactAddressRequest = {
        addressType: 'HOME',
        countryCode: 'ENG',
        startDate: '2020-01-01',
      }
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .patch('/contact/99/address/123456')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.updateContactAddress(99, 123456, request, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('updateContactAddressPhone', () => {
    it('should update the contact address phone and return the response', async () => {
      // Given
      const expectedContactAddressPhoneDetails: ContactAddressPhoneDetails = {
        id: 1,
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        createdBy: 'user1',
        createdTime: new Date().toISOString(),
        updatedBy: 'user1',
        updatedTime: new Date().toISOString(),
      }
      const request: UpdateContactAddressPhoneRequest = {
        type: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }

      fakeContactsApi
        .put('/contact/99/address/123456/phone/77', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, expectedContactAddressPhoneDetails)

      // When
      const updated = await contactsApiClient.updateContactAddressPhone(99, 123456, 77, request, user)

      // Then
      expect(updated).toEqual(expectedContactAddressPhoneDetails)
    })

    it.each([400, 401, 403, 500])(
      'should propagate errors updating contact address phone',
      async (errorCode: number) => {
        // Given
        const request: UpdateContactAddressPhoneRequest = {
          type: 'MOB',
          phoneNumber: '0123456789',
          updatedBy: 'user1',
        }
        const expectedErrorBody = {
          status: errorCode,
          userMessage: 'Some error',
          developerMessage: 'Some error',
        }

        fakeContactsApi
          .put('/contact/99/address/123456/phone/77', request)
          .matchHeader('authorization', `Bearer systemToken`)
          .reply(errorCode, expectedErrorBody)

        // When
        try {
          await contactsApiClient.updateContactAddressPhone(99, 123456, 77, request, user)
        } catch (error) {
          const e = error as { status: unknown; data: unknown }
          // Then
          expect(e.status).toEqual(errorCode)
          expect(e.data).toEqual(expectedErrorBody)
        }
      },
    )
  })

  describe('deleteContactAddressPhone', () => {
    it('should delete the contact address phone', async () => {
      // Given

      fakeContactsApi
        .delete('/contact/99/address/123456/phone/77')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(204)

      // When
      await contactsApiClient.deleteContactAddressPhone(99, 123456, 77, user)
    })

    it.each([400, 401, 403])('should propagate errors deleting contact address phone %s', async (errorCode: number) => {
      // Given
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .delete('/contact/99/address/123456/phone/77')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.deleteContactAddressPhone(99, 123456, 77, user)
      } catch (error) {
        const e = error as { status: unknown; data: unknown }
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('filterPrisonerContacts', () => {
    it('should omit optional query parameters', async () => {
      // Given

      const page: PagedModelPrisonerContactSummary = {
        content: [TestData.getPrisonerContact()],
        page: {
          totalElements: 99,
          totalPages: 2,
          number: 2,
          size: 98,
        },
      }
      fakeContactsApi
        .get('/prisoner/AB1234BC/contact')
        .query({
          page: 1,
          size: 98,
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, page)

      // When
      const createdContact = await contactsApiClient.filterPrisonerContacts('AB1234BC', {}, { page: 1, size: 98 }, user)

      // Then
      expect(createdContact).toEqual(page)
    })

    it('should include optional query parameters if defined', async () => {
      // Given

      const page: PagedModelPrisonerContactSummary = {
        content: [TestData.getPrisonerContact()],
        page: {
          totalElements: 99,
          totalPages: 2,
          number: 2,
          size: 98,
        },
      }
      fakeContactsApi
        .get('/prisoner/AB1234BC/contact')
        .query({
          active: true,
          relationshipType: 'S',
          emergencyContact: true,
          nextOfKin: true,
          emergencyContactOrNextOfKin: true,
          page: 1,
          size: 98,
          sort: ['lastName,desc', 'firstName,asc'],
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, page)

      // When
      const filter: PrisonerContactFilter = {
        active: true,
        relationshipType: 'S',
        emergencyContact: true,
        nextOfKin: true,
        emergencyContactOrNextOfKin: true,
      }
      const pagination: PrisonerContactPagination = {
        page: 1,
        size: 98,
        sort: ['lastName,desc', 'firstName,asc'],
      }
      const createdContact = await contactsApiClient.filterPrisonerContacts('AB1234BC', filter, pagination, user)

      // Then
      expect(createdContact).toEqual(page)
    })
  })
})
