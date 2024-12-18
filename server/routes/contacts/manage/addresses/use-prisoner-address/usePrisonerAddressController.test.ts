import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import PrisonerAddressService from '../../../../../services/prisonerAddressService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import { PrisonApiAddress } from '../../../../../data/prisonApiTypes'
import AddressJourney = journeys.AddressJourney

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerAddressService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonerAddressService = new PrisonerAddressService(null) as jest.Mocked<PrisonerAddressService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123456
let existingJourney: AddressJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    contactId,
    returnPoint: { url: '/foo-bar' },
    isCheckingAnswers: false,
    mode: 'ADD',
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
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(
    (_: ReferenceCodeType, code: string, __: Express.User) => {
      if (code === 'WORK') {
        return Promise.resolve('Work address')
      }
      if (code === 'BUS') {
        return Promise.resolve('Business address')
      }
      if (code === 'HOME') {
        return Promise.resolve('Home address')
      }
      return Promise.reject()
    },
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/address/use-prisoner-address/:journeyId', () => {
  it('should replace the address lines with prisoner address primary address if found', async () => {
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.addressLines = {
      noFixedAddress: false,
      flat: 'My Flat',
      premises: 'My Premises',
      street: 'My Street',
      locality: 'My Locality',
      town: '7375',
      county: 'DEVON',
      postcode: 'My Postcode',
      country: 'SCOT',
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
      town: '9999',
      county: 'CORNWALL',
      postalCode: 'Prisoner Postcode',
      country: 'WALES',
    }
    prisonerAddressService.getPrimaryAddress.mockResolvedValue(prisonerAddress)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/use-prisoner-address/${journeyId}?returnUrl=/foo`,
      )
      .expect(302)
      .expect('Location', `/foo`)

    expect(existingJourney.addressLines).toStrictEqual({
      noFixedAddress: true,
      flat: 'Prisoner Flat',
      premises: 'Prisoner Premises',
      street: 'Prisoner Street',
      locality: 'Prisoner Locality',
      town: '9999',
      county: 'CORNWALL',
      postcode: 'Prisoner Postcode',
      country: 'WALES',
    })
  })

  it('should not replace the address if the primary address is not found', async () => {
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.addressLines = {
      noFixedAddress: false,
      flat: 'My Flat',
      premises: 'My Premises',
      street: 'My Street',
      locality: 'My Locality',
      town: '7375',
      county: 'DEVON',
      postcode: 'My Postcode',
      country: 'SCOT',
    }
    prisonerAddressService.getPrimaryAddress.mockResolvedValue(null)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/use-prisoner-address/${journeyId}?returnUrl=/foo`,
      )
      .expect(302)
      .expect('Location', `/foo`)

    expect(existingJourney.addressLines).toStrictEqual({
      noFixedAddress: false,
      flat: 'My Flat',
      premises: 'My Premises',
      street: 'My Street',
      locality: 'My Locality',
      town: '7375',
      county: 'DEVON',
      postcode: 'My Postcode',
      country: 'SCOT',
    })
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerAddressService.getPrimaryAddress.mockResolvedValue(null)

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/use-prisoner-address/${journeyId}?returnUrl=/foo`,
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
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/use-prisoner-address/${uuidv4()}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
