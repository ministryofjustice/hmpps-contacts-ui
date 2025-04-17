import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../../@types/journeys'

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

describe('GET /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/check-employer', () => {
  it('should set organisationId query into session and redirect', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}?organisationId=222`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`,
    )

    const journeyData = session.addContactJourneys![journeyId]!

    expect(journeyData.newEmployment?.organisationId).toEqual(222)
  })

  it('should show not found error when no organisationId is set', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
  })

  it('should show not found error when no organisation is found for provided ID', async () => {
    // Given
    existingJourney.newEmployment = { organisationId: 222 }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
  })

  it('should render full details', async () => {
    // Given
    existingJourney.newEmployment = { organisationId: 222 }

    organisationsService.getOrganisation.mockResolvedValue({
      organisationName: 'Some Corp',
      organisationId: 222,
      active: false,
      deactivatedDate: '2020-12-25',
      caseloadId: 'TEST',
      caseloadPrisonName: 'TEST',
      programmeNumber: '123',
      vatNumber: '123456',
      comments: 'some words',
      addresses: [
        {
          ...TestData.organisationPropDetailsBoilerplate(),
          noFixedAddress: false,
          primaryAddress: true,
          mailAddress: true,
          serviceAddress: false,
          street: 'Some Street',
          phoneNumbers: [
            {
              ...TestData.organisationPropDetailsBoilerplate(),
              phoneType: 'BUS',
              phoneTypeDescription: 'Mobile',
              phoneNumber: '1234 4321',
            },
          ],
          startDate: '2024-01-01',
          comments: 'Some additional information',
          specialNeedsCode: 'DEAF',
          specialNeedsCodeDescription: 'Hearing Impaired Translation',
          contactPersonName: 'Joe Bloggs',
          businessHours: '9-5',
        },
      ],
      phoneNumbers: [
        {
          ...TestData.organisationPropDetailsBoilerplate(),
          phoneType: 'BUS',
          phoneTypeDescription: 'Alt-Business TRA',
          phoneNumber: '1234 1234',
          extNumber: '222',
        },
      ],
      webAddresses: [{ ...TestData.organisationPropDetailsBoilerplate(), webAddress: 'a.b.c' }],
      emailAddresses: [{ ...TestData.organisationPropDetailsBoilerplate(), emailAddress: 'a@b.c' }],
      organisationTypes: [
        { ...TestData.organisationPropDetailsBoilerplate(), organisationTypeDescription: 'Org Type' },
        { ...TestData.organisationPropDetailsBoilerplate(), organisationTypeDescription: 'Another Type' },
      ],
      createdBy: '',
      createdTime: '',
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Check and confirm if it’s the correct employer for the contact - Add a contact - DPS',
    )
    expect($('.govuk-caption-l').text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('a:contains("Back")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/create/employments/new/organisation-search/${journeyId}`,
    )
    expect($('h1:contains("Check and confirm if this is the correct employer for Jones Mason")').text()).toBeTruthy()
    expect($('dt:contains("Organisation name")').next().text()).toMatch(/Some Corp/)
    expect($('dt:contains("Organisation type")').next().text()).toMatch(/Another Type\s+?Org Type/)
    expect($('dt:contains("Caseload")').next().text()).toMatch(/TEST/)
    expect($('dt:contains("Programme number")').next().text()).toMatch(/123/)
    expect($('dt:contains("VAT number")').next().text()).toMatch(/123456/)
    expect($('dt:contains("Comments on this organisation")').next().text()).toMatch(/some words/)
    expect($('dt:contains("Organisation status")').next().text()).toMatch(/Inactive/)
    expect($('dt:contains("Expiry date")').next().text()).toMatch(/December 2020/)
    expect($('dt:contains("Alt-business TRA")').next().text()).toMatch(/1234 1234, ext\. 222/)
    expect($('dt:contains("Email address")').next().text()).toMatch(/a@b\.c/)
    expect($('dt:contains("Web address")').next().text()).toMatch(/a\.b\.c/)

    expect($('dt:contains("Address")').next().text()).toMatch(/Some Street/)
    expect($('dt:contains("Dates")').next().text()).toMatch(/From January 2024/)
    expect($('dt:contains("Primary or postal address")').next().text()).toMatch(/Primary and postal address/)
    expect($('dt:contains("Service address")').next().text()).toMatch(/No/)
    expect($('dt:contains("Contact person")').next().text()).toMatch(/Joe Bloggs/)
    expect($('dt:contains("Business hours")').next().text()).toMatch(/9-5/)
    expect($('dt:contains("Special needs provision")').next().text()).toMatch(/Hearing Impaired Translation/)
    expect($('dt:contains("Comments on this address")').next().text()).toMatch(/Some additional information/)
    expect($('dt:contains("Mobile")').next().text()).toMatch(/1234 4321/)

    expect($('.govuk-fieldset__legend:contains("Is this the correct employer for Jones Mason?")').text()).toBeTruthy()
    expect($('input#isCorrectEmployer').next().text()).toMatch(/Yes/)
    expect($('input#isCorrectEmployer-2').next().text()).toMatch(/No, take me back to the organisation search/)
    expect($('button:contains("Continue")').text()).toBeTruthy()

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_CHECK_EMPLOYER_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })
})

it('should render result with minimal mandatory data', async () => {
  // Given
  existingJourney.newEmployment = { organisationId: 222 }

  organisationsService.getOrganisation.mockResolvedValue({
    organisationName: 'Some Corp',
    organisationId: 222,
    active: true,
    addresses: [],
    phoneNumbers: [],
    webAddresses: [],
    emailAddresses: [],
    organisationTypes: [],
    createdBy: '',
    createdTime: '',
  })

  // When
  const response = await request(app).get(
    `/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`,
  )

  // Then
  const $ = cheerio.load(response.text)
  expect($('h1:contains("Check and confirm if this is the correct employer for Jones Mason")').text()).toBeTruthy()
  expect($('dt:contains("Organisation name")').next().text()).toMatch(/Some Corp/)
  expect($('dt:contains("Organisation type")').next().text()).toMatch(/Not provided/)
  expect($('dt:contains("Caseload")').next().text()).toMatch(/Not provided/)
  expect($('dt:contains("Programme number")').next().text()).toMatch(/Not provided/)
  expect($('dt:contains("VAT number")').next().text()).toMatch(/Not provided/)
  expect($('dt:contains("Comments on this organisation")').next().text()).toMatch(/Not provided/)
  expect($('dt:contains("Organisation status")').next().text()).toMatch(/Active/)
  expect($('dt:contains("Expiry date")').text()).toBeFalsy()
  expect($('h2:contains("Phone numbers")').parent().next().find('.govuk-summary-list__key').text()).toMatch(
    /No phone numbers provided./,
  )
  expect($('h2:contains("Email and web addresses")').parent().next().find('.govuk-summary-list__key').text()).toMatch(
    /No email or web addresses provided./,
  )
  expect($('p:contains("No addresses provided.")').text()).toBeTruthy()
})

describe('POST /prisoner/:prisonerNumber/contacts/create/employments/:employmentIdx/check-employer', () => {
  it('should redirect to update-employment and add new employment record on answer YES', async () => {
    // Given
    existingJourney.newEmployment = {
      organisationId: 222,
    }
    organisationsService.getOrganisationSummary.mockResolvedValue({
      organisationName: 'Some Corp',
      organisationId: 111,
      street: 'Some Street',
      businessPhoneNumber: '1234 1234',
      businessPhoneNumberExtension: '222',
      organisationActive: true,
    })

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`)
      .type('form')
      .send({
        isCorrectEmployer: 'YES',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`,
    )
    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.pendingEmployments![1]!.employer).toEqual({
      organisationName: 'Some Corp',
      organisationId: 111,
      street: 'Some Street',
      businessPhoneNumber: '1234 1234',
      businessPhoneNumberExtension: '222',
      organisationActive: true,
    })
    expect(journeyData.pendingEmployments![1]!.isActive).toBeTruthy()
  })

  it('should redirect to update-employment and change employer on employment record on answer YES', async () => {
    // Given
    existingJourney.pendingEmployments = [
      {
        employer: {
          organisationName: 'Wrong Corp',
          organisationId: 321,
          organisationActive: true,
        },
        isActive: false,
      },
    ]
    existingJourney.newEmployment = {
      organisationId: 222,
    }
    organisationsService.getOrganisationSummary.mockResolvedValue({
      organisationName: 'Some Corp',
      organisationId: 111,
      street: 'Some Street',
      businessPhoneNumber: '1234 1234',
      businessPhoneNumberExtension: '222',
      organisationActive: true,
    })

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/1/check-employer/${journeyId}`)
      .type('form')
      .send({
        isCorrectEmployer: 'YES',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`,
    )
    const journeyData = session.addContactJourneys![journeyId]!
    expect(journeyData.pendingEmployments![0]!.employer).toEqual({
      organisationName: 'Some Corp',
      organisationId: 111,
      street: 'Some Street',
      businessPhoneNumber: '1234 1234',
      businessPhoneNumberExtension: '222',
      organisationActive: true,
    })
    expect(journeyData.pendingEmployments![0]!.isActive).toBeFalsy()
  })

  it('should redirect to organisation-search on answer NO', async () => {
    // Given
    existingJourney.newEmployment = { organisationId: 222 }

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/new/check-employer/${journeyId}`)
      .type('form')
      .send({
        isCorrectEmployer: 'NO',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/organisation-search/${journeyId}`,
    )
  })
})
