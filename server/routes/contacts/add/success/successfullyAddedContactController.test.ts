import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const prisonerNumber = 'A1234BC'
let currentUser: HmppsUser
beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it('should render check answers page with dob for mode NEW', async () => {
    // Given
    const mode = 'NEW'
    const message = 'New contact added and linked to prisoner'
    const title = 'New contact added and linked to a prisoner - DPS'

    contactsService.getContactName.mockResolvedValue(
      TestData.contact({
        lastName: 'Last',
        middleNames: 'Middle Names',
        firstName: 'First',
      }),
    )

    // When
    const response = await request(app).get(`/prisoner/A1234BC/contact/${mode}/123456/654321/success`)

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(title)
    expect($('a:contains("Back")').text()).toBeFalsy()
    expect($('.govuk-panel__title').text().trim()).toStrictEqual(message)
    expect($('[data-qa=prisoner-name]').text().trim()).toContain('John Smith')
    expect($('[data-qa=contact-name]').text().trim()).toContain('First Middle Names Last')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    const breadcrumbs = $('[data-qa=breadcrumbs] a')
    expect(breadcrumbs.eq(0).attr('href')).toStrictEqual('http://localhost:3001')
    expect(breadcrumbs.eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
    expect(breadcrumbs.eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    expect($('.govuk-caption-l')).toHaveLength(0)

    const contactLink = $('[data-qa=go-to-contact-info-link]').first()
    expect(contactLink.text().trim()).toStrictEqual('View First Middle Names Last’s contact information')
    expect(contactLink.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/123456/relationship/654321')

    const prisonerLink = $('[data-qa=go-to-contact-list-link]').first()
    expect(prisonerLink.text().trim()).toStrictEqual('Go to John Smith’s contact list')
    expect(prisonerLink.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
  })

  it('should render check answers page with dob for mode EXISTING', async () => {
    // Given
    const mode = 'EXISTING'
    const message = 'Contact linked to prisoner'
    const title = 'Contact linked to prisoner - DPS'
    contactsService.getContactName.mockResolvedValue(
      TestData.contact({
        lastName: 'Last',
        middleNames: 'Middle Names',
        firstName: 'First',
      }),
    )

    // When
    const response = await request(app).get(`/prisoner/A1234BC/contact/${mode}/123456/654321/success`)

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(title)
    expect($('a:contains("Back")').text()).toBeFalsy()
    expect($('.govuk-panel__title').text().trim()).toStrictEqual(message)
    expect($('[data-qa=prisoner-name]').text().trim()).toContain('John Smith')
    expect($('[data-qa=contact-name]').text().trim()).toContain('First Middle Names Last')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    const breadcrumbs = $('[data-qa=breadcrumbs] a')
    expect(breadcrumbs.eq(0).attr('href')).toStrictEqual('http://localhost:3001')
    expect(breadcrumbs.eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
    expect(breadcrumbs.eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    expect($('.govuk-caption-l')).toHaveLength(0)

    const contactLink = $('[data-qa=go-to-contact-info-link]').first()
    expect(contactLink.text().trim()).toStrictEqual('View First Middle Names Last’s contact information')
    expect(contactLink.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/123456/relationship/654321')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/prisoner/A1234BC/contact/NEW/123456/654321/success`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SUCCESSFULLY_ADDED_CONTACT_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app).get(`/prisoner/A1234BC/contact/NEW/123456/654321/success`).expect(expectedStatus)
  })

  it.each(['EXISTING', 'NEW'])(
    'Should show restrictions advisory text if user can manage restrictions for mode %s',
    async mode => {
      currentUser = authorisingUser

      contactsService.getContactName.mockResolvedValue(
        TestData.contact({
          lastName: 'Last',
          middleNames: 'Middle Names',
          firstName: 'First',
        }),
      )

      // When
      const response = await request(app).get(`/prisoner/A1234BC/contact/${mode}/123456/654321/success`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('h2:contains("Add restrictions")')).toHaveLength(1)
    },
  )

  it.each(['EXISTING', 'NEW'])(
    'Should not show restrictions advisory text if user cannot manage restrictions for mode %s',
    async mode => {
      currentUser = adminUser

      contactsService.getContactName.mockResolvedValue(
        TestData.contact({
          lastName: 'Last',
          middleNames: 'Middle Names',
          firstName: 'First',
        }),
      )

      // When
      const response = await request(app).get(`/prisoner/A1234BC/contact/${mode}/123456/654321/success`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('h2:contains("Add restrictions")')).toHaveLength(0)
    },
  )
})
