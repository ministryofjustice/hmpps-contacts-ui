import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../../../testutils/appSetup'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import UpdateEmploymentsJourney = journeys.UpdateEmploymentsJourney

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const journeyId = uuidv4()
const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner()
let session: Partial<SessionData>
const sessionInjection = {
  setSession: (_target: Partial<SessionData>) => undefined,
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
  returnPoint: { url: '/foo/bar' },
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
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      sessionInjection.setSession(session)
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/update-employments/:employmentIdx/employment-status', () => {
  it('should show error on "new" employment index', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/employment-status/${journeyId}`,
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
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/9999/organisation-search/${journeyId}`,
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
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/employment-status/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('a:contains("Back")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/update-employments/${journeyId}`,
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
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/employment-status/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('label:contains("Active")').prev('input').attr('checked')).toBeTruthy()
    expect($('label:contains("Inactive")').prev('input').attr('checked')).toBeFalsy()
  })
})

describe('POST /contacts/manage/:contactId/update-employments/:employmentIdx/employment-status', () => {
  it('should update employment status in session and redirect', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.employments[0]!.isActive = false
    setJourneyData(journeyData)

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/employment-status/${journeyId}`)
      .type('form')
      .send({
        isActive: 'true',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(/contacts\/manage\/1\/update-employments\/[a-f0-9-]{36}/)
    expect(journeyData).toBeTruthy()
  })
})
