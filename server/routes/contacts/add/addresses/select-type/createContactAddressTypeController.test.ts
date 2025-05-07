import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../../testutils/appSetup'
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

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/new/select-type/:journeyId`, () => {
  it('should render enter address type page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What type of address are you adding for the contact? - Add a contact - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual(
      'What type of address are you adding for First Middle Last? (optional)',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_SELECT_ADDRESS_TYPE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.newAddress!.addressType = 'WORK'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toEqual('WORK')
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`)
      .expect(expectedStatus)
  })
})

describe(`GET /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/select-type/:journeyId`, () => {
  it('should render enter address type page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/1/select-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('h1').first().text().trim()).toStrictEqual(
      'What type of address are you adding for First Middle Last? (optional)',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_SELECT_ADDRESS_TYPE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
    expect($('input[type=radio]:checked').val()).toEqual('HOME')
  })

  it('should render not found if index is out of range', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/2/select-type/${journeyId}`)
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses/:addressIndex/select-type/:journeyId', () => {
  it('should update journey data and pass to next page', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`)
      .type('form')
      .send({ addressType: 'HOME' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/new/enter-address/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.newAddress!.addressType).toEqual('HOME')
  })

  it('should update journey data and bounce back', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/1/select-type/${journeyId}`)
      .type('form')
      .send({ addressType: 'WORK' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.pendingAddresses![0]!.addressType).toEqual('WORK')
  })

  it('should return not found page if index is out of range', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/99/select-type/${journeyId}`)
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
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`)
      .type('form')
      .send({ addressType: 'HOME' })
      .expect(expectedStatus)
  })
})
