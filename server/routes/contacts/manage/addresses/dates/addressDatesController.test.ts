import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  authorisingUser,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { AddressJourney } from '../../../../../@types/journeys'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()

let app: Express
let session: Partial<SessionData>
let currentUser: HmppsUser
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123456
const prisonerContactId = 456789
let existingJourney: AddressJourney

beforeEach(() => {
  currentUser = adminUser
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
      flat: '1a',
      property: 'My block',
      street: 'A street',
      area: 'Downtown',
      cityCode: '7375', // Exeter
      countyCode: 'DEVON', // Devon
      postcode: 'PC1 D3',
      countryCode: 'ENG',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
    },
    userSupplier: () => currentUser,
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/dates/:journeyId', () => {
  it('should render address dates page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Enter the dates for the contact’s use of an address - Edit contact methods - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('h1').first().text().trim()).toStrictEqual('Enter the dates for First Middle Last’s use of this address')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(
      /<strong>Address:<\/strong><br>\n\s+?1a<br>\s+?My block<br>\s+?A street<br>\s+?Downtown<br>\s+?Exeter<br>\s+?Devon<br>\s+?PC1 D3<br>\s+?England/,
    )
    expect(
      $(
        'div:contains("This has been set to the current month and year. You can change this to a past or future date as required.")',
      ).text(),
    ).toBeTruthy()

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDRESS_DATES_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123456',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should back to CYA page when checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.addressMetadata = {
      fromMonth: '1',
      fromYear: '1999',
      toMonth: '12',
      toYear: '2077',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#fromMonth').val()).toStrictEqual(existingJourney.addressMetadata.fromMonth)
    expect($('#fromYear').val()).toStrictEqual(existingJourney.addressMetadata.fromYear)
    expect($('#toMonth').val()).toStrictEqual(existingJourney.addressMetadata.toMonth)
    expect($('#toYear').val()).toStrictEqual(existingJourney.addressMetadata.toYear)
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
    existingJourney.addressMetadata = {
      fromMonth: '1',
      fromYear: '1999',
      toMonth: '12',
      toYear: '2077',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#fromMonth').val()).toStrictEqual(form.fromMonth)
    expect($('#fromYear').val()).toStrictEqual(form.fromYear)
    expect($('#toMonth').val()).toStrictEqual(form.toMonth)
    expect($('#toYear').val()).toStrictEqual(form.toYear)
  })

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
      )
      .expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/dates/:journeyId', () => {
  it.each([
    [
      false,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/primary-or-postal/${journeyId}`,
    ],
    [
      true,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    ],
  ])(
    'should update journey data and pass to next page and based on checking answers or not',
    async (isCheckingAnswers: boolean, expectedRedirect: string) => {
      existingJourney.isCheckingAnswers = isCheckingAnswers

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
        )
        .type('form')
        .send({
          fromMonth: '01',
          fromYear: '1999',
        })
        .expect(302)
        .expect('Location', expectedRedirect)

      expect(session.addressJourneys![journeyId]!.addressMetadata?.fromMonth).toStrictEqual('1')
      expect(session.addressJourneys![journeyId]!.addressMetadata?.fromYear).toStrictEqual('1999')
    },
  )

  it.each([
    ['01', '', '', ''],
    ['', '1999', '', ''],
    ['01', '1999', '12', ''],
    ['01', '1999', '', '2077'],
    ['error', '1999', '12', '2077'],
    ['01', 'error', '12', '2077'],
    ['01', '1999', 'error', '2077'],
    ['01', '1999', '12', 'error'],
    ['01', '1999', '01', '1977'],
  ])(
    'should return to enter page if there are validation errors - fromMonth: %s fromYear: %s toMonth: %s toYear: %s',
    async (fromMonth, fromYear, toMonth, toYear) => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
        )
        .type('form')
        .send({ fromMonth, fromYear, toMonth, toYear })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}#`,
        )
    },
  )

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${uuidv4()}`,
      )
      .type('form')
      .send({})
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
      )
      .type('form')
      .send({
        fromMonth: '01',
        fromYear: '1999',
      })
      .expect(expectedStatus)
  })
})
