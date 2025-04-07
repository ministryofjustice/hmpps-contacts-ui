import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import AddressJourney = journeys.AddressJourney

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

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
    addressLines: {
      noFixedAddress: false,
      countryCode: 'ENG',
    },
    phoneNumbers: [{ type: 'HOME', phoneNumber: '1234' }],
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
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/phone/:phoneIdx/delete/:journeyId`, () => {
  it('should render delete address phone page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/1/delete/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete a phone number for an address? - Edit contact methods - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete a phone number for this address?',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(/<strong>Address:<\/strong><br>\s+?England/)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Yes, delete phone number')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.DELETE_ADDRESS_PHONE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: 123456,
        prisonerNumber: 'A1234BC',
      },
    })

    expect($('.phone-number-value').text().trim()).toStrictEqual('1234')
    expect($('.extension-value').text().trim()).toStrictEqual('Not provided')
    expect($('.type-value').text().trim()).toStrictEqual('Home')
  })

  it('should raise an error if the contact address phone is missing', async () => {
    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/555/delete/${journeyId}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/1/delete/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/phone/:phoneIdx/delete/:journeyId`, () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/1/delete/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
      )

    expect(session.addressJourneys![journeyId]!.phoneNumbers).toBeUndefined()
  })
})
