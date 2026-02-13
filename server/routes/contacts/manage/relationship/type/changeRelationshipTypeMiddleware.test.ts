import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { randomUUID } from 'crypto'
import { appWithAllRoutes } from '../../../../testutils/appSetup'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 987

const journeyId = randomUUID()
const prisoner = TestData.prisoner()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('ensureInChangeRelationshipTypeJourney', () => {
  it('should show error when there is no journey data', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/select-new-relationship-type/${journeyId}`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('h1:contains("Page not found")').next().text()).toContain(
      'If you typed the web address, check it is correct.',
    )
  })
})
