import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser } from '../testutils/appSetup'
import { MockedService } from '../../testutils/mockedServices'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const currentUser = authorisingUser
beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /accessibility-statement', () => {
  it('should render the page with correct title, heading and links', async () => {
    const response = await request(app).get('/accessibility-statement')
    const $ = cheerio.load(response.text)

    expect(response.status).toEqual(200)
    expect($('title').text()).toStrictEqual('Accessibility statement - Managing contacts - DPS')
    expect($('[data-qa=main-heading]').text().trim()).toEqual('Accessibility statement')

    // Service external link
    const serviceLink = $('[data-qa=service-link]')
    expect(serviceLink).toHaveLength(1)
    expect(serviceLink.attr('href')).toStrictEqual('https://contacts.hmpps.service.justice.gov.uk/')

    const accessibilityLink = $('[data-qa=accessibility-link]')
    expect(accessibilityLink).toHaveLength(1)
    expect(accessibilityLink.attr('href')).toStrictEqual('https://www.w3.org/TR/WCAG22/')

    const eassLink = $('[data-qa=eass-link]')
    expect(eassLink).toHaveLength(1)
    expect(eassLink.attr('href')).toStrictEqual('https://www.equalityadvisoryservice.com/')

    // PDF link exists
    const pdfLink = $('[data-qa=pdf-link]')
    expect(pdfLink).toHaveLength(1)
    expect(pdfLink.attr('href')).toContain('sharepoint.com')

    // Mailto link
    const mailLink = $('[data-qa=mailto-link]')
    expect(mailLink).toHaveLength(1)
    expect(mailLink.attr('href')).toBe('mailto:moveandimprove@justice.gov.uk')

    // Breadcrumbs
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `https://dps.prison.service.justice.gov.uk/accessibility-statement`,
    )
  })
})
