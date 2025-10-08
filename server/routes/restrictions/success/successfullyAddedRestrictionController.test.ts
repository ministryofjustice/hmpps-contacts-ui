import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import TestData from '../../testutils/testData'
import { MockedService } from '../../../testutils/mockedServices'
import { RestrictionClass } from '../../../@types/journeys'
import mockPermissions from '../../testutils/mockPermissions'
import Permission from '../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/auditService')
jest.mock('../../../services/contactsService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/alertsService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const alertsService = MockedService.AlertsService()

let app: Express
const prisonerNumber = 'A1234BC'
const currentUser = authorisingUser
beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
      alertsService,
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: true })

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/success', () => {
  it('should render success for restriction class PRISONER_CONTACT', async () => {
    // Given
    const restrictionClass: RestrictionClass = 'PRISONER_CONTACT'
    const message: string = 'New relationship restriction recorded'
    const contactDetails = TestData.contact()
    contactsService.getContactName.mockResolvedValue(contactDetails)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactDetails.id}/relationship/123456/restriction/add/${restrictionClass}/success`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('New relationship restriction recorded - Manage contact restrictions - DPS')
    expect($('.govuk-panel__title').text().trim()).toStrictEqual(message)
    expect($('[data-qa=prisoner-name]').text().trim()).toContain('John Smith')
    expect($('[data-qa=contact-name]').text().trim()).toContain('Jones Mason')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    expect($('[data-qa=breadcrumbs] a').eq(0).attr('href')).toStrictEqual('http://localhost:3001')
    expect($('[data-qa=breadcrumbs] a').eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
    expect($('[data-qa=breadcrumbs] a').eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    expect($('[data-qa=go-to-contact-info-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/123456',
    )
    expect($('[data-qa=go-to-contacts-list-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/list',
    )
    expect($('.govuk-caption-l')).toHaveLength(0)
    expect($('a:contains("Back")').text()).toBeFalsy()
  })

  it('should render success for restriction class CONTACT_GLOBAL', async () => {
    // Given
    const restrictionClass: RestrictionClass = 'CONTACT_GLOBAL'
    const message: string = 'New global restriction recorded'
    const contactDetails = TestData.contact({ firstName: 'First', middleNames: 'Middle Names', lastName: 'Last' })
    contactsService.getContactName.mockResolvedValue(contactDetails)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactDetails.id}/relationship/123456/restriction/add/${restrictionClass}/success`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('New global restriction recorded - Manage contact restrictions - DPS')
    expect($('.govuk-panel__title').text().trim()).toStrictEqual(message)
    expect($('[data-qa=prisoner-name]')).toHaveLength(0)
    expect($('[data-qa=contact-name]').text().trim()).toContain('First Middle Names Last')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    expect($('[data-qa=breadcrumbs] a').eq(0).attr('href')).toStrictEqual('http://localhost:3001')
    expect($('[data-qa=breadcrumbs] a').eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
    expect($('[data-qa=breadcrumbs] a').eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    expect($('[data-qa=go-to-contact-info-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/123456',
    )
    expect($('[data-qa=go-to-contacts-list-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/list',
    )
    expect($('.govuk-caption-l')).toHaveLength(0)
    expect($('a:contains("Back")').text()).toBeFalsy()
  })

  it('should call the audit service for the page view', async () => {
    // Given
    const contactDetails = TestData.contact()
    contactsService.getContactName.mockResolvedValue(contactDetails)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactDetails.id}/relationship/123456/restriction/add/CONTACT_GLOBAL/success`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SUCCESSFULLY_ADDED_RESTRICTION_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '22',
        prisonerContactId: '123456',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('GET should block access without edit contact restrictions permission', async () => {
    const contactDetails = TestData.contact()
    contactsService.getContactName.mockResolvedValue(contactDetails)

    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: false })

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactDetails.id}/relationship/123456/restriction/add/CONTACT_GLOBAL/success`,
      )
      .expect(403)
  })
})
