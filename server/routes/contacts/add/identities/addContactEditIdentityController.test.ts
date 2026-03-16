import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, adminUser, adminUserPermissions, flashProvider } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'
import { IDENTITY_NUMBER_DUPLICATE } from '../../manage/identities/IdentitySchemas'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/referenceDataService')

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
      middleNames: 'middle',
      firstName: 'first',
    },
    relationship: {
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: true,
      isNextOfKin: true,
    },
    identities: [
      { identityType: 'DL', identityValue: '0123456789' },
      {
        identityType: 'PASS',
        identityValue: '987654321',
        issuingAuthority: 'Authority',
      },
    ],
    mode: 'NEW',
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

  mockPermissions(app, adminUserPermissions)

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/edit-identity/:index/:journeyId', () => {
  it('should render edit identity page with correct navigation before check answers', async () => {
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Update an identity document - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Update an identity document for First Middle Last',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit identity documentation for a contact')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toBe(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_ADD_IDENTITY_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render edit identity page with correct navigation when checking answers', async () => {
    existingJourney.isCheckingAnswers = true

    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Update an identity document for First Middle Last',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit identity documentation for a contact')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`,
    )
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`).expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/edit-identity/1/:journeyId', () => {
  it('should pass to additional info if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/2/${journeyId}`)
      .type('form')
      .send('identityType=PASS')
      .send('identityValue=987654321')
      .send('issuingAuthority=Authority')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.identities).toStrictEqual([
      { identityType: 'DL', identityValue: '0123456789' },
      {
        identityType: 'PASS',
        identityValue: '987654321',
        issuingAuthority: 'Authority',
      },
    ])
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)
      .type('form')
      .send('identityType=DL')
      .send('identityValue=0123456789')
      .send('issuingAuthority=')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.identities).toStrictEqual([
      { identityType: 'DL', identityValue: '0123456789', issuingAuthority: undefined },
      {
        identityType: 'PASS',
        identityValue: '987654321',
        issuingAuthority: 'Authority',
      },
    ])
  })

  it('should return to edit page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)
      .type('form')
      .send('identityType=')
      .send('identityValue=0123456789')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}#`)
  })

  it('should return to edit page with validation errors if attempting to add a duplicate identity', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)
      .type('form')
      .send({ identityType: 'PASS', identityValue: '987654321' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)

    expect(existingJourney.identities).toStrictEqual([
      { identityType: 'DL', identityValue: '0123456789' },
      {
        identityType: 'PASS',
        identityValue: '987654321',
        issuingAuthority: 'Authority',
      },
    ])
    expect(flashProvider).toHaveBeenCalledWith('formResponses', '{"identityType":"PASS","identityValue":"987654321"}')
    expect(flashProvider).toHaveBeenCalledWith('validationErrors', `{"identityValue":["${IDENTITY_NUMBER_DUPLICATE}"]}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/edit-identity/1/${journeyId}`)
      .type('form')
      .send('identityType=DL')
      .send('identityValue=0123456789')
      .expect(403)
  })
})
