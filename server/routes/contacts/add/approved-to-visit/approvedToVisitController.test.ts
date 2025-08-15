import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser } from '../../../testutils/appSetup'
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

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = authorisingUser
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
    relationship: {
      relationshipToPrisoner: 'MOT',
    },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_visit_approval]: true })

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/approved-to-visit/:journeyId', () => {
  it.each([
    ['NEW', 'Add a contact and link to a prisoner', 'Add a contact - DPS'],
    ['EXISTING', 'Link a contact to a prisoner', 'Link a contact to a prisoner - DPS'],
  ])(
    'should render enter emergency contact page for all modes %s',
    async (mode, expectedCaption: string, titleSuffix) => {
      // Given
      existingJourney.mode = mode as 'NEW' | 'EXISTING'

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('title').text()).toStrictEqual(`Is the contact approved to visit the prisoner? - ${titleSuffix}`)
      expect($('.main-heading').first().text().trim()).toStrictEqual(
        'Is First Middle Last approved to visit John Smith? (optional)',
      )
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
        `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
      )
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

      // Assert hint text and details are present
      const hintHtml = $('.govuk-hint').html()
      expect(hintHtml).toContain('Skip this question if:')
      expect(hintHtml).toContain('the contact has not yet been checked and approved for visits to this prisoner')
      expect(hintHtml).toContain(
        'for any other reason, you’re not sure whether the contact is approved to visit the prisoner or not',
      )
      // Check details summary
      expect(hintHtml).toContain('Procedures for approving visitors')
      expect(hintHtml).toContain('Check your local procedures when approving visitors for prisoners.')
      expect(hintHtml).toContain('person posing a risk to children (PPRC)')
      expect(hintHtml).toContain('harassment offence (including stalking)')
      expect(hintHtml).toContain('public protection contact restrictions')
      expect(hintHtml).toContain('domestic abuse perpetrator')
      expect(hintHtml).toContain('Sex Offences Act 2003')
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isApprovedVisitor: true }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('YES')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contact visit approval permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_visit_approval]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`).expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/approved-to-visit', () => {
  it('should pass to next page if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT' }
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`)
      .type('form')
      .send({ isApprovedToVisit: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    const expectedRelationship = { relationshipToPrisoner: 'MOT', isApprovedVisitor: true }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isApprovedVisitor: true }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`)
      .type('form')
      .send({ isApprovedToVisit: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedRelationship = { relationshipToPrisoner: 'MOT', isApprovedVisitor: false }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contact visit approval permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_visit_approval]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`)
      .type('form')
      .send({ isApprovedToVisit: 'YES' })
      .expect(403)
  })
})
