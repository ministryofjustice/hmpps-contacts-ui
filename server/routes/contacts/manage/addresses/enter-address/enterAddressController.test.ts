import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import AddressJourney = journeys.AddressJourney
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import AddressLines = journeys.AddressLines

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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/address/enter-address/:journeyId', () => {
  it.each([
    ['HOME', 'What is the home address for First Middle Last?'],
    ['WORK', 'What is the work address for First Middle Last?'],
    ['BUS', 'What is the business address for First Middle Last?'],
    ['DO_NOT_KNOW', 'What is the address for First Middle Last?'],
  ])(
    'should render address lines page for new address with type %s and expected question %s',
    async (addressType: string, expectedTitle: string) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      existingJourney.addressType = addressType

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(expectedTitle)
      expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`,
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
      auditService.logPageView.mockResolvedValue(null)
      existingJourney.addressLines = {
        noFixedAddress,
        flat: 'My Flat',
        premises: 'My Premises',
        street: 'My Street',
        locality: 'My Locality',
        town: '7375',
        county: 'DEVON',
        postcode: 'My Postcode',
        country: 'ENG',
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`,
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
      expect($('#country').val()).toStrictEqual('ENG')
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
      auditService.logPageView.mockResolvedValue(null)
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
        country: 'ENG',
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`,
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
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${uuidv4()}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/address/enter-address/:journeyId', () => {
  it.each([
    ['YES', true],
    [undefined, false],
  ])(
    'should pass to next page and set address in session if there are no validation errors',
    async (formNFA, expectedNFA) => {
      // Given
      existingJourney.addressLines = undefined

      // When
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`)
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
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/address-metadata/${journeyId}`,
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
      expect(session.addressJourneys[journeyId].addressLines).toStrictEqual(expected)
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${journeyId}`)
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/enter-address/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})