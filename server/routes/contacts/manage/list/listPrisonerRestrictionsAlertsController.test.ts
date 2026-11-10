import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import {
  adminUser,
  adminUserPermissions,
  appWithAllRoutes,
  basicPrisonUser,
  readOnlyPermissions,
} from '../../../testutils/appSetup'
import { MockedService } from '../../../../testutils/mockedServices'
import TestData from '../../../testutils/testData'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import pagedPrisonerRestrictionDetails from '../../../../testutils/testPrisonerRestrictionsData'
import pagedPrisonerAlertsData from '../../../../testutils/testPrisonerAlertsData'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/alertsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()

const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner({ prisonerNumber })
let app: Express
beforeEach(() => {
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('listPrisonerRestrictionsAlertsController', () => {
  describe('GET /prisoner/:prisonerNumber/alerts-restrictions with contact admin or authoriser role', () => {
    beforeEach(() => {
      const currentUser: HmppsUser = adminUser
      app = appWithAllRoutes({
        services: {
          auditService,
          prisonerSearchService,
          contactsService,
          alertsService,
        },
        userSupplier: () => currentUser,
      })
      mockPermissions(app, adminUserPermissions)
    })

    it('should render the reviewRestrictions page with prisoner restrictions and alerts', async () => {
      // Given
      const restrictionsContent = pagedPrisonerRestrictionDetails()
      const alertsContent = pagedPrisonerAlertsData()
      contactsService.getPrisonerRestrictions.mockResolvedValue(restrictionsContent)
      alertsService.getAlerts.mockResolvedValue(alertsContent)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/alerts-restrictions`).expect(200)

      // Then
      const $ = cheerio.load(response.text)
      expect($('title').text()).toContain('Review prisoner restrictions and alerts')
      expect($('[data-qa="prisoner-restrictions-heading"]').text()).toContain('John Smith’s prisoner restrictions')
      expect($('[data-qa="prisoner-restrictions-175317-type-value"]').text()).toContain('BAN')
      expect($('[data-qa="prisoner-restrictions-175317-comments-value"]').text()).toContain('Test comment')
      expect($('[data-qa="prisoner-restrictions-175317-start-date-value"]').text()).toContain('2/10/2024')
      expect($('[data-qa="prisoner-restrictions-175317-expiry-date-value"]').text()).toContain('31/10/2024')
      expect($('[data-qa="prisoner-restrictions-175317-entered-by-value"]').text()).toContain('Prabash Balasuriya')

      expect($('[data-qa="prisoner-alerts-heading"]').text()).toContain('John Smith’s alerts')
      expect($('[data-qa="prisoner-alerts-1-comments-value"]').text()).toContain(
        'gzmONOQRHANxDCBhAmycaZSDIfUTkIlYdGXcdhtVJLBgzmONOQRHANxDCBhAmycaZSDIfUTkIlYdGXcdhtVJL',
      )
      expect($('[data-qa="prisoner-alerts-1-type-value"]').text()).toContain('Accredited Programme hold')
      expect($('[data-qa="prisoner-alerts-1-start-date-value"]').text()).toContain('1/2/2016')
      expect($('[data-qa="prisoner-alerts-1-expiry-date-value"]').text()).toContain('Not provided')
      expect($('[data-qa="prisoner-alerts-1-entered-by-value"]').text()).toContain('Admin&onb Cnomis')
    })

    it('should render the reviewRestrictions page with alerts with last modified by name', async () => {
      // Given
      const restrictionsContent = pagedPrisonerRestrictionDetails()
      const alertsContent = pagedPrisonerAlertsData({
        lastModifiedByDisplayName: 'System Admin',
      })
      contactsService.getPrisonerRestrictions.mockResolvedValue(restrictionsContent)
      alertsService.getAlerts.mockResolvedValue(alertsContent)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/alerts-restrictions`).expect(200)

      // Then
      const $ = cheerio.load(response.text)
      expect($('[data-qa="prisoner-alerts-1-entered-by-value"]').text()).toContain('System Admin')
    })

    it('should render the reviewRestrictions page with alerts with last crated by name', async () => {
      // Given
      const restrictionsContent = pagedPrisonerRestrictionDetails()
      const alertsContent = pagedPrisonerAlertsData({
        createdByDisplayName: 'Officer Jane',
        lastModifiedByDisplayName: '',
      })
      contactsService.getPrisonerRestrictions.mockResolvedValue(restrictionsContent)
      alertsService.getAlerts.mockResolvedValue(alertsContent)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/alerts-restrictions`).expect(200)

      // Then
      const $ = cheerio.load(response.text)
      expect($('[data-qa="prisoner-alerts-1-entered-by-value"]').text()).toContain('Officer Jane')
    })
  })

  describe('GET /prisoner/:prisonerNumber/alerts-restrictions without admin role', () => {
    it('should not render the reviewRestrictions page with prisoner restrictions and alerts with basic user', async () => {
      // Given
      const currentUser: HmppsUser = basicPrisonUser
      app = appWithAllRoutes({
        services: {
          auditService,
          prisonerSearchService,
          contactsService,
          alertsService,
        },
        userSupplier: () => currentUser,
      })
      mockPermissions(app, readOnlyPermissions)
      const restrictionsContent = pagedPrisonerRestrictionDetails()
      const alertsContent = pagedPrisonerAlertsData()
      contactsService.getPrisonerRestrictions.mockResolvedValue(restrictionsContent)
      alertsService.getAlerts.mockResolvedValue(alertsContent)

      // When
      await request(app).get(`/prisoner/${prisonerNumber}/alerts-restrictions`).expect(403)
    })
  })
})
