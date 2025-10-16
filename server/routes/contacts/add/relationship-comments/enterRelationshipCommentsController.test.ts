import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { PrisonerPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { adminUserPermissions, adminUser, appWithAllRoutes, flashProvider } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/alertsService')

const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

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
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
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
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-relationship-comments/:journeyId', () => {
  it.each([
    ['NEW', 'Add a contact and link to a prisoner', 'Add a contact - DPS'],
    ['EXISTING', 'Link a contact to a prisoner', 'Link a contact to a prisoner - DPS'],
  ])(
    'should render enter relationship comments page for each mode %s',
    async (mode, expectedCaption: string, titleSuffix) => {
      // Given
      existingJourney.mode = mode as 'NEW' | 'EXISTING'

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('title').text()).toStrictEqual(
        `Add comments on the relationship between the contact and the prisoner - ${titleSuffix}`,
      )
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
        'Add comments on the relationship between First Middle Last and John Smith (optional)',
      )
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    },
  )

  it.each([
    [
      'NEW',
      { [Permission.edit_contact_visit_approval]: false },
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    ],
    [
      'NEW',
      { [Permission.edit_contact_visit_approval]: true },
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    ],
    [
      'EXISTING',
      { [Permission.edit_contact_visit_approval]: false },
      `/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
    ],
    [
      'EXISTING',
      { [Permission.edit_contact_visit_approval]: true },
      `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`,
    ],
  ])(
    'should go back to corresponding previous page for each mode %s and edit contact visit approval permission',
    async (mode, permission: Partial<Record<PrisonerPermission, boolean>>, previousUrl: string) => {
      // Given
      mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true, ...permission })
      existingJourney.mode = mode as 'NEW' | 'EXISTING'

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(previousUrl)
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_RELATIONSHIP_COMMENTS, {
      who: adminUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerSearchService,
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
    existingJourney.relationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
      comments: 'Foo',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual('Foo')
  })

  it('should render invalid data if validation errors and there are no session values', async () => {
    // Given
    const newComments = 'Bar'.padEnd(240)
    flashProvider.mockImplementation(key =>
      key === 'formResponses' ? [JSON.stringify({ comments: newComments })] : [],
    )
    existingJourney.relationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual(newComments)
  })

  it('should render invalid data if validation errors and there are session values', async () => {
    // Given
    const newComments = 'Bar'.padEnd(240)
    flashProvider.mockImplementation(key =>
      key === 'formResponses' ? [JSON.stringify({ comments: newComments })] : [],
    )
    existingJourney.relationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
      comments: 'Foo',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual(newComments)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-relationship-comments', () => {
  it.each([
    ['NEW', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`],
    ['EXISTING', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`],
  ])(
    'should pass to next page if there are no validation errors and we are not checking answers',
    async (mode, expectedUrl) => {
      // Given
      existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: false, isNextOfKin: true }
      existingJourney.isCheckingAnswers = false
      existingJourney.mode = mode as 'NEW' | 'EXISTING'

      // When
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
        .type('form')
        .send({ comments: 'Foo' })
        .expect(302)
        .expect('Location', expectedUrl)

      // Then
      const expectedRelationship = {
        relationshipToPrisoner: 'MOT',
        isEmergencyContact: false,
        isNextOfKin: true,
        comments: 'Foo',
      }
      expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
      .type('form')
      .send({ comments: ''.padEnd(241) })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}#`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
      .type('form')
      .send({ comments: 'Foo' })
      .expect(403)
  })
})
