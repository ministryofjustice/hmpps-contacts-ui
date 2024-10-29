import type { Express } from 'express'
import { v4 as uuidv4 } from 'uuid'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'
import ManageContactsJourney = journeys.ManageContactsJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>

let app: Express
let session: Partial<SessionData>
const prisonerNumber = 'A1234BC'
const journeyId: string = uuidv4()
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
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
    },
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId', () => {
  it('should render contact details page', async () => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.updateContactById.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
  describe('phone numbers', () => {
    it('should render phone numbers', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          phoneNumbers: [
            TestData.getContactPhoneNumberDetails('MOB', 'Mobile phone', '07878 111111'),
            TestData.getContactPhoneNumberDetails('HOME', 'Home phone', '01111 777777'),
          ],
        }),
      )

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.phone-number-value-1').text().trim()).toStrictEqual('07878 111111')
      expect($('.phone-number-value-2').text().trim()).toStrictEqual('01111 777777')
    })

    it('should render not provided if no phone numbers', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ phoneNumbers: [] }))

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.phone-numbers-not-provide-value').text().trim()).toStrictEqual('Not provided')
    })
  })
})
