import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/alertsService')

const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const prisonerNumber = 'A1234BC'
const journeyId = uuidv4()
const prisoner = TestData.prisoner()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      alertsService,
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('ensureInUpdateEmploymentsJourney', () => {
  it('should show error when there is no journey data', async () => {
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
