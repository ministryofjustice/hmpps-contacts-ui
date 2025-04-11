import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import AddContactJourney = journeys.AddContactJourney
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'

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
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    names: {
      lastName: 'last',
      middleNames: 'Middle',
      firstName: 'first',
    },
    dateOfBirth: {
      isKnown: 'NO',
    },
    relationship: {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: true,
      isNextOfKin: true,
    },
    mode: 'NEW',
    pendingAddresses: [
      {
        addressType: 'HOME',
        addressLines: {
          noFixedAddress: false,
          flat: '1a',
          property: 'My block',
          street: 'A street',
          area: 'Downtown',
          cityCode: '7375', // Exeter
          countyCode: 'DEVON', // Devon
          postcode: 'PC1 D3',
          countryCode: 'ENG',
        },
        addressMetadata: {
          fromMonth: '2',
          fromYear: '2001',
          toMonth: '12',
          toYear: '2012',
          primaryAddress: true,
          mailAddress: true,
          comments: 'My comments will be super useful',
        },
        phoneNumbers: [
          {
            type: 'HOME',
            phoneNumber: '4321',
            extension: '99',
          },
        ],
      },
    ],
    newAddress: { addressLines: { noFixedAddress: false, countryCode: 'ENG' } },
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
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/phone/:phoneIdx/delete/:journeyId`, () => {
  it('should render delete page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/1/delete/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete a phone number for an address? - Add a contact - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete a phone number for this address?',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Yes, delete phone number')
    expect($('a:contains("No, do not delete")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_DELETE_ADDRESS_PHONE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })

    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(
      /<strong>Address:<\/strong><br>\n\s+?1a<br>\s+?My block<br>\s+?A street<br>\s+?Downtown<br>\s+?Exeter<br>\s+?Devon<br>\s+?PC1 D3<br>\s+?England/,
    )

    expect($('.phone-number-value').text().trim()).toStrictEqual('4321')
    expect($('.extension-value').text().trim()).toStrictEqual('99')
    expect($('.type-value').text().trim()).toStrictEqual('Home')
  })

  it('should render not found if index is out of range', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/99/delete/${journeyId}`)
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/phone/:phoneIdx/delete/:journeyId', () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/1/delete/${journeyId}`)
      .type('form')
      .send({ comments: 'text' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.pendingAddresses![0]!.phoneNumbers).toBeUndefined()
  })

  it('should return not found page if index is out of range', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/99/delete/${journeyId}`)
      .type('form')
      .send({})
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
