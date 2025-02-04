import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import ContactDetails = contactsApiClientTypes.ContactDetails
import AddressJourney = journeys.AddressJourney
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/contactsService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<AddressJourney>
const prisonerNumber = 'A1234BC'
const contactId = 123
const contact: ContactDetails = {
  id: contactId,
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: user.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  preExistingJourneysToAddToSession = []
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.addressJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: AddressJourney) => {
          session.addressJourneys![journey.id] = journey
        })
      }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/address/add/start', () => {
  it('should create the journey and redirect to select type page', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/add/start?returnUrl=/foo`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADDRESS_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type`,
    )
    expect(Object.entries(session.addressJourneys!)).toHaveLength(1)
    const journey = Object.values(session.addressJourneys!)[0]!
    expect(journey.returnPoint).toStrictEqual({ url: '/foo' })
    expect(journey.mode).toStrictEqual('ADD')
    expect(journey.addressType).toBeUndefined()
    expect(journey.addressLines).toBeUndefined()
    expect(journey.addressMetadata).toBeUndefined()
    expect(journey.contactNames).toStrictEqual({
      title: '',
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
    })
  })

  it('should not remove any existing address journeys in the session', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        returnPoint: { url: '/foo-bar' },
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        mode: 'ADD',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/add/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(Object.entries(session.addressJourneys!)).toHaveLength(2)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(session.addressJourneys![newId]!.id).toEqual(newId)
    expect(session.addressJourneys![newId]!.lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        mode: 'ADD',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        mode: 'ADD',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        mode: 'ADD',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        mode: 'ADD',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        mode: 'ADD',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/add/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(Object.keys(session.addressJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/address/edit/:contactAddressId/start', () => {
  it('should create the journey with prepopulated all fields and redirect to select type page', async () => {
    // Given
    contactsService.getContact.mockResolvedValue({
      ...contact,
      addresses: [
        TestData.address({
          contactAddressId: 888,
          noFixedAddress: true,
          flat: '1a',
          property: 'My block',
          street: 'A street',
          area: 'Downtown',
          cityCode: '1234',
          cityDescription: 'Exeter',
          countyCode: 'DEVON',
          countyDescription: 'Devon',
          postcode: 'PC1 D3',
          countryCode: 'ENG',
          countryDescription: 'England',
          startDate: '2010-09-01',
          endDate: '2025-04-01',
          primaryAddress: true,
          mailFlag: true,
          comments: 'My comments will be super useful',
        }),
      ],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/edit/888/start?returnUrl=/foo`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type`,
    )
    expect(Object.entries(session.addressJourneys!)).toHaveLength(1)
    const journey = Object.values(session.addressJourneys!)[0]!
    expect(journey.returnPoint).toStrictEqual({ url: '/foo' })
    expect(journey.mode).toStrictEqual('EDIT')
    expect(journey.contactAddressId).toStrictEqual(888)
    expect(journey.addressType).toStrictEqual('HOME')
    expect(journey.addressLines).toStrictEqual({
      noFixedAddress: true,
      flat: '1a',
      premises: 'My block',
      street: 'A street',
      locality: 'Downtown',
      town: '1234',
      county: 'DEVON',
      postcode: 'PC1 D3',
      country: 'ENG',
    })
    expect(journey.addressMetadata).toStrictEqual({
      fromMonth: '9',
      fromYear: '2010',
      toMonth: '4',
      toYear: '2025',
      primaryAddress: 'YES',
      mailAddress: 'YES',
      comments: 'My comments will be super useful',
    })
    expect(journey.contactNames).toStrictEqual({
      title: '',
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
    })
  })

  it('should create the journey with prepopulated minimal fields and redirect to select type page', async () => {
    // Given
    contactsService.getContact.mockResolvedValue({
      ...contact,
      addresses: [
        {
          ...TestData.address({
            contactAddressId: 888,
            noFixedAddress: false,
            countryCode: 'ENG',
            countryDescription: 'England',
            endDate: undefined,
            primaryAddress: false,
            mailFlag: false,
          }),
          startDate: undefined,
          flat: undefined,
          property: undefined,
          street: undefined,
          area: undefined,
          cityCode: undefined,
          cityDescription: undefined,
          countyCode: undefined,
          countyDescription: undefined,
          postcode: undefined,
          addressType: undefined,
          comments: undefined,
        },
      ],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/edit/888/start?returnUrl=/foo`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type`,
    )
    expect(Object.entries(session.addressJourneys!)).toHaveLength(1)
    const journey = Object.values(session.addressJourneys!)[0]!
    expect(journey.returnPoint).toStrictEqual({ url: '/foo' })
    expect(journey.mode).toStrictEqual('EDIT')
    expect(journey.contactAddressId).toStrictEqual(888)
    expect(journey.addressType).toStrictEqual('DO_NOT_KNOW')
    expect(journey.addressLines).toStrictEqual({
      noFixedAddress: false,
      flat: undefined,
      premises: undefined,
      street: undefined,
      locality: undefined,
      town: undefined,
      county: undefined,
      postcode: undefined,
      country: 'ENG',
    })
    expect(journey.addressMetadata).toStrictEqual({
      fromMonth: undefined,
      fromYear: undefined,
      toMonth: undefined,
      toYear: undefined,
      primaryAddress: 'NO',
      mailAddress: 'NO',
      comments: undefined,
    })
    expect(journey.contactNames).toStrictEqual({
      title: '',
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
    })
  })

  it('should return 404 if address with id not found', async () => {
    // Given
    contactsService.getContact.mockResolvedValue({
      ...contact,
      addresses: [
        TestData.address({
          contactAddressId: 888,
        }),
      ],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/edit/999/start?returnUrl=/foo`,
    )

    // Then
    expect(response.status).toEqual(404)
  })
})
