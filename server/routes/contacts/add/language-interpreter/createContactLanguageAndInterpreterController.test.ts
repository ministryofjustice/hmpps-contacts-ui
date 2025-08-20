import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney, LanguageAndInterpreterRequiredForm } from '../../../../@types/journeys'
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

  mockPermissions(app, adminUserPermissions)

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/language-and-interpreter/:journeyId', () => {
  it('should render page with correct navigation before CYA', async () => {
    // Given
    existingJourney.isCheckingAnswers = false

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Enter language and interpretation requirements - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Enter language and interpretation requirements (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render page when checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Enter language and interpretation requirements (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it.each([
    [{ language: 'ENG', interpreterRequired: 'YES' }, 'ENG', 'YES'],
    [{ interpreterRequired: 'YES' }, '', 'YES'],
    [{ language: 'ENG' }, 'ENG', undefined],
    [{}, '', undefined],
    [undefined, '', undefined],
  ])(
    'should render previously entered details if there are session values %s, %s, %s',
    async (existing, expectedLang, expectedInterpreter) => {
      // Given
      existingJourney.languageAndInterpreter = existing as LanguageAndInterpreterRequiredForm

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#language').val()).toStrictEqual(expectedLang)
      expect($('input[type=radio]:checked').val()).toStrictEqual(expectedInterpreter)
    },
  )

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/language-and-interpreter/:journeyId', () => {
  it.each([
    [
      { language: 'ENG', interpreterRequired: 'YES' },
      { language: 'ENG', interpreterRequired: 'YES' },
    ],
    [{ interpreterRequired: 'YES' }, { language: undefined, interpreterRequired: 'YES' }],
    [{ language: 'ENG' }, { language: 'ENG', interpreterRequired: undefined }],
    [{ language: '' }, undefined],
    [{ language: '', interpreterRequired: '' }, undefined],
    [
      { language: '', interpreterRequired: 'YES' },
      { language: undefined, interpreterRequired: 'YES' },
    ],
    [{}, undefined],
  ])('should pass back to add info with values set from %s to %s', async (form, expected) => {
    // Given
    delete existingJourney.languageAndInterpreter
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`)
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.languageAndInterpreter).toStrictEqual(expected)
  })

  it('question is optional so should be allowed to choose nothing', async () => {
    // Given
    delete existingJourney.languageAndInterpreter
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.languageAndInterpreter).toBeUndefined()
  })

  it('should pass to check answers', async () => {
    // Given
    existingJourney.languageAndInterpreter = { language: 'ENG', interpreterRequired: 'YES' }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`)
      .type('form')
      .send({ language: 'ARA', interpreterRequired: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.languageAndInterpreter).toStrictEqual({
      language: 'ARA',
      interpreterRequired: 'NO',
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/language-and-interpreter/${journeyId}`)
      .type('form')
      .send({ language: 'ARA', interpreterRequired: 'NO' })
      .expect(403)
  })
})
