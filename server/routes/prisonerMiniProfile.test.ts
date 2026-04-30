import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { CorePersonRecordPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { adminUserPermissions, appWithAllRoutes, basicPrisonUser, readOnlyPermissions } from './testutils/appSetup'
import { MockedService } from '../testutils/mockedServices'
import TestData from './testutils/testData'
import { HmppsUser } from '../interfaces/hmppsUser'
import mockPermissions from './testutils/mockPermissions'
import config from '../config'
import pagedPrisonerAlertsData from '../testutils/testPrisonerAlertsData'
import RestrictionsTestData from './testutils/stubRestrictionsData'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../services/auditService')
jest.mock('../services/alertsService')
jest.mock('../services/contactsService')
jest.mock('../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const alertsService = MockedService.AlertsService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner({ prisonerNumber })
const contact = TestData.getPrisonerContact()

let app: Express
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = basicPrisonUser

  app = appWithAllRoutes({
    services: {
      auditService,
      alertsService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
  })

  alertsService.getAlerts.mockResolvedValue(pagedPrisonerAlertsData())

  contactsService.filterPrisonerContacts.mockResolvedValue({
    content: [contact],
    page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
  })
  contactsService.getPrisonerRestrictions.mockResolvedValue(RestrictionsTestData.stubRestrictionsData())

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

// Mini profile displayed on most contacts pages; testing here on
// GET /prisoner/:prisonerNumber/contacts/list
describe('Prisoner Mini Profile', () => {
  it('should render prisoner mini profile for users with read contacts permission (no alerts/restrictions)', async () => {
    mockPermissions(app, readOnlyPermissions)

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-person-profile-link]').text()).toBe('Smith, John')
        expect($('[data-qa=mini-profile-person-profile-link]').attr('href')).toBe(
          `${config.serviceUrls.digitalPrison}/prisoner/${prisonerNumber}`,
        )
        expect($('[data-qa=mini-profile-prisoner-number]').text()).toBe(prisonerNumber)
        expect($('[data-qa=mini-profile-dob]').text()).toBe('2 April 1975')
        expect($('[data-qa=mini-profile-prison-name]').text()).toBe('HMP Hewell')
        expect($('[data-qa=mini-profile-cell-location]').text()).toBe('1-1-C-028')

        // Need edit contacts permissions to view alerts and restrictions
        expect($('[data-qa=mini-profile-alerts-restrictions]').length).toBe(0)
        expect($('[data-qa=mini-profile-alerts-restrictions-unavailable]').length).toBe(0)
      })
  })

  it('should render prisoner mini profile for users with edit contacts permission (with alerts/restrictions)', async () => {
    mockPermissions(app, adminUserPermissions)

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-alerts-restrictions]').text()).toBe('1 restriction and 1 alert')
        expect($('[data-qa=mini-profile-alerts-restrictions]').attr('href')).toBe(
          `/prisoner/${prisonerNumber}/alerts-restrictions`,
        )
        expect($('[data-qa=mini-profile-alerts-restrictions-unavailable]').length).toBe(0)
      })
  })

  it('should show prisoner image for user with permission', async () => {
    mockPermissions(app, { ...readOnlyPermissions, [CorePersonRecordPermission.read_photo]: true })

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-person-img]').attr('src')).toBe(`/prisoner-image/${prisonerNumber}`)
        expect($('[data-qa=mini-profile-person-img]').attr('alt')).toBe('Image of Smith, John')
        expect($('[data-qa=mini-profile-person-img-unavailable]').length).toBe(0)
      })
  })

  it('should show fallback prisoner image for user without permission', async () => {
    mockPermissions(app, { ...readOnlyPermissions, [CorePersonRecordPermission.read_photo]: false })

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-person-img-unavailable]').attr('src')).toBe(
          '/assets/images/prisoner-profile-image.png',
        )
        expect($('[data-qa=mini-profile-person-img-unavailable]').attr('alt')).toBe(
          'Image of Smith, John is not available',
        )
        expect($('[data-qa=mini-profile-person-img]').length).toBe(0)
      })
  })

  it('should handle error fetching alerts and show API error message', async () => {
    mockPermissions(app, adminUserPermissions)
    alertsService.getAlerts.mockRejectedValue(new Error('API error'))

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-alerts-restrictions]').text()).toBe('1 restriction')
        expect($('[data-qa=mini-profile-alerts-restrictions]').attr('href')).toBe(
          `/prisoner/${prisonerNumber}/alerts-restrictions`,
        )
        expect($('[data-qa=mini-profile-alerts-restrictions-unavailable]').text()).toContain(
          'Alerts information is currently unavailable',
        )
      })
  })

  it('should handle error fetching restrictions and show API error message', async () => {
    mockPermissions(app, adminUserPermissions)
    contactsService.getPrisonerRestrictions.mockRejectedValue(new Error('API error'))

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-alerts-restrictions]').text()).toBe('1 alert')
        expect($('[data-qa=mini-profile-alerts-restrictions]').attr('href')).toBe(
          `/prisoner/${prisonerNumber}/alerts-restrictions`,
        )
        expect($('[data-qa=mini-profile-alerts-restrictions-unavailable]').text()).toContain(
          'Restrictions information is currently unavailable',
        )
      })
  })

  it('should handle errors fetching both alerts and restrictions and show API error message', async () => {
    mockPermissions(app, adminUserPermissions)
    alertsService.getAlerts.mockRejectedValue(new Error('API error'))
    contactsService.getPrisonerRestrictions.mockRejectedValue(new Error('API error'))

    return request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/list`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=mini-profile-alerts-restrictions]').length).toBe(0)
        expect($('[data-qa=mini-profile-alerts-restrictions-unavailable]').text()).toContain(
          'Restrictions and alerts information is currently unavailable',
        )
      })
  })
})
