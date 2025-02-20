import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import AddressJourney = journeys.AddressJourney
import YesOrNo = journeys.YesOrNo
import AddressMetadata = journeys.AddressMetadata
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/address-metadata/:journeyId', () => {
  it.each([
    ['HOME', 'Provide further details about the home address for First Middle Last'],
    ['WORK', 'Provide further details about the work address for First Middle Last'],
    ['BUS', 'Provide further details about the business address for First Middle Last'],
    ['DO_NOT_KNOW', 'Provide further details about the address for First Middle Last'],
  ])(
    'should render address metadata page for new address with type %s and expected question %s',
    async (addressType: string, expectedTitle: string) => {
      // Given
      existingJourney.addressType = addressType

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(expectedTitle)
      expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
        `/prisoner/A1234BC/contacts/manage/123456/relationship/456789/address/enter-address/${journeyId}`,
      )
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    },
  )

  it('should show entered address', async () => {
    // Given
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
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=address-reference]').first().html()!.trim()).toStrictEqual(
      'Flat 1a, My block, A street<br>Downtown<br>Exeter<br>Devon<br>PC1 D3<br>England',
    )
  })

  it('should call the audit service for the page view', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDRESS_METADATA_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it.each([
    ['ADD', 'Continue'],
    ['EDIT', 'Confirm and save'],
  ])('should label the continue button correctly', async (mode, expected: string) => {
    // Given
    existingJourney.mode = mode as 'ADD' | 'EDIT'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual(expected)
  })

  it.each([
    ['YES', 'Yes'],
    ['NO', 'No'],
  ])(
    'should render previously entered details if no validation errors but there are session values',
    async (option, radioSuffix: string) => {
      // Given
      existingJourney.addressMetadata = {
        fromMonth: '09',
        fromYear: '2009',
        toMonth: '12',
        toYear: '2012',
        primaryAddress: option as YesOrNo,
        mailAddress: option as YesOrNo,
        comments: 'Some comments',
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#fromMonth').val()).toStrictEqual('09')
      expect($('#fromYear').val()).toStrictEqual('2009')
      expect($('#toMonth').val()).toStrictEqual('12')
      expect($('#toYear').val()).toStrictEqual('2012')
      expect($(`#primaryAddress${radioSuffix}`).attr('checked')).toStrictEqual('checked')
      expect($(`#mailAddress${radioSuffix}`).attr('checked')).toStrictEqual('checked')
      expect($('#comments').val()).toStrictEqual('Some comments')
    },
  )

  it.each([
    ['NO', 'YES', 'Yes'],
    ['YES', 'NO', 'No'],
  ])(
    'should render previously entered details if validation errors even if values in the session (%s, %s, %s)',
    async (previousOption, newOption, radioSuffix: string) => {
      // Given
      const form = {
        fromMonth: '10',
        fromYear: '2010',
        toMonth: '11',
        toYear: '2011',
        primaryAddress: newOption,
        mailAddress: newOption,
        comments: 'Updated comments',
      }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
      existingJourney.addressMetadata = {
        fromMonth: '09',
        fromYear: '2009',
        toMonth: '12',
        toYear: '2012',
        primaryAddress: previousOption as YesOrNo,
        mailAddress: previousOption as YesOrNo,
        comments: 'Some comments',
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#fromMonth').val()).toStrictEqual('10')
      expect($('#fromYear').val()).toStrictEqual('2010')
      expect($('#toMonth').val()).toStrictEqual('11')
      expect($('#toYear').val()).toStrictEqual('2011')
      expect($(`#primaryAddress${radioSuffix}`).attr('checked')).toStrictEqual('checked')
      expect($(`#mailAddress${radioSuffix}`).attr('checked')).toStrictEqual('checked')
      expect($('#comments').val()).toStrictEqual('Updated comments')
    },
  )

  it('should default from date on initial page load', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    const today = new Date()
    expect($('#fromMonth').val()).toStrictEqual((today.getMonth() + 1).toString())
    expect($('#fromYear').val()).toStrictEqual(today.getFullYear().toString())
  })

  it('should not default from date if form was submitted with empty values', async () => {
    // Given
    const form = {
      fromMonth: '',
      fromYear: '',
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#fromMonth').val()).toStrictEqual('')
    expect($('#fromYear').val()).toStrictEqual('')
  })

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${uuidv4()}`,
      )
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/address-metadata/:journeyId', () => {
  it.each([['YES'], ['NO'], [undefined]])(
    'should pass to next page and set address metadata in session if there are no validation errors and in add mode',
    async option => {
      // Given
      existingJourney.mode = 'ADD'

      // When
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
        )
        .type('form')
        .send({
          fromMonth: '09',
          fromYear: '2009',
          toMonth: '12',
          toYear: '2012',
          primaryAddress: option,
          mailAddress: option,
          comments: 'Some comments',
        })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
        )

      // Then
      const expected: AddressMetadata = {
        fromMonth: '9',
        fromYear: '2009',
        toMonth: '12',
        toYear: '2012',
        primaryAddress: option as YesOrNo,
        mailAddress: option as YesOrNo,
        comments: 'Some comments',
      }
      expect(session.addressJourneys![journeyId]!.addressMetadata).toStrictEqual(expected)
    },
  )

  it.each([['YES'], ['NO'], [undefined]])(
    'should update the address, remove the session and pass to return url with success notification if there are no validation errors and in edit mode',
    async option => {
      // Given
      contactsService.updateContactAddress.mockResolvedValue({ contactAddressId: 888 })
      existingJourney.mode = 'EDIT'

      // When
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
        )
        .type('form')
        .send({
          fromMonth: '09',
          fromYear: '2009',
          toMonth: '12',
          toYear: '2012',
          primaryAddress: option,
          mailAddress: option,
          comments: 'Some comments',
        })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/123456/relationship/456789')

      // Then
      const expected: AddressMetadata = {
        fromMonth: '9',
        fromYear: '2009',
        toMonth: '12',
        toYear: '2012',
        primaryAddress: option as YesOrNo,
        mailAddress: option as YesOrNo,
        comments: 'Some comments',
      }
      expect(existingJourney.addressMetadata).toStrictEqual(expected)
      expect(session.addressJourneys![journeyId]).toBeUndefined()
      expect(contactsService.updateContactAddress).toHaveBeenCalledWith(existingJourney, user)
      expect(flashProvider).toHaveBeenCalledWith(FLASH_KEY__SUCCESS_BANNER, 'You’ve updated a contact address')
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
      )
      .type('form')
      .send({ fromMonth: '', fromYear: '', toMonth: '', toYear: '' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${journeyId}`,
      )
  })

  it('should return not found page if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/address-metadata/${uuidv4()}`,
      )
      .type('form')
      .send({})
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
