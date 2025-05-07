import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  authorisingUser,
} from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

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
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/emails/:journeyId', () => {
  it('should render create emails with correct navigation before check answers', async () => {
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add email addresses for the contact - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add email addresses for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_ADD_EMAIL_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render create emails with correct navigation when checking answers', async () => {
    existingJourney.isCheckingAnswers = true

    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add email addresses for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`,
    )
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.emailAddresses = [{ emailAddress: 'a@b.cd' }, { emailAddress: 'z@y.xx' }]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=emails-0-email-address]').val()).toStrictEqual('a@b.cd')
    expect($('[data-qa=emails-1-email-address]').val()).toStrictEqual('z@y.xx')
  })

  it('should render previously entered details if there are validation errors overriding any session values', async () => {
    // Given session has 1 but form has two different
    existingJourney.emailAddresses = [{ emailAddress: 'a@b.cd' }, { emailAddress: 'z@y.xx' }]
    const form = {
      emails: [{ emailAddress: '123' }, { emailAddress: '' }],
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=emails-0-email-address]').val()).toStrictEqual('123')
    expect($('[data-qa=emails-1-email-address]').val()).toStrictEqual('')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/emails/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`).expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/emails/:journeyId', () => {
  it('should pass to additional info if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send({
        save: '',
        emails: [{ emailAddress: 'a@b.cd' }, { emailAddress: 'z@y.xx' }],
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.emailAddresses).toStrictEqual([
      { emailAddress: 'a@b.cd' },
      { emailAddress: 'z@y.xx' },
    ])
  })

  it('should allow a blank form to mean no emails documents', async () => {
    // Given
    existingJourney.isCheckingAnswers = false
    existingJourney.emailAddresses = [{ emailAddress: 'a@b.cd' }, { emailAddress: 'z@y.xx' }]

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send({
        save: '',
        emails: [{ emailAddress: '' }, { emailAddress: '' }],
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.emailAddresses).toBeUndefined()
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send({
        save: '',
        emails: [{ emailAddress: 'a@b.cd' }],
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.emailAddresses).toStrictEqual([{ emailAddress: 'a@b.cd' }])
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send({ save: '', emails: [{ emailAddress: '' }, { emailAddress: '123' }] })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}#`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send({
        save: '',
        emails: [{ emailAddress: 'a@b.cd' }],
      })
      .expect(expectedStatus)
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding an email address', async () => {
      const form = {
        add: '',
        emails: [{ emailAddress: 'a@b.cd' }],
      }

      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
        .type('form')
        .send(form)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

      expect(existingJourney.emailAddresses).toBeUndefined()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          emails: [{ emailAddress: 'a@b.cd' }, { emailAddress: '' }],
          add: '',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating if we are removing an email address', async () => {
      const form = {
        remove: '1',
        emails: [{ emailAddress: 'a@b.cd' }, { emailAddress: 'z@y.xx' }],
      }

      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
        .type('form')
        .send(form)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

      expect(existingJourney.emailAddresses).toBeUndefined()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          emails: [{ emailAddress: 'a@b.cd' }],
          remove: '1',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating even if action is not save, add or remove', async () => {
      const form = {
        emails: [{ emailAddress: '123' }],
      }

      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
        .type('form')
        .send(form)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)

      expect(existingJourney.emailAddresses).toBeUndefined()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          emails: [{ emailAddress: '123' }],
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })
  })
})
