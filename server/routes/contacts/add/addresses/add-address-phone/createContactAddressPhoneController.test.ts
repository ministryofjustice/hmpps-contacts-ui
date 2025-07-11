import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import {
  adminUser,
  appWithAllRoutes,
  authorisingUser,
  basicPrisonUser,
  flashProvider,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../../@types/journeys'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'

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
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
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
    userSupplier: () => currentUser,
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

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/new/phone/create/:journeyId`, () => {
  it('should render enter address phone page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add phone numbers for an address - Add a contact - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add phone numbers for this address (optional)',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/primary-or-postal/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(/<strong>Address:<\/strong><br>\s+?England/)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ADD_ADDRESS_PHONE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })

    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.newAddress!.phoneNumbers = [
      {
        type: 'MOB',
        phoneNumber: '123456789',
        extension: '000',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`,
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
    existingJourney.newAddress!.phoneNumbers = [
      {
        type: 'MOB',
        phoneNumber: '123456789',
        extension: '000',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('HOME')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('abc')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('')
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
      .expect(expectedStatus)
  })
})

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/phone/create/:journeyId`, () => {
  it('should render enter address phone page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/create/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add phone numbers for this address (optional)',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(
      /<strong>Address:<\/strong><br>\n\s+?1a<br>\s+?My block<br>\s+?A street<br>\s+?Downtown<br>\s+?Exeter<br>\s+?Devon<br>\s+?PC1 D3<br>\s+?England/,
    )
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ADD_ADDRESS_PHONE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })

    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('HOME')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('4321')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('99')
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

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/create/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('HOME')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('abc')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('')
  })

  it('should render not found if index is out of range', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/2/phone/create/${journeyId}`)
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/phone/create/:journeyId`, () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
      .type('form')
      .send('save=')
      .send('phones[0][type]=MOB')
      .send('phones[0][phoneNumber]=123456789')
      .send('phones[0][extension]=000')
      .send('phones[1][type]=HOME')
      .send('phones[1][phoneNumber]=987654321')
      .send('phones[1][extension]=')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/comments/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.newAddress!.phoneNumbers).toStrictEqual([
      { type: 'MOB', phoneNumber: '123456789', extension: '000' },
      { type: 'HOME', phoneNumber: '987654321', extension: undefined },
    ])
  })

  it('should update journey data and bounce back', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/phone/create/${journeyId}`)
      .type('form')
      .send('save=')
      .send('phones[0][type]=MOB')
      .send('phones[0][phoneNumber]=123456789')
      .send('phones[0][extension]=000')
      .send('phones[1][type]=HOME')
      .send('phones[1][phoneNumber]=987654321')
      .send('phones[1][extension]=')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.pendingAddresses![0]!.phoneNumbers).toStrictEqual([
      { type: 'MOB', phoneNumber: '123456789', extension: '000' },
      { type: 'HOME', phoneNumber: '987654321', extension: undefined },
    ])
  })

  it('should pass to next page with all blank inputs', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
      .type('form')
      .send('save=')
      .send('phones[0][type]=')
      .send('phones[0][phoneNumber]=')
      .send('phones[0][extension]=')
      .send('phones[1][type]=')
      .send('phones[1][phoneNumber]=')
      .send('phones[1][extension]=')
      .expect(302)

    expect(session.addContactJourneys![journeyId]!.newAddress!.phoneNumbers).toBeUndefined()
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    delete existingJourney.phoneNumbers
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}#`)
    expect(session.addContactJourneys![journeyId]!.newAddress!.phoneNumbers).toBeUndefined()
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding a phone number', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
        .type('form')
        .send('add=')
        .send('phones[0][type]=MOB')
        .send('phones[0][phoneNumber]=a123456789')
        .send('phones[0][extension]=000')
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
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
        .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
        .type('form')
        .send('remove=1')
        .send('phones[0][type]=MOB')
        .send('phones[0][phoneNumber]=a123456789')
        .send('phones[0][extension]=000')
        .send('phones[1][type]=HOME')
        .send('phones[1][phoneNumber]=b987654321')
        .send(`phones[1][extension]=${'b'.repeat(100)}`)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
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
        .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
        .type('form')
        .send('phones[0][type]=MOB')
        .send('phones[0][phoneNumber]=a123456789')
        .send('phones[0][extension]=000')
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/phone/create/${journeyId}`)
      .type('form')
      .send('save=')
      .send('phones[0][type]=')
      .send('phones[0][phoneNumber]=')
      .send('phones[0][extension]=')
      .send('phones[1][type]=')
      .send('phones[1][phoneNumber]=')
      .send('phones[1][extension]=')
      .expect(expectedStatus)
  })
})
