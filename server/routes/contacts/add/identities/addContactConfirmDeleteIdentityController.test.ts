import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import * as cheerio from 'cheerio'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedGetReferenceDescriptionForCode } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = randomUUID()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: true,
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
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/delete-identity/:index/:journeyId', () => {
  it('should render navigation and correct identity documents details', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${journeyId}`,
    )

    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete an identity document for the contact? - Add a contact - DPS',
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete this identity document for First Middle Last?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.identity-number-value').text().trim()).toStrictEqual('0123456789')
    expect($('.issuing-authority-value').text().trim()).toStrictEqual('Not provided')
    expect($('.type-value').text().trim()).toStrictEqual('Driving licence')
  })

  it('should call the audit service for the page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_DELETE_IDENTITY_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${randomUUID()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${journeyId}`).expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/delete-identity/:index/:journeyId', () => {
  it('should pass to check answers with the identity document removed', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.identities).toStrictEqual([
      { identityType: 'PASS', identityValue: '987654321', issuingAuthority: 'Authority' },
    ])
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${randomUUID()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/delete-identity/1/${journeyId}`)
      .type('form')
      .send({})
      .expect(403)
  })
})
