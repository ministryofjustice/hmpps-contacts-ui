import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
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

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/new/dates/:journeyId`, () => {
  it('should render enter address dates page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Enter the dates for the contact’s use of an address - Add a contact - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual('Enter the dates for First Middle Last’s use of this address')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(/<strong>Address:<\/strong><br>\s+?England/)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ENTER_ADDRESS_DATES_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.newAddress!.addressMetadata = {
      fromMonth: '1',
      fromYear: '1999',
      toMonth: '12',
      toYear: '2077',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#fromMonth').val()).toStrictEqual(existingJourney.newAddress!.addressMetadata.fromMonth)
    expect($('#fromYear').val()).toStrictEqual(existingJourney.newAddress!.addressMetadata.fromYear)
    expect($('#toMonth').val()).toStrictEqual(existingJourney.newAddress!.addressMetadata.toMonth)
    expect($('#toYear').val()).toStrictEqual(existingJourney.newAddress!.addressMetadata.toYear)
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      fromMonth: 'a',
      fromYear: 'b',
      toMonth: 'c',
      toYear: 'd',
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
    existingJourney.newAddress!.addressMetadata = {
      fromMonth: '1',
      fromYear: '1999',
      toMonth: '12',
      toYear: '2077',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#fromMonth').val()).toStrictEqual(form.fromMonth)
    expect($('#fromYear').val()).toStrictEqual(form.fromYear)
    expect($('#toMonth').val()).toStrictEqual(form.toMonth)
    expect($('#toYear').val()).toStrictEqual(form.toYear)
  })
})

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/dates/:journeyId`, () => {
  it('should render enter address dates page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual('Enter the dates for First Middle Last’s use of this address')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(
      /<strong>Address:<\/strong><br>\n\s+?1a<br>\s+?My block<br>\s+?A street<br>\s+?Downtown<br>\s+?Exeter<br>\s+?Devon<br>\s+?PC1 D3<br>\s+?England/,
    )
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ENTER_ADDRESS_DATES_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
    expect($('#fromMonth').val()).toStrictEqual(existingJourney.pendingAddresses![0]!.addressMetadata!.fromMonth)
    expect($('#fromYear').val()).toStrictEqual(existingJourney.pendingAddresses![0]!.addressMetadata!.fromYear)
    expect($('#toMonth').val()).toStrictEqual(existingJourney.pendingAddresses![0]!.addressMetadata!.toMonth)
    expect($('#toYear').val()).toStrictEqual(existingJourney.pendingAddresses![0]!.addressMetadata!.toYear)
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      fromMonth: 'a',
      fromYear: 'b',
      toMonth: 'c',
      toYear: 'd',
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#fromMonth').val()).toStrictEqual(form.fromMonth)
    expect($('#fromYear').val()).toStrictEqual(form.fromYear)
    expect($('#toMonth').val()).toStrictEqual(form.toMonth)
    expect($('#toYear').val()).toStrictEqual(form.toYear)
  })

  it('should render not found if index is out of range', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/2/dates/${journeyId}`)
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/dates/:journeyId', () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}`)
      .type('form')
      .send({ fromMonth: '11', fromYear: '1999' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/primary-or-postal/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.newAddress!.addressMetadata!.fromMonth).toStrictEqual('11')
    expect(session.addContactJourneys![journeyId]!.newAddress!.addressMetadata!.fromYear).toStrictEqual('1999')
  })

  it('should update journey data and bounce back', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/dates/${journeyId}`)
      .type('form')
      .send({ fromMonth: '11', fromYear: '1999' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.pendingAddresses![0]!.addressMetadata!.fromMonth).toStrictEqual('11')
    expect(session.addContactJourneys![journeyId]!.pendingAddresses![0]!.addressMetadata!.fromYear).toStrictEqual(
      '1999',
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}`)
      .type('form')
      .send({ fromMonth: 'a'.repeat(300) })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/dates/${journeyId}#`)
  })

  it('should return not found page if index is out of range', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/99/dates/${journeyId}`)
      .type('form')
      .send({ fromMonth: '11', fromYear: '1999' })
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
