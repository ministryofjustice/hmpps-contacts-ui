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
      employmentId: 1234,
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

describe('GET /contacts/manage/:contactId/update-employments/:employmentIdx/delete-employment', () => {
  it('should show error on "new" employment index', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/delete-employment/${journeyId}`,
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
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/9999/delete-employment/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })

  it('should render delete employer page', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/delete-employment/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('a:contains("Back")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/update-employments/${journeyId}`,
    )
    expect($('a:contains("No, do not delete")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/update-employments/${journeyId}`,
    )
    expect($('h1:contains("Are you sure you want to delete this employer")').text()).toBeTruthy()
    expect($('dt:contains("Employer name")').next().text()).toMatch(/Big Corp/)
    expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Some House(\s+)England/)
    expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/60511, ext\. 123/)
    expect($('dt:contains("Employment status")').next().text()).toMatch(/Inactive/)
    expect($('button:contains("Yes, delete")').text()).toBeTruthy()
  })
})

describe('POST /contacts/manage/:contactId/update-employments/:employmentIdx/delete-employment', () => {
  it('should mark employment for deletion and redirect', async () => {
    // Given
    const journeyData = generateJourneyData()
    setJourneyData(journeyData)

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/delete-employment/${journeyId}`)
      .type('form')
      .send({})

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(/contacts\/manage\/1\/update-employments\/[a-f0-9-]{36}/)
    expect(journeyData.employments.length).toEqual(0)
    expect(journeyData.employmentIdsToDelete?.length).toEqual(1)
    expect(journeyData.employmentIdsToDelete).toContain(1234)
  })

  it('should handle employment without id', async () => {
    // Given
    const journeyData = generateJourneyData()
    delete journeyData.employments[0]!.employmentId
    setJourneyData(journeyData)

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/delete-employment/${journeyId}`)
      .type('form')
      .send({})

    // Then
    expect(journeyData.employments.length).toEqual(0)
    expect(journeyData.employmentIdsToDelete).toBeFalsy()
  })
})
