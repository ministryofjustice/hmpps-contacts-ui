import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, basicPrisonUser } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { ContactAddressDetails, ContactDetails } from '../../../../../@types/contactsApiClient'
import { AddressJourney } from '../../../../../@types/journeys'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()
const contactsService = MockedService.ContactsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123456
const prisonerContactId = 456789
const contact: ContactDetails = {
  id: contactId,
  isStaff: false,
  interpreterRequired: false,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  employments: [],
  identities: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: basicPrisonUser.username,
  createdTime: '2024-01-01',
}

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
    addressMetadata: {
      fromMonth: '1',
      fromYear: '2001',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
      contactsService,
    },
    userSupplier: () => basicPrisonUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addressJourneys = {}
      session.addressJourneys[journeyId] = existingJourney
    },
  })
  contactsService.getContact.mockResolvedValue(contact)
  contactsService.getContactName.mockResolvedValue(contact)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/check-answers/:journeyId', () => {
  it('should render address check answers page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Check your answers before adding a new address for the contact - Edit contact methods - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before adding a new address for First Middle Last',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to address comments')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/comments/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/manage/123456/relationship/456789/address/cancel/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render address check answers page with minimal address details', async () => {
    // Given
    existingJourney.addressType = 'DO_NOT_KNOW'
    existingJourney.addressLines = {
      noFixedAddress: false,
      countryCode: 'ENG',
    }
    existingJourney.addressMetadata = {
      fromMonth: '1',
      fromYear: '2001',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-address-value').text().trim()).toStrictEqual('England')
    expect($('.check-answers-dates-value').text().trim()).toStrictEqual('From January 2001')
    expect($('.check-answers-flags-value').text().trim()).toStrictEqual('No')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Not provided')
    expect($('dt:contains("Address phone numbers")').next().text().trim()).toStrictEqual('Not provided')
  })

  it('should render address check answers page with all address details', async () => {
    // Given
    existingJourney.addressType = 'HOME'
    existingJourney.addressLines = {
      noFixedAddress: true,
      flat: '1a',
      property: 'My block',
      street: 'A street',
      area: 'Downtown',
      cityCode: '1234',
      countyCode: 'DEVON',
      postcode: 'PC1 D3',
      countryCode: 'ENG',
    }
    existingJourney.addressMetadata = {
      fromMonth: '1',
      fromYear: '2001',
      toMonth: '12',
      toYear: '2012',
      primaryAddress: true,
      mailAddress: false,
      comments: 'My comments will be super useful',
    }
    existingJourney.phoneNumbers = [
      {
        type: 'HOME',
        phoneNumber: '123456789',
        extension: '123',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Home address')
    expect($('.check-answers-address-value').html()!.trim()).toMatch(
      /No fixed address<br>1a<br>\s+?My block<br>\s+?A street<br>\s+?Downtown<br>\s+?Devon<br>\s+?PC1 D3<br>\s+?England/,
    )
    expect($('.check-answers-dates-value').text().trim()).toStrictEqual('From January 2001 to December 2012')
    expect($('.check-answers-flags-value').text().trim()).toStrictEqual('Primary address')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('My comments will be super useful')
    expect($('dt:contains("Address phone numbers")').parent().next().text().trim()).toMatch(
      /Home(\s|\n)+?123456789, ext\. 123/,
    )
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADDRESS_CHECK_ANSWERS_PAGE, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123456',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/check-answers/:journeyId', () => {
  it('should create address, remove from the session and return to journey return point', async () => {
    // Given
    contactsService.createContactAddress.mockResolvedValue({} as ContactAddressDetails)

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/A1234BC/contacts/manage/123456/relationship/456789`)

    // Then
    expect(session.addressJourneys![journeyId]).toBeUndefined()
    expect(contactsService.createContactAddress).toHaveBeenCalledWith(
      existingJourney,
      basicPrisonUser,
      expect.any(String),
    )
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${uuidv4()}`,
      )
      .type('form')
      .send({})
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
