import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import AddressJourney = journeys.AddressJourney

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
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
    contactNames: {
      lastName: 'last',
      middleNames: 'middle',
      firstName: 'first',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addressJourneys = {}
      session.addressJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/address/select-type/:journeyId', () => {
  it('should render address type page for new address', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What type of address do you want to add for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('input[type=radio]:checked').val()).toBeUndefined()
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ADDRESS_TYPE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it.each(['HOME', 'WORK', 'BUS', 'DO_NOT_KNOW'])(
    'should render previously entered details if no validation errors but there are session values (%s)',
    async (addressType: string) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      existingJourney.addressType = addressType

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual(addressType)
    },
  )

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${uuidv4()}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/address/select-type/:journeyId', () => {
  it.each([
    [false, `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`],
    [true, `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/check-answers/${journeyId}`],
  ])(
    'should pass to next page and set type in session if there are no validation errors (%s, %s)',
    async (isCheckingAnswers: boolean, expectedUrl: string) => {
      // Given
      existingJourney.addressType = undefined
      existingJourney.isCheckingAnswers = isCheckingAnswers

      // When
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journeyId}`)
        .type('form')
        .send({ addressType: 'HOME' })
        .expect(302)
        .expect('Location', expectedUrl)

      // Then
      expect(session.addressJourneys[journeyId].addressType).toStrictEqual('HOME')
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journeyId}`)
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
