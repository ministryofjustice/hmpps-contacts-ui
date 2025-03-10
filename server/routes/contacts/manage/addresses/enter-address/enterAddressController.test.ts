import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import AddressJourney = journeys.AddressJourney
import AddressLines = journeys.AddressLines
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
    addressType: 'DO_NOT_KNOW',
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
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
    TestData.prisoner({ prisonerNumber, addresses: [{ primaryAddress: true, fullAddress: 'address' }] }),
  )
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/enter-address/:journeyId', () => {
  it('should render address lines page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#country').val()).toStrictEqual('ENG')

    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Enter the address for First Middle Last')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('input[type=radio]:checked').val()).toBeUndefined()
    expect($('a:contains("Automatically copy")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/use-prisoner-address/${journeyId}?returnUrl=/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    )
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDRESS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it.each([
    [true, 'YES'],
    [false, undefined],
  ])(
    'should render previously entered details if no validation errors but there are session values (%s, %s)',
    async (noFixedAddress, expectedChecked) => {
      // Given
      existingJourney.addressLines = {
        noFixedAddress,
        flat: 'My Flat',
        premises: 'My Premises',
        street: 'My Street',
        locality: 'My Locality',
        town: '7375',
        county: 'DEVON',
        postcode: 'My Postcode',
        country: 'SCOT',
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#flat').val()).toStrictEqual('My Flat')
      expect($('#premises').val()).toStrictEqual('My Premises')
      expect($('#street').val()).toStrictEqual('My Street')
      expect($('#locality').val()).toStrictEqual('My Locality')
      expect($('#town').val()).toStrictEqual('7375')
      expect($('#county').val()).toStrictEqual('DEVON')
      expect($('#postcode').val()).toStrictEqual('My Postcode')
      expect($('#country').val()).toStrictEqual('SCOT')
      expect($('input[type=checkbox]:checked').val()).toStrictEqual(expectedChecked)
    },
  )

  it.each([
    [false, 'YES', 'YES'],
    [true, '', undefined],
  ])(
    'should render previously entered details if validation errors even if values in the session (%s, %s, %s)',
    async (noFixedAddressSession, noFixedAddressForm, expectedChecked) => {
      // Given
      const form = {
        noFixedAddress: noFixedAddressForm,
        flat: 'My Flat 2',
        premises: 'My Premises 2',
        street: 'My Street 2',
        locality: 'My Locality 2',
        town: '25343',
        county: 'S.YORKSHIRE',
        postcode: 'My Postcode 2',
        country: 'NI',
      }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
      existingJourney.addressLines = {
        noFixedAddress: noFixedAddressSession,
        flat: 'My Flat',
        premises: 'My Premises',
        street: 'My Street',
        locality: 'My Locality',
        town: '7375',
        county: 'DEVON',
        postcode: 'My Postcode',
        country: 'SCOT',
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#flat').val()).toStrictEqual('My Flat 2')
      expect($('#premises').val()).toStrictEqual('My Premises 2')
      expect($('#street').val()).toStrictEqual('My Street 2')
      expect($('#locality').val()).toStrictEqual('My Locality 2')
      expect($('#town').val()).toStrictEqual('25343')
      expect($('#county').val()).toStrictEqual('S.YORKSHIRE')
      expect($('#postcode').val()).toStrictEqual('My Postcode 2')
      expect($('#country').val()).toStrictEqual('NI')
      expect($('input[type=checkbox]:checked').val()).toStrictEqual(expectedChecked)
    },
  )

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${uuidv4()}`,
      )
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/enter-address/:journeyId', () => {
  it.each([
    ['YES', true],
    [undefined, false],
  ])(
    'should pass to next page and set address in session if there are no validation errors',
    async (formNFA, expectedNFA) => {
      // Given
      delete existingJourney.addressLines

      // When
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
        )
        .type('form')
        .send({
          noFixedAddress: formNFA,
          flat: 'My Flat',
          premises: 'My Premises',
          street: 'My Street',
          locality: 'My Locality',
          town: '7375',
          county: 'DEVON',
          postcode: 'My Postcode',
          country: 'ENG',
        })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
        )

      // Then
      const expected: AddressLines = {
        noFixedAddress: expectedNFA,
        flat: 'My Flat',
        premises: 'My Premises',
        street: 'My Street',
        locality: 'My Locality',
        town: '7375',
        county: 'DEVON',
        postcode: 'My Postcode',
        country: 'ENG',
      }
      expect(session.addressJourneys![journeyId]!.addressLines).toStrictEqual(expected)
    },
  )

  it.each([
    [
      false,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/dates/${journeyId}`,
    ],
    [
      true,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    ],
  ])(
    'should pass to next page and based on checking answers or not',
    async (isCheckingAnswers: boolean, expectedRedirect: string) => {
      existingJourney.isCheckingAnswers = isCheckingAnswers

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
        )
        .type('form')
        .send({
          noFixedAddress: 'YES',
          flat: 'My Flat',
          premises: 'My Premises',
          street: 'My Street',
          locality: 'My Locality',
          town: '7375',
          county: 'DEVON',
          postcode: 'My Postcode',
          country: 'ENG',
        })
        .expect(302)
        .expect('Location', expectedRedirect)
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
      )
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${uuidv4()}`,
      )
      .type('form')
      .send({})
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
