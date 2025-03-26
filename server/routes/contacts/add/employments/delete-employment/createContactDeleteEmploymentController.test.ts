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
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()

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
      lastName: 'Mason',
      firstName: 'Jones',
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

describe('GET /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/delete-employment', () => {
  it('should show error on "new" employment index', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/delete-employment/${journeyId}`,
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
      `/prisoner/${prisonerNumber}/contacts/create/employments/9999/delete-employment/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })

  it('should render delete employer page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/delete-employment/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('a:contains("Back")').attr('href')).toEqual(`/prisoner/A1234BC/contacts/create/employments/${journeyId}`)
    expect($('a:contains("No, do not delete")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/create/employments/${journeyId}`,
    )
    expect($('h1:contains("Are you sure you want to delete this employer")').text()).toBeTruthy()
    expect($('dt:contains("Employer name")').next().text()).toMatch(/Big Corp/)
    expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Some House(\s+)England/)
    expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/60511, ext\. 123/)
    expect($('dt:contains("Employment status")').next().text()).toMatch(/Inactive/)
    expect($('button:contains("Yes, delete")').text()).toBeTruthy()

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_DELETE_EMPLOYMENT_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/delete-employment', () => {
  it('should mark employment for deletion and redirect', async () => {
    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/1/delete-employment/${journeyId}`)
      .type('form')
      .send({})

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toEqual(`/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`)

    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.pendingEmployments!.length).toEqual(0)
  })
})
