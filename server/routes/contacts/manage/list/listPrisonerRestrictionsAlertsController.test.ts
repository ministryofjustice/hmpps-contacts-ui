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

beforeEach(() => {
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('listPrisonerRestrictionsAlertsController', () => {
  describe('GET /prisoner/:prisonerNumber/alerts-restrictions', () => {
    it('should render the reviewRestrictions page with prisoner restrictions and alerts with contact admin or authoriser role', async () => {
      // Given
      const currentUser: HmppsUser = adminUser
      const app: Express = appWithAllRoutes({
        services: {
          auditService,
          prisonerSearchService,
          contactsService,
          alertsService,
        },
        userSupplier: () => currentUser,
      })
      mockPermissions(app, adminUserPermissions)
      const restrictionsContent = pagedPrisonerRestrictionDetails()
      const alertsContent = pagedPrisonerAlertsData()
      contactsService.getPrisonerRestrictions.mockResolvedValue(restrictionsContent)
      alertsService.getAlerts.mockResolvedValue(alertsContent)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/alerts-restrictions`).expect(200)

      // Then
      const $ = cheerio.load(response.text)
      expect($('title').text()).toContain('Review prisoner restrictions and alerts')
      expect($('[data-qa="prisoner-alerts-heading"]').text()).toContain('John Smith’s alerts')
      expect(contactsService.getPrisonerRestrictions).toHaveBeenCalledWith(
        prisonerNumber,
        0,
        10,
        expect.anything(),
        false,
        false,
      )
      expect(alertsService.getAlerts).toHaveBeenCalledWith(prisonerNumber, expect.anything())
    })
  })

  describe('GET /prisoner/:prisonerNumber/alerts-restrictions', () => {
    it('should not render the reviewRestrictions page with prisoner restrictions and alerts with basic user', async () => {
      // Given
      const currentUser: HmppsUser = basicPrisonUser
      const app: Express = appWithAllRoutes({
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
