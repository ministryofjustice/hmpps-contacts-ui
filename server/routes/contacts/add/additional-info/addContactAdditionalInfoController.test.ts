import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
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
      isEmergencyContact: 'YES',
      isNextOfKin: 'YES',
    },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/add/enter-additional-info/:journeyId', () => {
  it('should render enter additional info page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Enter additional information about First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render not entered for optional info that has not been completed yet', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('a:contains("Addresses")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect(
      $('a:contains("Comments on their relationship with First Middle Last")').parent().next().text().trim(),
    ).toStrictEqual('Not entered')
    expect($('a:contains("Phone numbers")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("Gender")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("Identity documents")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("If the contact is a member of staff")').parent().next().text().trim()).toStrictEqual(
      'Not entered',
    )
  })

  it('should render entered for optional info that has been completed', async () => {
    // When
    existingJourney.addresses = [{ addressType: 'HOME' }]
    existingJourney.relationship!.comments = 'Some comments'
    existingJourney.phoneNumbers = [
      { type: 'MOB', phoneNumber: '0123456789' },
      { type: 'HOME', phoneNumber: '987654321', extension: '#123' },
    ]
    existingJourney.gender = 'M'
    existingJourney.identities = [{ identityType: '', identityValue: '' }]
    existingJourney.isStaff = 'YES'
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('a:contains("Addresses")').parent().next().text().trim()).toStrictEqual('Entered')
    expect(
      $('a:contains("Comments on their relationship with First Middle Last")').parent().next().text().trim(),
    ).toStrictEqual('Entered')
    expect($('a:contains("Phone numbers")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("Gender")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("Identity documents")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("If the contact is a member of staff")').parent().next().text().trim()).toStrictEqual(
      'Entered',
    )
  })

  it('should call the audit service for the page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDITIONAL_INFORMATION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/add/enter-additional-info', () => {
  it('should pass to check answers', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
