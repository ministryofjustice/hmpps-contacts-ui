import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import AddressJourney = journeys.AddressJourney
import { MockedService } from '../../../../../testutils/mockedServices'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()

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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/select-type/:journeyId', () => {
  it('should render address type page for new address', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What type of address are you adding for the contact? - Edit contact methods - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('.main-heading').first().text().trim()).toStrictEqual(
      'What type of address are you adding for First Middle Last? (optional)',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/123456/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('input[type=radio]:checked').val()).toBeUndefined()
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ADDRESS_TYPE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: 123456,
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it.each(['HOME', 'WORK', 'BUS', 'DO_NOT_KNOW', undefined])(
    'should render previously entered details if no validation errors but there are session values (%s)',
    async (addressType: string | undefined) => {
      // Given
      existingJourney.addressType = addressType

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual(addressType)
    },
  )

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/select-type/:journeyId', () => {
  it.each([
    [
      false,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    ],
    [
      true,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    ],
  ])(
    'should pass to next page and set type in session if there are no validation errors (%s, %s)',
    async (isCheckingAnswers: boolean, expectedUrl: string) => {
      // Given
      delete existingJourney.addressType
      existingJourney.isCheckingAnswers = isCheckingAnswers

      // When
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journeyId}`,
        )
        .type('form')
        .send({ addressType: 'HOME' })
        .expect(302)
        .expect('Location', expectedUrl)

      // Then
      expect(session.addressJourneys![journeyId]!.addressType).toStrictEqual('HOME')
    },
  )

  it('should accept empty form', async () => {
    // Given
    delete existingJourney.addressType
    existingJourney.isCheckingAnswers = false

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
      )

    // Then
    expect(session.addressJourneys![journeyId]!.addressType).toBeUndefined()
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${uuidv4()}`,
      )
      .type('form')
      .send({})
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
