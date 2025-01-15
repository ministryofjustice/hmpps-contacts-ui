import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ContactsService from './contactsService'
import { PaginationRequest } from '../data/prisonerOffenderSearchTypes'
import TestData from '../routes/testutils/testData'
import { components } from '../@types/contactsApi'
import AddContactJourney = journeys.AddContactJourney
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import AddContactRelationshipRequest = contactsApiClientTypes.AddContactRelationshipRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import ContactDetails = contactsApiClientTypes.ContactDetails
import CreatePhoneRequest = contactsApiClientTypes.CreatePhoneRequest
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import UpdatePhoneRequest = contactsApiClientTypes.UpdatePhoneRequest
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import AddressJourney = journeys.AddressJourney
import CreateContactAddressRequest = contactsApiClientTypes.CreateContactAddressRequest
import UpdateContactAddressRequest = contactsApiClientTypes.UpdateContactAddressRequest
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails
import CreateContactAddressPhoneRequest = contactsApiClientTypes.CreateContactAddressPhoneRequest
import UpdateContactAddressPhoneRequest = contactsApiClientTypes.UpdateContactAddressPhoneRequest

type CreateEmailRequest = components['schemas']['CreateEmailRequest']
type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']

jest.mock('../data/contactsApiClient')
const searchResult = TestData.contactSearchResultItem()
const contactSearchRequest: ContactSearchRequest = {
  lastName: 'last',
  middleNames: '',
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
      const expectedCreated: ContactCreationResult = {
        createdContact: {
          id: 2136718213,
        },
        createdRelationship: {
          prisonerContactId: 987654,
        },
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
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
        middleNames: 'middle',
        dateOfBirth: new Date('1982-06-01T00:00:00.000Z'),
        createdBy: 'user1',
        relationship: {
          prisonerNumber,
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
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
      const expectedCreated: ContactCreationResult = {
        createdContact: {
          id: 2136718213,
        },
        createdRelationship: {
          prisonerContactId: 987654,
        },
      }
      apiClient.createContact.mockResolvedValue(expectedCreated)
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
          type: 'MOT',
          isEmergencyContact: 'YES',
          isNextOfKin: 'NO',
        },
      }
      const expectedRequest: CreateContactRequest = {
        title: undefined,
        lastName: 'last',
        firstName: 'first',
        middleNames: undefined,
        dateOfBirth: undefined,
        relationship: {
          prisonerNumber,
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
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
            returnPoint: { url: '/foo-bar' },
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
      const contactResults: ContactSearchResultItemPage = {
        totalPages: 1,
        totalElements: 1,
        first: true,
        last: true,
        size: 20,
        empty: false,
        content: [searchResult],
      }

      // When
      apiClient.searchContact.mockResolvedValue(contactResults)
      const results = await service.searchContact(contactSearchRequest, pagination, user)

      // Then
      expect(results?.content[0].lastName).toEqual(searchResult.lastName)
      expect(results?.content[0].firstName).toEqual(searchResult.firstName)
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

  describe('getContact', () => {
    it('Should get the contact', async () => {
      const expectedContact: ContactDetails = {
        id: 123456,
        lastName: 'last',
        firstName: 'middle',
        middleNames: 'first',
        dateOfBirth: '1980-12-10T00:00:00.000Z',
        createdBy: user.username,
        createdTime: '2024-01-01',
      }
      apiClient.getContact.mockResolvedValue(expectedContact)

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
      const expected: PrisonerContactRelationshipDetails = {
        relationshipToPrisoner: 'FRI',
        relationshipDescription: 'Friend',
        emergencyContact: false,
        nextOfKin: true,
        isRelationshipActive: true,
        comments: 'Some comments',
      }
      apiClient.getPrisonerContactRelationship.mockResolvedValue(expected)

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
    it('should add a contact relationship from the journey dto with all fields', async () => {
      // Given
      const expectedCreated: PrisonerContactRelationshipDetails = {
        prisonerContactId: 987654,
      }
      apiClient.addContactRelationship.mockResolvedValue(expectedCreated)
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
          type: 'MOT',
          isEmergencyContact: 'NO',
          isNextOfKin: 'YES',
          comments: 'Some comments about this relationship',
        },
        contactId: 123456,
      }
      const expectedRequest: AddContactRelationshipRequest = {
        contactId: 123456,
        relationship: {
          prisonerNumber,
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some comments about this relationship',
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.addContact(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.addContactRelationship).toHaveBeenCalledWith(expectedRequest, user)
    })

    it('should add a contact relationship from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated: PrisonerContactRelationshipDetails = {
        prisonerContactId: 987654,
      }
      apiClient.addContactRelationship.mockResolvedValue(expectedCreated)
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
          type: 'MOT',
          isEmergencyContact: 'YES',
          isNextOfKin: 'NO',
        },
        contactId: 123456,
      }
      const expectedRequest: AddContactRelationshipRequest = {
        contactId: 123456,
        relationship: {
          prisonerNumber,
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
        },
        createdBy: 'user1',
      }

      // When
      const created = await service.addContact(journey, user)

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
            relationship: { type: 'MOT', isEmergencyContact: 'YES', isNextOfKin: 'NO' },
            contactId: 123456,
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('createContactPhone', () => {
    it('should create a contact phone with all fields', async () => {
      // Given
      const expectedCreated: ContactPhoneDetails = {
        contactPhoneId: 999,
      }
      apiClient.createContactPhone.mockResolvedValue(expectedCreated)
      const expectedRequest: CreatePhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        extNumber: '000',
        createdBy: 'user1',
      }

      // When
      const created = await service.createContactPhone(99, user, 'MOB', '0123456789', '000')

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactPhone).toHaveBeenCalledWith(99, expectedRequest, user)
    })

    it('should create a contact phone with only required fields', async () => {
      // Given
      const expectedCreated: ContactPhoneDetails = {
        contactPhoneId: 999,
      }
      apiClient.createContactPhone.mockResolvedValue(expectedCreated)
      const expectedRequest: CreatePhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        createdBy: 'user1',
      }

      // When
      const created = await service.createContactPhone(99, user, 'MOB', '0123456789', undefined)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactPhone).toHaveBeenCalledWith(99, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.createContactPhone.mockRejectedValue(createError.BadRequest())
      await expect(service.createContactPhone(99, user, 'MOB', '0123456789', undefined)).rejects.toBeInstanceOf(
        BadRequest,
      )
    })
  })

  describe('updateContactPhone', () => {
    it('should update a contact phone with all fields', async () => {
      // Given
      const expected: ContactPhoneDetails = {
        contactPhoneId: 999,
      }
      apiClient.updateContactPhone.mockResolvedValue(expected)
      const expectedRequest: UpdatePhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        extNumber: '000',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactPhone(99, 77, user, 'MOB', '0123456789', '000')

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactPhone).toHaveBeenCalledWith(99, 77, expectedRequest, user)
    })

    it('should update a contact phone with only required fields', async () => {
      // Given
      const expected: ContactPhoneDetails = {
        id: 999,
      }
      apiClient.updateContactPhone.mockResolvedValue(expected)
      const expectedRequest: CreatePhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactPhone(99, 77, user, 'MOB', '0123456789', undefined)

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactPhone).toHaveBeenCalledWith(99, 77, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactPhone.mockRejectedValue(createError.BadRequest())
      await expect(service.updateContactPhone(99, 77, user, 'MOB', '0123456789', undefined)).rejects.toBeInstanceOf(
        BadRequest,
      )
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
      const contact = await service.updateContactById(23, request, user)

      // Then
      expect(contact).toStrictEqual(TestData.patchContact())
      expect(apiClient.updateContactById).toHaveBeenCalledWith(23, request, user)
    })

    it('Propagates errors', async () => {
      apiClient.updateContactById.mockRejectedValue(new Error('some error'))
      await expect(apiClient.updateContactById(23, request, user)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('deleteContactPhone', () => {
    // Given
    it('should delete the contact phone', async () => {
      // When
      apiClient.deleteContactPhone.mockResolvedValue()
      await service.deleteContactPhone(23, 77, user)

      // Then
      expect(apiClient.deleteContactPhone).toHaveBeenCalledWith(23, 77, user)
    })

    it('Propagates errors', async () => {
      apiClient.deleteContactPhone.mockRejectedValue(new Error('some error'))
      await expect(apiClient.deleteContactPhone(23, 77, user)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('createContactEmail', () => {
    const expectedRequest: CreateEmailRequest = {
      emailAddress: 'test@example.com',
      createdBy: 'user1',
    }

    it('should create a contact email with all fields', async () => {
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
      apiClient.createContactEmail.mockResolvedValue(expectedCreated)

      // When
      const created = await service.createContactEmail(99, expectedRequest, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactEmail).toHaveBeenCalledWith(99, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.createContactEmail.mockRejectedValue(createError.BadRequest())
      await expect(service.createContactEmail(99, expectedRequest, user)).rejects.toBeInstanceOf(BadRequest)
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
      const updated = await service.updateContactEmail(99, 1, request, user)

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactEmail).toHaveBeenCalledWith(99, 1, request, user)
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactEmail.mockRejectedValue(createError.BadRequest())
      await expect(service.updateContactEmail(99, 1, request, user)).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('deleteContactEmail', () => {
    // Given
    it('should delete the contact email', async () => {
      // When
      apiClient.deleteContactEmail.mockResolvedValue()
      await service.deleteContactEmail(23, 77, user)

      // Then
      expect(apiClient.deleteContactEmail).toHaveBeenCalledWith(23, 77, user)
    })

    it('Propagates errors', async () => {
      apiClient.deleteContactEmail.mockRejectedValue(new Error('some error'))
      await expect(apiClient.deleteContactEmail(23, 77, user)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('createContactAddress', () => {
    it('should create a contact address from the journey dto with all fields', async () => {
      // Given
      const expectedCreated: ContactAddressDetails = {
        contactAddressId: 123456,
      }
      apiClient.createContactAddress.mockResolvedValue(expectedCreated)
      const journey: AddressJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId: 999,
        isCheckingAnswers: false,
        mode: 'ADD',
        returnPoint: { url: '/foo-bar' },
        contactNames: { firstName: 'first', lastName: 'last' },
        addressType: 'WORK',
        addressLines: {
          noFixedAddress: true,
          flat: '1a',
          premises: 'My block',
          street: 'A street',
          locality: 'Downtown',
          town: '1234',
          county: 'DEVON',
          postcode: 'PC1 D3',
          country: 'ENG',
        },
        addressMetadata: {
          fromMonth: '2',
          fromYear: '2001',
          toMonth: '12',
          toYear: '2012',
          primaryAddress: 'YES',
          mailAddress: 'YES',
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
        startDate: new Date('2001-02-01Z'),
        endDate: new Date('2012-12-01Z'),
        noFixedAddress: true,
        comments: 'My comments will be super useful',
        createdBy: user.username,
      }

      // When
      const created = await service.createContactAddress(journey, user)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactAddress).toHaveBeenCalledWith(999, expectedRequest, user)
    })

    it('should create a contact address from the journey dto with only optional fields', async () => {
      // Given
      const expectedCreated: ContactAddressDetails = {
        contactAddressId: 123456,
      }
      apiClient.createContactAddress.mockResolvedValue(expectedCreated)
      const journey: AddressJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId: 999,
        isCheckingAnswers: false,
        mode: 'ADD',
        returnPoint: { url: '/foo-bar' },
        contactNames: { firstName: 'first', lastName: 'last' },
        addressType: 'DO_NOT_KNOW',
        addressLines: { noFixedAddress: false, country: 'ENG' },
        addressMetadata: { fromMonth: '2', fromYear: '2000' },
      }

      const expectedRequest: CreateContactAddressRequest = {
        addressType: undefined,
        flat: undefined,
        property: undefined,
        street: undefined,
        area: undefined,
        cityCode: undefined,
        countyCode: undefined,
        postcode: undefined,
        countryCode: 'ENG',
        verified: false,
        primaryAddress: false,
        mailFlag: false,
        startDate: new Date('2000-02-01Z'),
        endDate: undefined,
        noFixedAddress: false,
        comments: undefined,
        createdBy: user.username,
      }

      // When
      const created = await service.createContactAddress(journey, user)

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
            mode: 'ADD',
            returnPoint: { url: '/foo-bar' },
            contactNames: { firstName: 'first', lastName: 'last' },
            addressType: 'DO_NOT_KNOW',
            addressLines: { noFixedAddress: false, country: 'ENG' },
            addressMetadata: { fromMonth: '01', fromYear: '2000' },
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('updateContactAddress', () => {
    it('should update a contact address from the journey dto with all fields', async () => {
      // Given
      const expectedUpdated: ContactAddressDetails = {
        contactAddressId: 123456,
      }
      apiClient.updateContactAddress.mockResolvedValue(expectedUpdated)
      const journey: AddressJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId: 999,
        contactAddressId: 123456,
        isCheckingAnswers: false,
        mode: 'ADD',
        returnPoint: { url: '/foo-bar' },
        contactNames: { firstName: 'first', lastName: 'last' },
        addressType: 'WORK',
        addressLines: {
          noFixedAddress: true,
          flat: '1a',
          premises: 'My block',
          street: 'A street',
          locality: 'Downtown',
          town: '1234',
          county: 'DEVON',
          postcode: 'PC1 D3',
          country: 'ENG',
        },
        addressMetadata: {
          fromMonth: '2',
          fromYear: '2001',
          toMonth: '12',
          toYear: '2012',
          primaryAddress: 'YES',
          mailAddress: 'YES',
          comments: 'My comments will be super useful',
        },
      }

      const expectedRequest: UpdateContactAddressRequest = {
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
        startDate: new Date('2001-02-01Z'),
        endDate: new Date('2012-12-01Z'),
        noFixedAddress: true,
        comments: 'My comments will be super useful',
        updatedBy: user.username,
      }

      // When
      const updated = await service.updateContactAddress(journey, user)

      // Then
      expect(updated).toStrictEqual(expectedUpdated)
      expect(apiClient.updateContactAddress).toHaveBeenCalledWith(999, 123456, expectedRequest, user)
    })

    it('should update a contact address from the journey dto with only optional fields', async () => {
      // Given
      const expectedUpdated: ContactAddressDetails = {
        contactAddressId: 123456,
      }
      apiClient.updateContactAddress.mockResolvedValue(expectedUpdated)
      const journey: AddressJourney = {
        id: '1',
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId: 999,
        contactAddressId: 123456,
        isCheckingAnswers: false,
        mode: 'ADD',
        returnPoint: { url: '/foo-bar' },
        contactNames: { firstName: 'first', lastName: 'last' },
        addressType: 'DO_NOT_KNOW',
        addressLines: { noFixedAddress: false, country: 'ENG' },
        addressMetadata: { fromMonth: '2', fromYear: '2000' },
      }

      const expectedRequest: UpdateContactAddressRequest = {
        addressType: undefined,
        flat: undefined,
        property: undefined,
        street: undefined,
        area: undefined,
        cityCode: undefined,
        countyCode: undefined,
        postcode: undefined,
        countryCode: 'ENG',
        verified: false,
        primaryAddress: false,
        mailFlag: false,
        startDate: new Date('2000-02-01Z'),
        endDate: undefined,
        noFixedAddress: false,
        comments: undefined,
        updatedBy: user.username,
      }

      // When
      const updated = await service.updateContactAddress(journey, user)

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
            mode: 'ADD',
            returnPoint: { url: '/foo-bar' },
            contactNames: { firstName: 'first', lastName: 'last' },
            addressType: 'DO_NOT_KNOW',
            addressLines: { noFixedAddress: false, country: 'ENG' },
            addressMetadata: { fromMonth: '01', fromYear: '2000' },
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('createContactAddressPhone', () => {
    it('should create a contact address phone with all fields', async () => {
      // Given
      const expectedCreated: ContactAddressPhoneDetails = {
        contactAddressPhoneId: 123,
        contactAddressId: 321,
      }
      apiClient.createContactAddressPhone.mockResolvedValue(expectedCreated)
      const expectedRequest: CreateContactAddressPhoneRequest = {
        contactAddressId: 321,
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        extNumber: '000',
        createdBy: 'user1',
      }

      // When
      const created = await service.createContactAddressPhone(99, 321, user, 'MOB', '0123456789', '000')

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactAddressPhone).toHaveBeenCalledWith(99, 321, expectedRequest, user)
    })

    it('should create a contact address phone with only required fields', async () => {
      // Given
      const expectedCreated: ContactAddressPhoneDetails = {
        contactAddressPhoneId: 123,
        contactAddressId: 321,
      }
      apiClient.createContactAddressPhone.mockResolvedValue(expectedCreated)
      const expectedRequest: CreateContactAddressPhoneRequest = {
        contactAddressId: 321,
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        createdBy: 'user1',
      }

      // When
      const created = await service.createContactAddressPhone(99, 321, user, 'MOB', '0123456789', undefined)

      // Then
      expect(created).toStrictEqual(expectedCreated)
      expect(apiClient.createContactAddressPhone).toHaveBeenCalledWith(99, 321, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.createContactAddressPhone.mockRejectedValue(createError.BadRequest())
      await expect(
        service.createContactAddressPhone(99, 321, user, 'MOB', '0123456789', undefined),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('updateContactAddressPhone', () => {
    it('should update a contact address phone with all fields', async () => {
      // Given
      const expected: ContactAddressPhoneDetails = {
        contactAddressPhoneId: 123,
        contactAddressId: 321,
      }
      apiClient.updateContactAddressPhone.mockResolvedValue(expected)
      const expectedRequest: UpdateContactAddressPhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        extNumber: '000',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactAddressPhone(99, 321, 77, user, 'MOB', '0123456789', '000')

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactAddressPhone).toHaveBeenCalledWith(99, 321, 77, expectedRequest, user)
    })

    it('should update a contact address phone with only required fields', async () => {
      // Given
      const expected: ContactAddressPhoneDetails = {
        contactAddressPhoneId: 123,
        contactAddressId: 321,
      }
      apiClient.updateContactAddressPhone.mockResolvedValue(expected)
      const expectedRequest: UpdateContactAddressPhoneRequest = {
        phoneType: 'MOB',
        phoneNumber: '0123456789',
        updatedBy: 'user1',
      }

      // When
      const updated = await service.updateContactAddressPhone(99, 321, 77, user, 'MOB', '0123456789', undefined)

      // Then
      expect(updated).toStrictEqual(expected)
      expect(apiClient.updateContactAddressPhone).toHaveBeenCalledWith(99, 321, 77, expectedRequest, user)
    })

    it('should handle a bad request', async () => {
      apiClient.updateContactAddressPhone.mockRejectedValue(createError.BadRequest())
      await expect(
        service.updateContactAddressPhone(99, 321, 77, user, 'MOB', '0123456789', undefined),
      ).rejects.toBeInstanceOf(BadRequest)
    })
  })
})
