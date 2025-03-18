import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import PrisonerAddressService from '../../../../../services/prisonerAddressService'
import TestData from '../../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { PrisonApiAddress } from '../../../../../data/prisonApiTypes'
import AddressJourney = journeys.AddressJourney
import { MockedService } from '../../../../../testutils/mockedServices'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerAddressService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()
// @ts-expect-error passing null param into mocked service
const prisonerAddressService = new PrisonerAddressService(null) as jest.Mocked<PrisonerAddressService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123456
const prisonerContactId = 456789

let existingJourney: AddressJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    contactId,
    isCheckingAnswers: false,
    contactNames: {
      lastName: 'last',
      middleNames: 'middle',
      firstName: 'first',
    },
    addressType: 'DO_NOT_KNOW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
      prisonerAddressService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addressJourneys = {}
      session.addressJourneys[journeyId] = existingJourney
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/use-prisoner-address/:journeyId`, () => {
  it('should replace the address lines with prisoner address primary address if found', async () => {
    existingJourney.addressLines = {
      noFixedAddress: false,
      flat: 'My Flat',
      property: 'My Premises',
      street: 'My Street',
      area: 'My Locality',
      cityCode: '7375',
      countyCode: 'DEVON',
      postcode: 'My Postcode',
      countryCode: 'SCOT',
    }
    const prisonerAddress: PrisonApiAddress = {
      addressId: 1,
      addressType: 'foo',
      primary: true,
      mail: true,
      noFixedAddress: true,
      flat: 'Prisoner Flat',
      premise: 'Prisoner Premises',
      street: 'Prisoner Street',
      locality: 'Prisoner Locality',
      town: 'Falmouth',
      townCode: '9999',
      county: 'Cornwall',
      countyCode: 'CORNWALL',
      postalCode: 'Prisoner Postcode',
      country: 'Wales',
      countryCode: 'WALES',
    }
    prisonerAddressService.getPrimaryAddress.mockResolvedValue(prisonerAddress)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/use-prisoner-address/${journeyId}?returnUrl=/foo`,
      )
      .expect(302)
      .expect('Location', `/foo`)

    expect(existingJourney.addressLines).toStrictEqual({
      noFixedAddress: true,
      flat: 'Prisoner Flat',
      property: 'Prisoner Premises',
      street: 'Prisoner Street',
      area: 'Prisoner Locality',
      cityCode: '9999',
      countyCode: 'CORNWALL',
      postcode: 'Prisoner Postcode',
      countryCode: 'WALES',
    })
  })

  it('should not replace the address if the primary address is not found', async () => {
    existingJourney.addressLines = {
      noFixedAddress: false,
      flat: 'My Flat',
      property: 'My Premises',
      street: 'My Street',
      area: 'My Locality',
      cityCode: '7375',
      countyCode: 'DEVON',
      postcode: 'My Postcode',
      countryCode: 'SCOT',
    }
    prisonerAddressService.getPrimaryAddress.mockResolvedValue(undefined)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/use-prisoner-address/${journeyId}?returnUrl=/foo`,
      )
      .expect(302)
      .expect('Location', `/foo`)

    expect(existingJourney.addressLines).toStrictEqual({
      noFixedAddress: false,
      flat: 'My Flat',
      property: 'My Premises',
      street: 'My Street',
      area: 'My Locality',
      cityCode: '7375',
      countyCode: 'DEVON',
      postcode: 'My Postcode',
      countryCode: 'SCOT',
    })
  })

  it('should call the audit service for the page view', async () => {
    // Given
    prisonerAddressService.getPrimaryAddress.mockResolvedValue(undefined)

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/use-prisoner-address/${journeyId}?returnUrl=/foo`,
      )
      .expect(302)
      .expect('Location', `/foo`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.USE_PRISONER_ADDRESS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render not found if there is no journey in the session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/use-prisoner-address/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
