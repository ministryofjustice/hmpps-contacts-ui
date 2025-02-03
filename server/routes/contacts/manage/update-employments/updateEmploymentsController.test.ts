import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { components } from '../../../../@types/contactsApi'
import InMemoryTokenStore from '../../../../data/tokenStore/inMemoryTokenStore'
import JourneyData = journeys.JourneyData

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const journeyId = uuidv4()
const prisoner = TestData.prisoner()

const suppliedJourneyData: { data: JourneyData } = {
  data: { journeyId },
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      tokenStore: {
        getToken: async () => null,
        setToken: async () => undefined,
      } as unknown as InMemoryTokenStore,
    },
    suppliedJourneyData,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/update-employments', () => {
  it('should populate prisoner and contact data into journey, then redirect', async () => {
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

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments?returnUrl=/foo/bar`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(/contacts\/manage\/1\/update-employments\/[a-f0-9-]{36}/)

    const journeyData = suppliedJourneyData.data

    expect(journeyData.updateEmployments!.prisoner!.prisonerNumber).toEqual(prisoner.prisonerNumber)
    expect(journeyData.updateEmployments!.prisoner!.firstName).toEqual(prisoner.firstName)
    expect(journeyData.updateEmployments!.prisoner!.lastName).toEqual(prisoner.lastName)
    expect(journeyData.updateEmployments!.contactId).toEqual(contact.id)
    expect(journeyData.updateEmployments!.contactNames!.firstName).toEqual(contact.firstName)
    expect(journeyData.updateEmployments!.contactNames!.middleNames).toEqual(contact.middleNames)
    expect(journeyData.updateEmployments!.contactNames!.lastName).toEqual(contact.lastName)
    expect(journeyData.updateEmployments!.contactNames!.title).toEqual(contact.title)
    expect(journeyData.updateEmployments!.employments[0]).toEqual(employment)
    expect(journeyData.updateEmployments!.returnPoint!.url).toEqual('/foo/bar')
  })
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

    suppliedJourneyData.data = {
      journeyId,
      updateEmployments: {
        prisoner: { ...prisoner, hasPrimaryAddress: false },
        contactId: contact.id,
        contactNames: { ...contact },
        employments: [employment],
        returnPoint: { url: '/foo/bar' },
      },
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
    expect($('a:contains("Change organisation (Past employer: Big Corp)")').attr('href')).toEqual('#')
    expect($('a:contains("Change status of the employment with (Past employer: Big Corp)")').attr('href')).toEqual('#')
    expect($('a:contains("Add another employer")').attr('href')).toEqual('#')
    expect($('a:contains("Cancel")').attr('href')).toEqual('/foo/bar')
  })

  it('should handle no employment record', async () => {
    // Given
    const contact = TestData.contact()

    suppliedJourneyData.data = {
      journeyId,
      updateEmployments: {
        prisoner: { ...prisoner, hasPrimaryAddress: false },
        contactId: contact.id,
        contactNames: { ...contact },
        employments: [],
        returnPoint: { url: '/foo/bar' },
      },
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Edit employment information")').parent().parent().next().text()).toContain(
      'No employers recorded.',
    )
    expect($('a:contains("Add employer")').attr('href')).toEqual('#')
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

    suppliedJourneyData.data = {
      journeyId,
      updateEmployments: {
        prisoner: { ...prisoner, hasPrimaryAddress: false },
        contactId: contact.id,
        contactNames: { ...contact },
        employments: [employment],
        returnPoint: { url: '/foo/bar' },
      },
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

  it('should show error when there is no journey data', async () => {
    // Given
    // @ts-expect-error delete non-optional property
    delete suppliedJourneyData.data

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })
})
