import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, basicPrisonUser, readOnlyPermissions } from '../../../testutils/appSetup'
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
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = basicPrisonUser
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
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('listPrisonerRestrictionsAlertsController', () => {
  describe('GET /prisoner/:prisonerNumber/alerts-restrictions', () => {
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
      expect($('[data-qa="prisoner-restrictions-title"]').text()).toContain('Global restrictions')
      expect($('[data-qa="prisoner-alerts-heading"]').text()).toContain('John Smith’s prisoner alerts')
      expect(contactsService.getPrisonerRestrictions).toHaveBeenCalledWith(
        prisonerNumber,
        0,
        10,
        expect.anything(),
        true,
      )
      expect(alertsService.getAlerts).toHaveBeenCalledWith(prisonerNumber, expect.anything())
    })
  })
})
