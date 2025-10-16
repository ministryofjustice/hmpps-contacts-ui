import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, adminUser, adminUserPermissions } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/alertsService')

const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()
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
      contactsService,
      alertsService,
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

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`).expect(403)
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
      .send('save=')
      .send('emails[0][emailAddress]=a@b.cd')
      .send('emails[1][emailAddress]=z@y.xx')
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
      .send('save=')
      .send('emails[0][emailAddress]=')
      .send('emails[1][emailAddress]=')
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
      .send('save=')
      .send('emails[0][emailAddress]=a@b.cd')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.emailAddresses).toStrictEqual([{ emailAddress: 'a@b.cd' }])
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send('save=')
      .send('emails[0][emailAddress]=test@example.com')
      .send('emails[1][emailAddress]=123')
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

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
      .type('form')
      .send('save=')
      .send('emails[0][emailAddress]=test@example.com')
      .expect(403)
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding an email address', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
        .type('form')
        .send('add=')
        .send('emails[0][emailAddress]=a@b.cd')
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
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
        .type('form')
        .send('remove=1')
        .send('emails[0][emailAddress]=a@b.cd')
        .send('emails[1][emailAddress]=z@y.xx')
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
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
        .type('form')
        .send('emails[0][emailAddress]=123')
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
