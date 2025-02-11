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
  employments: [],
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

describe('GET /contacts/manage/:contactId/update-employments/:employmentIdx/check-employer', () => {
  it('should set organisationId query into session and redirect', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}?organisationId=222`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/update-employments\/new\/check-employer\/[a-f0-9-]{36}/,
    )

    const journeyData = session.updateEmploymentsJourneys![journeyId]!

    expect(journeyData.changeOrganisationId).toEqual(222)
  })

  it('should show not found error when no organisationId is set', async () => {
    // Given
    setJourneyData(generateJourneyData())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
  })

  it('should show not found error when no organisation is found for provided ID', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      changeOrganisationId: 222,
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(404)
  })

  it('should render full details', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      changeOrganisationId: 222,
    })

    organisationsService.getOrganisation.mockResolvedValue({
      organisationName: 'Some Corp',
      organisationId: 222,
      active: false,
      deactivatedDate: '2020-12-25',
      caseloadId: 'TEST',
      programmeNumber: 123,
      vatNumber: 123456,
      comments: 'some words',
      addresses: [
        {
          primaryAddress: true,
          mailAddress: true,
          serviceAddress: false,
          street: 'Some Street',
          phoneNumbers: [
            {
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
          phoneType: 'BUS',
          phoneTypeDescription: 'Alternative Business',
          phoneNumber: '1234 1234',
          extNumber: '222',
        },
      ],
      webAddresses: [{ webAddress: 'a.b.c' }],
      emailAddresses: [{ emailAddress: 'a@b.c' }],
      organisationTypes: [{ organisationTypeDescription: 'Org Type' }],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(
      $('h1:contains("Check and confirm if this is the correct employer for contact Jones Mason")').text(),
    ).toBeTruthy()
    expect($('dt:contains("Organisation name")').next().text()).toMatch(/Some Corp/)
    expect($('dt:contains("Organisation type")').next().text()).toMatch(/Org Type/)
    expect($('dt:contains("Caseload")').next().text()).toMatch(/TEST/)
    expect($('dt:contains("Programme number")').next().text()).toMatch(/123/)
    expect($('dt:contains("VAT number")').next().text()).toMatch(/123456/)
    expect($('dt:contains("Comments on this organisation")').next().text()).toMatch(/some words/)
    expect($('dt:contains("Organisation status")').next().text()).toMatch(/Inactive/)
    expect($('dt:contains("Expiry date")').next().text()).toMatch(/December 2020/)
    expect($('dt:contains("Alternative business phone number")').next().text()).toMatch(/1234 1234, ext\. 222/)
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
    expect($('dt:contains("Mobile phone number")').next().text()).toMatch(/1234 4321/)

    expect($('.govuk-fieldset__legend:contains("Is this the correct employer for Jones Mason?")').text()).toBeTruthy()
    expect($('input#isCorrectEmployer').next().text()).toMatch(/Yes/)
    expect($('input#isCorrectEmployer-2').next().text()).toMatch(/No, take me back to the organisation search/)
    expect($('button:contains("Continue")').text()).toBeTruthy()
  })
})

it('should render result with minimal mandatory data', async () => {
  // Given
  setJourneyData({
    ...generateJourneyData(),
    changeOrganisationId: 222,
  })

  organisationsService.getOrganisation.mockResolvedValue({
    organisationName: 'Some Corp',
    organisationId: 222,
    active: true,
    addresses: [],
    phoneNumbers: [],
    webAddresses: [],
    emailAddresses: [],
    organisationTypes: [],
  })

  // When
  const response = await request(app).get(
    `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}`,
  )

  // Then
  const $ = cheerio.load(response.text)
  expect(
    $('h1:contains("Check and confirm if this is the correct employer for contact Jones Mason")').text(),
  ).toBeTruthy()
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

describe('POST /contacts/manage/:contactId/update-employments/:employmentIdx/check-employer', () => {
  it('should redirect to update-employment and add new employment record on answer YES', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.changeOrganisationId = 222
    journeyData.changeOrganisation = {
      organisationName: 'Some Corp',
      organisationId: 111,
      addresses: [
        {
          primaryAddress: true,
          street: 'Some Street',
          phoneNumbers: [
            {
              phoneType: 'BUS',
              phoneNumber: '1234 1234',
              extNumber: '222',
            },
          ],
        },
      ],
    }
    setJourneyData(journeyData)

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}`)
      .type('form')
      .send({
        isCorrectEmployer: 'YES',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(/contacts\/manage\/1\/update-employments\/[a-f0-9-]{36}/)
    expect(journeyData.employments[0]!.employer).toEqual({
      organisationName: 'Some Corp',
      organisationId: 111,
      street: 'Some Street',
      businessPhoneNumber: '1234 1234',
      businessPhoneNumberExtension: '222',
    })
    expect(journeyData.employments[0]!.isActive).toBeTruthy()
  })

  it('should redirect to update-employment and change employer on employment record on answer YES', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.employments = [
      {
        employer: {
          organisationName: 'Wrong Corp',
          organisationId: 321,
        },
        isActive: false,
      },
    ]
    journeyData.changeOrganisationId = 222
    journeyData.changeOrganisation = {
      organisationName: 'Some Corp',
      organisationId: 111,
      addresses: [
        {
          primaryAddress: true,
          street: 'Some Street',
          phoneNumbers: [
            {
              phoneType: 'BUS',
              phoneNumber: '1234 1234',
              extNumber: '222',
            },
          ],
        },
      ],
    }
    setJourneyData(journeyData)

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/1/check-employer/${journeyId}`)
      .type('form')
      .send({
        isCorrectEmployer: 'YES',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(/contacts\/manage\/1\/update-employments\/[a-f0-9-]{36}/)
    expect(journeyData.employments[0]!.employer).toEqual({
      organisationName: 'Some Corp',
      organisationId: 111,
      street: 'Some Street',
      businessPhoneNumber: '1234 1234',
      businessPhoneNumberExtension: '222',
    })
    expect(journeyData.employments[0]!.isActive).toBeFalsy()
  })

  it('should redirect to organisation-search on answer NO', async () => {
    // Given
    const journeyData = generateJourneyData()
    journeyData.changeOrganisationId = 222
    setJourneyData(journeyData)

    // When
    const response = await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/new/check-employer/${journeyId}`)
      .type('form')
      .send({
        isCorrectEmployer: 'NO',
      })

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/update-employments\/new\/organisation-search\/[a-f0-9-]{36}/,
    )
  })
})
