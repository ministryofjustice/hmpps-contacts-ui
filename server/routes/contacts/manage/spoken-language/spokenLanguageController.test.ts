import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import ManageContactsJourney = journeys.ManageContactsJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = '10'
let existingJourney: ManageContactsJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisoner: {
      prisonerNumber: 'G4793VF',
      lastName: 'Timothy',
      firstName: 'Jack',
      dateOfBirth: '',
      prisonName: '',
      cellLocation: '',
    },
    contactId: 23,
    activateListPage: undefined,
    inactivateListPage: undefined,
    spokeLanguage: 'ENG',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = existingJourney
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:prisonerNumber/:contactId/language', () => {
  it('should render manage spoken language page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getLanguageReference.mockResolvedValue(TestData.languages())

    // When
    const response = await request(app).get(`/contacts/manage/${prisonerNumber}/${contactId}/language/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('#spoken-language').has('option')).toBeDefined()
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_SPOKEN_LANGUAGE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})
