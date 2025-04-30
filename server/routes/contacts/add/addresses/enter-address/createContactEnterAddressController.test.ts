import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, basicPrisonUser } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../../@types/journeys'

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
    userSupplier: () => basicPrisonUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
    TestData.prisoner({ prisonerNumber, addresses: [{ primaryAddress: true, fullAddress: 'address' }] }),
  )
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/new/enter-address/:journeyId`, () => {
  it('should render enter address page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Enter an address for the contact - Add a contact - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual('Enter the address for First Middle Last')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ENTER_ADDRESS_PAGE, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
    expect($('a:contains("Automatically copy the prisoner’s primary address into this page")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/use-prisoner-address/${journeyId}?returnUrl=/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`,
    )
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.newAddress!.addressLines = {
      noFixedAddress: false,
      street: 'My Street',
      countryCode: 'ENG',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#street').val()).toStrictEqual('My Street')
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      street: 'a'.repeat(300),
      countryCode: 'ENG',
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
    existingJourney.newAddress!.addressLines = {
      noFixedAddress: false,
      street: 'My Street',
      countryCode: 'ENG',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#street').val()).toStrictEqual(form.street)
  })
})

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/enter-address/:journeyId`, () => {
  it('should render enter address page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual('Enter the address for First Middle Last')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ENTER_ADDRESS_PAGE, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })

    expect($('a:contains("Automatically copy the prisoner’s primary address into this page")').text()).toBeFalsy()

    const addressLines = existingJourney.pendingAddresses![0]!.addressLines!
    expect($('#street').val()).toStrictEqual(addressLines.street)
    expect($('#property').val()).toStrictEqual(addressLines.property)
    expect($('#area').val()).toStrictEqual(addressLines.area)
    expect($('#cityCode').val()).toStrictEqual(addressLines.cityCode)
    expect($('#countyCode').val()).toStrictEqual(addressLines.countyCode)
    expect($('#postcode').val()).toStrictEqual(addressLines.postcode)
    expect($('#countryCode').val()).toStrictEqual(addressLines.countryCode)
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      street: 'a'.repeat(300),
      countryCode: 'ENG',
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    const addressLines = existingJourney.pendingAddresses![0]!.addressLines!
    expect($('#street').val()).toStrictEqual(form.street)
    expect($('#countryCode').val()).toStrictEqual(form.countryCode)
    expect($('#property').val()).toStrictEqual(addressLines.property)
    expect($('#area').val()).toStrictEqual(addressLines.area)
    expect($('#cityCode').val()).toStrictEqual(addressLines.cityCode)
    expect($('#countyCode').val()).toStrictEqual(addressLines.countyCode)
    expect($('#postcode').val()).toStrictEqual(addressLines.postcode)
  })

  it('should render not found if index is out of range', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/2/enter-address/${journeyId}`)
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/enter-address/:journeyId', () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`)
      .type('form')
      .send({ countryCode: 'ENG' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.newAddress!.addressLines!).toStrictEqual({
      noFixedAddress: false,
      countryCode: 'ENG',
    })
  })

  it('should update journey data and bounce back', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/enter-address/${journeyId}`)
      .type('form')
      .send({ countryCode: 'ENG' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.pendingAddresses![0]!.addressLines!).toStrictEqual({
      noFixedAddress: false,
      countryCode: 'ENG',
    })
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}#`)
  })

  it('should return not found page if index is out of range', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/99/enter-address/${journeyId}`)
      .type('form')
      .send({ countryCode: 'ENG' })
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
