import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import {
  adminUser,
  appWithAllRoutes,
  authorisingUser,
  basicPrisonUser,
  flashProvider,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { AddressJourney } from '../../../../../@types/journeys'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

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

describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/phone/:journeyId`, () => {
  it('should render enter address phone page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add phone numbers for an address - Edit contact methods - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add phone numbers for this address (optional)',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/primary-or-postal/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(/<strong>Address:<\/strong><br>\s+?England/)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_ADDRESS_PHONE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123456',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })

    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('')
  })

  it('should back to CYA page when checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
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
    existingJourney.phoneNumbers = [
      {
        type: 'MOB',
        phoneNumber: '123456789',
        extension: '000',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('MOB')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('123456789')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('000')
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      phones: [
        {
          type: 'HOME',
          phoneNumber: 'abc',
          extension: '',
        },
      ],
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
    existingJourney.phoneNumbers = [
      {
        type: 'MOB',
        phoneNumber: '123456789',
        extension: '000',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('HOME')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('abc')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('')
  })

  it('should render not found no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${uuidv4()}`,
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
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
      )
      .expect(expectedStatus)
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/phone/:journeyId`, () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
      )
      .type('form')
      .send('save=')
      .send('phones[0][type]=MOB')
      .send('phones[0][phoneNumber]=123456789')
      .send('phones[0][extension]=000')
      .send('phones[1][type]=HOME')
      .send('phones[1][phoneNumber]=987654321')
      .send('phones[1][extension]=')
      .expect(302)

    expect(session.addressJourneys![journeyId]!.phoneNumbers).toStrictEqual([
      { type: 'MOB', phoneNumber: '123456789', extension: '000' },
      { type: 'HOME', phoneNumber: '987654321', extension: undefined },
    ])
  })

  it('should pass to next page with all blank inputs', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
      )
      .type('form')
      .send('save=')
      .send('phones[0][type]=')
      .send('phones[0][phoneNumber]=')
      .send('phones[0][extension]=')
      .send('phones[1][type]=')
      .send('phones[1][phoneNumber]=')
      .send('phones[1][extension]=')
      .expect(302)

    expect(session.addressJourneys![journeyId]!.phoneNumbers).toBeUndefined()
  })

  it.each([
    [
      false,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/comments/${journeyId}`,
    ],
    [
      true,
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
    ],
  ])(
    'should redirect to next page based on checking answers or not',
    async (isCheckingAnswers: boolean, expectedRedirect: string) => {
      existingJourney.isCheckingAnswers = isCheckingAnswers

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
        .type('form')
        .send('save=')
        .send('phones[0][type]=')
        .send('phones[0][phoneNumber]=')
        .send('phones[0][extension]=')
        .expect(302)
        .expect('Location', expectedRedirect)
    },
  )

  it('should return to input page with details kept if there are validation errors', async () => {
    delete existingJourney.phoneNumbers
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}#`,
      )
    expect(session.addressJourneys![journeyId]!.phoneNumbers).toBeUndefined()
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
      )
      .type('form')
      .send('save=')
      .send('phones[0][type]=MOB')
      .send('phones[0][phoneNumber]=123456789')
      .send('phones[0][extension]=000')
      .send('phones[1][type]=HOME')
      .send('phones[1][phoneNumber]=987654321')
      .send('phones[1][extension]=')
      .expect(expectedStatus)
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding a phone number', async () => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
        .type('form')
        .send('add=')
        .send('phones[0][type]=MOB')
        .send('phones[0][phoneNumber]=a123456789')
        .send('phones[0][extension]=000')
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [
            { type: 'MOB', phoneNumber: 'a123456789', extension: '000' },
            { type: '', phoneNumber: '', extension: '' },
          ],
          add: '',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating if we are removing a phone number', async () => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
        .type('form')
        .send('remove=1')
        .send('phones[0][type]=MOB')
        .send('phones[0][phoneNumber]=a123456789')
        .send('phones[0][extension]=000')
        .send('phones[1][type]=HOME')
        .send('phones[1][phoneNumber]=b987654321')
        .send(`phones[1][extension]=${'b'.repeat(100)}`)
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
          remove: '1',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating even if action is not save, add or remove', async () => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
        .type('form')
        .send('phones[0][type]=MOB')
        .send('phones[0][phoneNumber]=a123456789')
        .send('phones[0][extension]=000')
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/phone/${journeyId}`,
        )
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })
  })
})
