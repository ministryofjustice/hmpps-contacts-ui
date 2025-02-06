import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { components } from '../../../../@types/contactsApi'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const prisonerNumber = 'A1234BC'
const journeyId = uuidv4()
const prisoner = TestData.prisoner()
let session: Partial<SessionData>
const sessionInjection = {
  setSession: (_target: Partial<SessionData>) => undefined,
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

describe('GET /contacts/manage/:contactId/update-employments/:journeyId', () => {
  it('should render employment records with change links', async () => {
    // Given
    const employment: components['schemas']['EmploymentDetails'] = {
      employmentId: 0,
      contactId: 0,
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
      createdBy: '',
      createdTime: '',
    }
    const contact = TestData.contact({ employments: [employment] })
    sessionInjection.setSession = (s: Partial<SessionData>) => {
      const target = s
      target.updateEmploymentsJourneys ??= {}
      target.updateEmploymentsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        contactId: contact.id,
        contactNames: { ...contact },
        employments: [employment],
        returnPoint: { url: '/foo/bar' },
        organisationSearch: { page: 1 },
      }
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)

    expect($('dt:contains("Employer name")').next().text()).toMatch(/Big Corp/)
    expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Some House(\s+)England/)
    expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/60511, ext\. 123/)
    expect($('dt:contains("Employment status")').next().text()).toMatch(/Inactive/)

    expect($('a:contains("Delete employer (Past employer: Big Corp)")').attr('href')).toEqual('#')
    expect($('a:contains("Change organisation (Past employer: Big Corp)")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/update-employments/1/organisation-search/${journeyId}`,
    )
    expect($('a:contains("Change status of the employment with (Past employer: Big Corp)")').attr('href')).toEqual('#')
    expect($('a:contains("Add another employer")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/update-employments/new/organisation-search/${journeyId}`,
    )
    expect($('a:contains("Cancel")').attr('href')).toEqual('/foo/bar')
  })

  it('should handle no employment record', async () => {
    // Given
    const contact = TestData.contact()
    sessionInjection.setSession = (s: Partial<SessionData>) => {
      const target = s
      target.updateEmploymentsJourneys ??= {}
      target.updateEmploymentsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        contactId: contact.id,
        contactNames: { ...contact },
        employments: [],
        returnPoint: { url: '/foo/bar' },
        organisationSearch: { page: 1 },
      }
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Edit employment information")').parent().next().text()).toContain('No employers recorded.')
    expect($('a:contains("Add employer")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/manage/1/update-employments/new/organisation-search/${journeyId}`,
    )
  })

  it('should handle employment record missing optional values', async () => {
    // Given
    const employment: components['schemas']['EmploymentDetails'] = {
      employmentId: 0,
      contactId: 0,
      employer: {
        organisationId: 0,
        organisationName: 'Small Corp',
        organisationActive: true,
      },
      isActive: true,
      createdBy: '',
      createdTime: '',
    }
    const contact = TestData.contact({ employments: [employment] })
    sessionInjection.setSession = (s: Partial<SessionData>) => {
      const target = s
      target.updateEmploymentsJourneys ??= {}
      target.updateEmploymentsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        contactId: contact.id,
        contactNames: { ...contact },
        employments: [employment],
        returnPoint: { url: '/foo/bar' },
        organisationSearch: { page: 1 },
      }
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Not provided/)
    expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/Not provided/)
  })
})
