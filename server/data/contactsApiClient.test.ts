import nock from 'nock'
import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import ContactsApiClient from './contactsApiClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import { components } from '../@types/contactsApi'
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import AddContactRelationshipRequest = contactsApiClientTypes.AddContactRelationshipRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import GetContactResponse = contactsApiClientTypes.GetContactResponse

type Language = components['schemas']['Language']

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
      const expectedContact: Contact = {
        id: 1,
        lastName: 'last',
        firstName: 'first',
        createdBy: 'user1',
        createdTime: new Date().toISOString(),
      }
      const request: CreateContactRequest = {
        lastName: 'last',
        firstName: 'first',
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
      } catch (e) {
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('addContactRelationship', () => {
    it('should create the request and return the response', async () => {
      // Given
      const request: AddContactRelationshipRequest = {
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          comments: 'Some comments about this relationship',
        },
        createdBy: 'user1',
      }

      fakeContactsApi
        .post('/contact/123456/relationship', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201)

      // When
      await contactsApiClient.addContactRelationship(123456, request, user)

      // Then
      expect(nock.isDone()).toBe(true)
    })

    it.each([400, 401, 403, 500])('should propagate errors', async (errorCode: number) => {
      // Given
      const request: AddContactRelationshipRequest = {
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
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
        .post('/contact/123456/relationship', request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.addContactRelationship(123456, request, user)
      } catch (e) {
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
        } catch (e) {
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

      const results: ContactSearchResultItemPage = {
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
      const expectedContact: GetContactResponse = {
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
      } catch (e) {
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })

  describe('getLanguageReference', () => {
    it('should create the request and return the response', async () => {
      // Given
      const expectedLanguages: Language = {
        languageId: 23,
        nomisCode: 'ENG',
        nomisDescription: 'English',
        isoAlpha2: 'en',
        isoAlpha3: 'eng',
        isoLanguageDesc: 'English',
        displaySequence: 1,
      }

      fakeContactsApi
        .get('/language-reference')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, expectedLanguages)

      // When
      const languages = await contactsApiClient.getLanguageReference(user)

      // Then
      expect(languages).toEqual(expectedLanguages)
    })

    it.each([401, 403])('should propagate errors', async (errorCode: number) => {
      // Given
      const expectedErrorBody = {
        status: errorCode,
        userMessage: 'Some error',
        developerMessage: 'Some error',
      }

      fakeContactsApi
        .get('/language-reference')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(errorCode, expectedErrorBody)

      // When
      try {
        await contactsApiClient.getLanguageReference(user)
      } catch (e) {
        // Then
        expect(e.status).toEqual(errorCode)
        expect(e.data).toEqual(expectedErrorBody)
      }
    })
  })
})
