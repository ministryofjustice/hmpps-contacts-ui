import nock from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import ContactsApiClient from './contactsApiClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ReferenceCode = contactsApiClientTypes.ReferenceCode

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
})
