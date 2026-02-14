import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../../testutils/appSetup'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { UpdateEmploymentsJourney } from '../../../../../@types/journeys'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let currentUser: HmppsUser
const journeyId = uuidv4()
const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner()
let session: Partial<SessionData>
const sessionInjection = {
  setSession: (_target: Partial<SessionData>): undefined => undefined,
}
const contact = TestData.contact()
const generateJourneyData = (): UpdateEmploymentsJourney => ({
  id: journeyId,
  lastTouched: new Date().toISOString(),
  contactId: contact.id,
  contactNames: { ...contact },
  employments: [
    {
      employmentId: 0,
      employer: {
        organisationId: 0,
        organisationName: 'Big Corp',
        organisationActive: true,
        businessPhoneNumber: '60511',
        businessPhoneNumberExtension: '123',
        property: 'Some House',
        countryDescription: 'England',
      },
      isActive: false,
    },
  ],
  organisationSearch: { page: 1 },
})
const setJourneyData = (data: UpdateEmploymentsJourney) => {
  sessionInjection.setSession = (s: Partial<SessionData>) => {
    const target = s
    target.updateEmploymentsJourneys ??= {}
    target.updateEmploymentsJourneys[journeyId] = data
  }
}

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      sessionInjection.setSession(session)
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, adminUserPermissions)

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:employmentIdx/employment-status', () => {
  it('should show error on "new" employment index', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/new/employment-status/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })

  it('should show error on out-of-range employment index', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/9999/organisation-search/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })

  it('should render question with prepopulated answer for isActive=false', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/1/employment-status/${journeyId}`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith('MANAGE_CONTACT_EMPLOYMENT_STATUS_PAGE', {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '1',
        prisonerContactId: '2',
        prisonerNumber,
        employerId: '1',
      },
    })
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What is the contact’s current employment status at the employer? - Edit professional information - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit professional information')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('a:contains("Back")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )
    expect($('h1:contains("What is the current employment status")').text()).toBeTruthy()
    expect($('label:contains("Active")').prev('input').attr('checked')).toBeFalsy()
    expect($('label:contains("Inactive")').prev('input').attr('checked')).toBeTruthy()
    expect($('button:contains("Continue")').text()).toBeTruthy()
  })

  it('should render question with prepopulated answer for isActive=true', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.employments[0]!.isActive = true
    setJourneyData(journeyData)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/1/employment-status/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('label:contains("Active")').prev('input').attr('checked')).toBeTruthy()
    expect($('label:contains("Inactive")').prev('input').attr('checked')).toBeFalsy()
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    const journeyData = generateJourneyData()
    setJourneyData(journeyData)

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/1/employment-status/${journeyId}`,
      )
      .expect(403)
  })
})

describe('POST /contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:employmentIdx/employment-status', () => {
  it('should update employment status in session and redirect', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.employments[0]!.isActive = false
    setJourneyData(journeyData)

    // When
    const response = await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/1/employment-status/${journeyId}`,
      )
      .type('form')
      .send({
        isActive: 'true',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/relationship\/2\/update-employments\/[a-f0-9-]{36}/,
    )
    expect(journeyData.employments[0]!.isActive).toBeTruthy()
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    const journeyData = generateJourneyData()
    journeyData.employments[0]!.isActive = false
    setJourneyData(journeyData)

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/1/employment-status/${journeyId}`,
      )
      .type('form')
      .send({
        isActive: 'true',
      })
      .expect(403)
  })
})
