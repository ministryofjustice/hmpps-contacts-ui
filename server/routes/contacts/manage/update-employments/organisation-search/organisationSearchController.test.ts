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
jest.mock('../../../../../services/organisationsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const organisationsService = MockedService.OrganisationsService()

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
      organisationsService,
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

describe('GET /contacts/manage/:contactId/update-employments/:employmentIdx/organisation-search', () => {
  it('should show error on invalid employment index', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/invalid-employment-index/organisation-search/${journeyId}`,
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

  it('should set page query into session and redirect', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/organisation-search/${journeyId}?page=2`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/update-employments\/1\/organisation-search\/[a-f0-9-]{36}/,
    )

    const journeyData = session.updateEmploymentsJourneys![journeyId]!

    expect(journeyData.organisationSearch.page).toEqual(2)
  })

  it('should set sort query into session and reset page to 1, then redirect', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.organisationSearch = {
      page: 2,
      sort: 'organisationName,asc',
    }
    setJourneyData(journeyData)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/organisation-search/${journeyId}?sort=organisationName,desc`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/update-employments\/1\/organisation-search\/[a-f0-9-]{36}/,
    )

    expect(journeyData.organisationSearch.sort).toEqual('organisationName,desc')
    expect(journeyData.organisationSearch.page).toEqual(1)
  })

  it('should render search result', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      organisationSearch: { searchTerm: 'test', page: 2 },
    })

    organisationsService.searchOrganisations.mockResolvedValue({
      content: [
        TestData.organisation({
          organisationName: 'Some Corp',
          organisationId: 111,
          street: 'Some Street',
          businessPhoneNumber: '1234 1234',
          businessPhoneNumberExtension: '222',
        }),
      ],
      totalElements: 11,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/2/update-employments/1/organisation-search/${journeyId}`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith('MANAGE_CONTACT_SEARCH_ORGANISATION_PAGE', {
      who: 'user1',
      correlationId: expect.any(String),
      details: {
        contactId: '2',
        prisonerNumber,
        employerId: '1',
      },
    })
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Search for the contact’s employer - Edit professional information - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit professional information')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('a:contains("Back to employment information")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/2/update-employments/${journeyId}`,
    )
    expect($('input#organisationName').val()).toEqual('test')
    expect($('h1').text()).toEqual('Search for Jones Mason’s employer')
    expect($('p:contains("Showing 11 to 11 of 11 results")').text()).toBeTruthy()
    expect($('p:contains("No organisation records match your search.")').text()).toBeFalsy()
    expect($('td:contains("Some Corp")').first().text()).toEqual('Some Corp111')
    expect($('td:contains("1234 1234, ext. 222")').text()).toBeTruthy()
    const checkEmployerLink = $('a:contains("Check if this is the")')
    expect(checkEmployerLink.text()).toEqual('Check if this is the correct employer (Some Corp)')
    expect(checkEmployerLink.attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/2/update-employments/1/check-employer/${journeyId}?organisationId=111`,
    )
    expect($('.moj-pagination__list').text()).toBeTruthy()
  })

  it('should not show pagination when there is only one page', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      organisationSearch: { searchTerm: 'test', page: 1 },
    })

    organisationsService.searchOrganisations.mockResolvedValue({
      content: [
        TestData.organisation({
          organisationName: 'Some Corp',
          organisationId: 111,
          street: 'Some Street',
          businessPhoneNumber: '1234 1234',
          businessPhoneNumberExtension: '222',
        }),
      ],
      totalElements: 1,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/organisation-search/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('p:contains("Showing 1 to 1 of 1 results")').text()).toBeTruthy()
    expect($('p:contains("No organisation records match your search.")').text()).toBeFalsy()
    expect($('td:contains("Some Corp")').text()).toBeTruthy()
    expect($('.moj-pagination__list').text()).toBeFalsy()
  })

  it('should render "no records match" result', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      organisationSearch: { searchTerm: 'test', page: 1 },
    })

    organisationsService.searchOrganisations.mockResolvedValue({
      content: [],
      totalElements: 0,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/organisation-search/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('input#organisationName').val()).toEqual('test')
    expect($('p:contains("No organisation records match your search.")').text()).toBeTruthy()
  })

  it('should not render "no records match" result when there is no search term', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      organisationSearch: { page: 1 },
    })

    organisationsService.searchOrganisations.mockResolvedValue({
      content: [],
      totalElements: 0,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/organisation-search/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('input#organisationName').val()).toEqual('')
    expect($('p:contains("No organisation records match your search.")').text()).toBeFalsy()
  })
})

describe('POST /contacts/manage/:contactId/update-employments/:employmentIdx/organisation-search', () => {
  it('should set searchTerm into session and redirect', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/organisation-search/${journeyId}`)
      .type('form')
      .send({
        organisationName: 'te %st',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/update-employments\/1\/organisation-search\/[a-f0-9-]{36}/,
    )

    const journeyData = session.updateEmploymentsJourneys![journeyId]!
    expect(journeyData.organisationSearch.searchTerm).toEqual('te %st')
  })
})
