import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider, adminUser, adminUserPermissions } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { UpdateEmploymentsJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/alertsService')

const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let currentUser: HmppsUser
const prisonerNumber = 'A1234BC'
const journeyId = uuidv4()
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
      contactsService,
      prisonerSearchService,
      alertsService,
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

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:journeyId', () => {
  it('should render employment records with change links', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employments: [
        {
          employmentId: 1,
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
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith('MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE', {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '1',
        prisonerContactId: '2',
        prisonerNumber,
      },
    })
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Edit employment information for a contact linked to a prisoner - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit professional information')
    expect($('h1').text()).toStrictEqual('Edit employment information for Jones Mason')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('a:contains("Back to contact record")').attr('href')).toEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/2',
    )
    expect($('dt:contains("Employer name")').next().text()).toMatch(/Big Corp/)
    expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Some House(\s+)England/)
    expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/60511, ext\. 123/)
    expect($('dt:contains("Employment status")').next().text()).toMatch(/Inactive/)

    expect($('a:contains("Delete employer (Past employer: Big Corp)")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/relationship/2/update-employments/1/delete-employment/${journeyId}`,
    )
    expect($('a:contains("Change organisation (Past employer: Big Corp)")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/relationship/2/update-employments/1/organisation-search/${journeyId}`,
    )
    expect($('a:contains("Change status of the employment with (Past employer: Big Corp)")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/relationship/2/update-employments/1/employment-status/${journeyId}`,
    )
    expect($('a:contains("Add another employer")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/relationship/2/update-employments/new/organisation-search/${journeyId}`,
    )
    expect($('a:contains("Cancel")').attr('href')).toEqual('/prisoner/A1234BC/contacts/manage/1/relationship/2')
    expect($('p:contains("To change details such as the employer name")').text()).toBeTruthy()

    expect($('strong:contains("Only record data when it is necessary to do so.")').text()).toBeTruthy()
  })

  it('should handle no employment record', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employments: [],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Edit employment information")').parent().next().next().text()).toContain(
      'No employers recorded.',
    )
    expect($('a:contains("Add employer")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/relationship/2/update-employments/new/organisation-search/${journeyId}`,
    )
    expect($('p:contains("To change details such as the employer name")').text()).toBeFalsy()
  })

  it('should handle employment record missing optional values', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employments: [
        {
          employmentId: 0,
          employer: {
            organisationId: 0,
            organisationName: 'Small Corp',
            organisationActive: true,
          },
          isActive: true,
        },
      ],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Not provided/)
    expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/Not provided/)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    setJourneyData({
      ...generateJourneyData(),
      employments: [],
    })

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`)
      .expect(403)
  })
})

describe('POST /contacts/manage/:contactId/relationship/:prisonerContactId/update-employments/:journeyId', () => {
  it('should send PATCH employments API call, then redirect with success message', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employmentIdsToDelete: [201],
      employments: [
        {
          employmentId: 1,
          employer: {
            organisationId: 101,
            organisationName: '',
            organisationActive: true,
          },
          isActive: false,
        },
        {
          employer: {
            organisationId: 102,
            organisationName: '',
            organisationActive: true,
          },
          isActive: true,
        },
      ],
    })

    // When
    const response = await request(app).post(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    expect(contactsService.patchEmployments).toHaveBeenCalledWith(
      1,
      {
        createEmployments: [
          {
            organisationId: 102,
            isActive: true,
          },
        ],
        updateEmployments: [
          {
            employmentId: 1,
            organisationId: 101,
            isActive: false,
          },
        ],
        deleteEmployments: [201],
      },
      currentUser,
      expect.any(String),
    )

    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the professional information for Jones Mason.',
    )

    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual('/prisoner/A1234BC/contacts/manage/1/relationship/2')
  })

  it('should handle request with only CREATE', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employments: [
        {
          employer: {
            organisationId: 102,
            organisationName: '',
            organisationActive: true,
          },
          isActive: true,
        },
      ],
    })

    // When
    const response = await request(app).post(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    expect(contactsService.patchEmployments).toHaveBeenCalledWith(
      1,
      {
        createEmployments: [
          {
            organisationId: 102,
            isActive: true,
          },
        ],
        updateEmployments: [],
        deleteEmployments: [],
      },
      currentUser,
      expect.any(String),
    )
    expect(response.status).toEqual(302)
  })

  it('should handle request with only UPDATE', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employments: [
        {
          employmentId: 1,
          employer: {
            organisationId: 101,
            organisationName: '',
            organisationActive: true,
          },
          isActive: false,
        },
      ],
    })

    // When
    const response = await request(app).post(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    expect(contactsService.patchEmployments).toHaveBeenCalledWith(
      1,
      {
        createEmployments: [],
        updateEmployments: [
          {
            employmentId: 1,
            organisationId: 101,
            isActive: false,
          },
        ],
        deleteEmployments: [],
      },
      currentUser,
      expect.any(String),
    )
    expect(response.status).toEqual(302)
  })

  it('should handle request with only DELETE', async () => {
    // Given
    setJourneyData({
      ...generateJourneyData(),
      employmentIdsToDelete: [201],
      employments: [],
    })

    // When
    const response = await request(app).post(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`,
    )

    // Then
    expect(contactsService.patchEmployments).toHaveBeenCalledWith(
      1,
      {
        createEmployments: [],
        updateEmployments: [],
        deleteEmployments: [201],
      },
      currentUser,
      expect.any(String),
    )
    expect(response.status).toEqual(302)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    setJourneyData({
      ...generateJourneyData(),
      employmentIdsToDelete: [201],
      employments: [
        {
          employmentId: 1,
          employer: {
            organisationId: 101,
            organisationName: '',
            organisationActive: true,
          },
          isActive: false,
        },
        {
          employer: {
            organisationId: 102,
            organisationName: '',
            organisationActive: true,
          },
          isActive: true,
        },
      ],
    })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments/${journeyId}`)
      .expect(403)
  })
})
