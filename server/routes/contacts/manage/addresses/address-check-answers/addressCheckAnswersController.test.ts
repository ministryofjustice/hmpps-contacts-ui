import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import AddressJourney = journeys.AddressJourney
import { MockedService } from '../../../../../testutils/mockedServices'
import ContactDetails = contactsApiClientTypes.ContactDetails

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
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: user.username,
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
    mode: 'ADD',
    contactNames: {
      lastName: 'last',
      middleNames: 'middle',
      firstName: 'first',
    },
    addressType: 'DO_NOT_KNOW',
    addressLines: {
      noFixedAddress: false,
      country: 'ENG',
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
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addressJourneys = {}
      session.addressJourneys[journeyId] = existingJourney
    },
  })
  contactsService.getContact.mockResolvedValue(contact)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(
    (type: ReferenceCodeType, code: string, __: Express.User) => {
      if (type === ReferenceCodeType.ADDRESS_TYPE) {
        if (code === 'WORK') {
          return Promise.resolve('Work address')
        }
        if (code === 'BUS') {
          return Promise.resolve('Business address')
        }
        if (code === 'HOME') {
          return Promise.resolve('Home address')
        }
      } else if (type === ReferenceCodeType.CITY) {
        return Promise.resolve('Exeter')
      } else if (type === ReferenceCodeType.COUNTY) {
        return Promise.resolve('Devon')
      } else if (type === ReferenceCodeType.COUNTRY) {
        return Promise.resolve('England')
      }
      return Promise.reject()
    },
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/check-answers/:journeyId', () => {
  it.each([
    ['HOME', 'Check your answers before saving the new home address for First Middle Last'],
    ['WORK', 'Check your answers before saving the new work address for First Middle Last'],
    ['BUS', 'Check your answers before saving the new business address for First Middle Last'],
    ['DO_NOT_KNOW', 'Check your answers before saving the new address for First Middle Last'],
  ])(
    'should render address check answers page with type %s and expected question %s',
    async (addressType: string, expectedTitle: string) => {
      // Given
      existingJourney.addressType = addressType

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(expectedTitle)
      expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/123456/relationship/456789/edit-contact-methods',
      )
      expect($('[data-qa=back-link]')).toHaveLength(0)
      const breadcrumbLinks = $('[data-qa=breadcrumbs] a')
      expect(breadcrumbLinks.eq(0).attr('href')).toStrictEqual('http://localhost:3001')
      expect(breadcrumbLinks.eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
      expect(breadcrumbLinks.eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    },
  )

  it('should render address check answers page with minimal address details', async () => {
    // Given
    existingJourney.addressType = 'DO_NOT_KNOW'
    existingJourney.addressLines = {
      noFixedAddress: false,
      country: 'ENG',
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
    expect($('.check-answers-nfa-value').text().trim()).toStrictEqual('No')
    expect($('.check-answers-from-date-value').text().trim()).toStrictEqual('January 2001')
    expect($('.check-answers-to-date-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-primary-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-mail-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Not provided')
  })

  it('should render address check answers page with all address details', async () => {
    // Given
    existingJourney.addressType = 'HOME'
    existingJourney.addressLines = {
      noFixedAddress: true,
      flat: '1a',
      premises: 'My block',
      street: 'A street',
      locality: 'Downtown',
      town: '1234',
      county: 'DEVON',
      postcode: 'PC1 D3',
      country: 'ENG',
    }
    existingJourney.addressMetadata = {
      fromMonth: '1',
      fromYear: '2001',
      toMonth: '12',
      toYear: '2012',
      primaryAddress: 'YES',
      mailAddress: 'NO',
      comments: 'My comments will be super useful',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Home address')
    expect($('.check-answers-address-value').html()!.trim()).toStrictEqual(
      'Flat 1a, My block, A street<br>Downtown<br>Exeter<br>Devon<br>PC1 D3<br>England',
    )
    expect($('.check-answers-nfa-value').text().trim()).toStrictEqual('Yes')
    expect($('.check-answers-from-date-value').text().trim()).toStrictEqual('January 2001')
    expect($('.check-answers-to-date-value').text().trim()).toStrictEqual('December 2012')
    expect($('.check-answers-primary-value').text().trim()).toStrictEqual('Yes')
    expect($('.check-answers-mail-value').text().trim()).toStrictEqual('No')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('My comments will be super useful')
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
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${uuidv4()}`,
      )
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/check-answers/:journeyId', () => {
  it('should create address, remove from the session and return to journey return point', async () => {
    // Given
    contactsService.createContactAddress.mockResolvedValue({})

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
    expect(contactsService.createContactAddress).toHaveBeenCalledWith(existingJourney, user)
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${uuidv4()}`,
      )
      .type('form')
      .send({})
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
