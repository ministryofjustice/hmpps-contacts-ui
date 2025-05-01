import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

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
  currentUser = adminUser
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
      relationshipType: 'O',
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
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
    TestData.prisoner({ prisonerNumber, firstName: 'Prisoner', lastName: 'Name', middleNames: 'Not Shown' }),
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/add/enter-additional-info/:journeyId', () => {
  it('should render enter additional info page for admin user', async () => {
    // Given
    currentUser = adminUser

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Enter additional information about the contact - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Enter additional information about First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to emergency contact and next of kin')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render enter additional info page for authorising user', async () => {
    // Given
    currentUser = authorisingUser

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Enter additional information about the contact - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Enter additional information about First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to visits approval')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`,
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
    expect($('a:contains("Employers")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("Addresses")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect(
      $('a:contains("Comments on their relationship with Prisoner Name")').parent().next().text().trim(),
    ).toStrictEqual('Not entered')
    expect($('a:contains("Phone numbers")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("Email addresses")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("Gender")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("Identity documents")').parent().next().text().trim()).toStrictEqual('Not entered')
    expect($('a:contains("If the contact is a member of staff")').parent().next().text().trim()).toStrictEqual(
      'Not entered',
    )
    expect($('a:contains("Language and interpretation requirements")').parent().next().text().trim()).toStrictEqual(
      'Not entered',
    )
    expect($('a:contains("Domestic status")').parent().next().text().trim()).toStrictEqual('Not entered')
  })

  it('should render entered for optional info that has been completed', async () => {
    // When
    existingJourney.employments = [{ employer: { organisationActive: true, organisationName: '', organisationId: 0 } }]
    existingJourney.addresses = [{ addressType: 'HOME' }]
    existingJourney.relationship!.comments = 'Some comments'
    existingJourney.phoneNumbers = [
      { type: 'MOB', phoneNumber: '0123456789' },
      { type: 'HOME', phoneNumber: '987654321', extension: '#123' },
    ]
    existingJourney.emailAddresses = [{ emailAddress: '' }]
    existingJourney.gender = 'M'
    existingJourney.identities = [{ identityType: '', identityValue: '' }]
    existingJourney.isStaff = 'YES'
    existingJourney.languageAndInterpreter = { language: 'ENG' }
    existingJourney.domesticStatusCode = 'S'
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('a:contains("Employers")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("Addresses")').parent().next().text().trim()).toStrictEqual('Entered')
    expect(
      $('a:contains("Comments on their relationship with Prisoner Name")').parent().next().text().trim(),
    ).toStrictEqual('Entered')
    expect($('a:contains("Phone numbers")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("Email addresses")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("Gender")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("Identity documents")').parent().next().text().trim()).toStrictEqual('Entered')
    expect($('a:contains("If the contact is a member of staff")').parent().next().text().trim()).toStrictEqual(
      'Entered',
    )
    expect($('a:contains("Domestic status")').parent().next().text().trim()).toStrictEqual('Entered')
  })

  it('should not show employers for social contact', async () => {
    // When
    existingJourney.relationship!.relationshipType = 'S'

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('a:contains("Employers")').text()).toBeFalsy()
  })

  it('should call the audit service for the page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDITIONAL_INFORMATION_PAGE, {
      who: adminUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)
      .expect(expectedStatus)
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

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)
      .type('form')
      .send({})
      .expect(expectedStatus)
  })
})
