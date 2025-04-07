import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import AddContactJourney = journeys.AddContactJourney
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/organisationsService')
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()
const organisationsService = MockedService.OrganisationsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney

beforeEach(() => {
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
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: true,
      isNextOfKin: true,
    },
    pendingEmployments: [
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
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
      organisationsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/organisation-search', () => {
  it('should show error on invalid employment index', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/invalid-employment-index/organisation-search/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })

  it('should show error on out-of-range employment index', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/9999/organisation-search/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })

  it('should set page query into session and redirect', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}?page=2`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}#pagination`,
    )

    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.organisationSearch!.page).toEqual(2)
  })

  it('should set sort query into session and reset page to 1, then redirect', async () => {
    // Given
    existingJourney.organisationSearch = {
      page: 2,
      sort: 'organisationName,asc',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}?sort=organisationName,desc`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}#pagination`,
    )

    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.organisationSearch!.sort).toEqual('organisationName,desc')
    expect(journeyData.organisationSearch!.page).toEqual(1)
  })

  it('should render search result', async () => {
    // Given
    existingJourney.organisationSearch = { searchTerm: 'test', page: 2 }

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
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Search for the contact’s employer - Add a contact - DPS')
    expect($('h1').text()).toEqual('Search for First Middle Last’s employer')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('a:contains("Back to employment information")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/create/employments/${journeyId}`,
    )
    expect($('input#organisationName').val()).toEqual('test')
    expect($('p:contains("Showing 11 to 11 of 11 results")').text()).toBeTruthy()
    expect($('p:contains("No organisation records match your search.")').text()).toBeFalsy()
    expect($('td:contains("Some Corp")').first().text()).toEqual('Some Corp111')
    expect($('td:contains("1234 1234, ext. 222")').text()).toBeTruthy()
    const checkEmployerLink = $('a:contains("Check if this is the")')
    expect(checkEmployerLink.text()).toEqual('Check if this is the correct employer (Some Corp)')
    expect(checkEmployerLink.attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/create/employments/1/check-employer/${journeyId}?organisationId=111`,
    )
    expect($('.moj-pagination__list').text()).toBeTruthy()

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_SEARCH_ORGANISATION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should not show pagination when there is only one page', async () => {
    // Given
    existingJourney.organisationSearch = { searchTerm: 'test', page: 1 }

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
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}`,
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
    existingJourney.organisationSearch = { searchTerm: 'test', page: 1 }

    organisationsService.searchOrganisations.mockResolvedValue({
      content: [],
      totalElements: 0,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('input#organisationName').val()).toEqual('test')
    expect($('p:contains("No organisation records match your search.")').text()).toBeTruthy()
  })

  it('should not render "no records match" result when there is no search term', async () => {
    // Given
    existingJourney.organisationSearch = { page: 1 }

    organisationsService.searchOrganisations.mockResolvedValue({
      content: [],
      totalElements: 0,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('input#organisationName').val()).toEqual('')
    expect($('p:contains("No organisation records match your search.")').text()).toBeFalsy()
  })
})

describe('POST /contacts/manage/:contactId/update-employments/:employmentIdx/organisation-search', () => {
  it('should set searchTerm into session and redirect', async () => {
    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}`)
      .type('form')
      .send({
        organisationName: 'te %st',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/organisation-search/${journeyId}`,
    )

    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.organisationSearch!.searchTerm).toEqual('te %st')
  })
})
