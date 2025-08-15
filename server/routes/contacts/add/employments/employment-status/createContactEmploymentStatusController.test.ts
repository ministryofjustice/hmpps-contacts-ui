import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../../@types/journeys'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
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
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
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
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true })

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/employment-status', () => {
  it('should show error on "new" employment index', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/employment-status/${journeyId}`,
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

  it('should render question with prepopulated answer for isActive=false', async () => {
    // Given
    existingJourney.pendingEmployments![0]!.isActive = false

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/employment-status/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What is the contact’s current employment status at the employer? - Add a contact - DPS',
    )
    expect($('.govuk-caption-l').text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('a:contains("Back")').attr('href')).toEqual(`/prisoner/A1234BC/contacts/create/employments/${journeyId}`)
    expect($('h1:contains("What is the current employment status")').text()).toBeTruthy()
    expect($('label:contains("Active")').prev('input').attr('checked')).toBeFalsy()
    expect($('label:contains("Inactive")').prev('input').attr('checked')).toBeTruthy()
    expect($('button:contains("Continue")').text()).toBeTruthy()

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_EMPLOYMENT_STATUS_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render question with prepopulated answer for isActive=true', async () => {
    // Given
    existingJourney.pendingEmployments![0]!.isActive = true

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/1/employment-status/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('label:contains("Active")').prev('input').attr('checked')).toBeTruthy()
    expect($('label:contains("Inactive")').prev('input').attr('checked')).toBeFalsy()
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    existingJourney.pendingEmployments![0]!.isActive = true
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/employments/1/employment-status/${journeyId}`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/employment-status', () => {
  it('should update employment status in session and redirect', async () => {
    // Given
    existingJourney.pendingEmployments![0]!.isActive = false

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/1/employment-status/${journeyId}`)
      .type('form')
      .send({ isActive: 'true' })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`,
    )
    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.pendingEmployments![0]!.isActive).toBeTruthy()
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/1/employment-status/${journeyId}`)
      .type('form')
      .send({ isActive: 'true' })
      .expect(403)
  })
})
