import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser, authorisingUserPermissions } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/restrictionsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const restrictionsService = MockedService.RestrictionsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = randomUUID()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = authorisingUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    mode: 'EXISTING',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
      restrictionsService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })

  mockPermissions(app, authorisingUserPermissions)

  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
  restrictionsService.getGlobalRestrictions.mockResolvedValue([])
  contactsService.getLinkedPrisoners.mockResolvedValue({ content: [], page: { totalElements: 0 } })
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('Contact details', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
  })
  describe('Common header area with authoriser role', () => {
    it('should render common header area when prisoner restrictions are present and logged in as authoriser', async () => {
      restrictionsService.getGlobalRestrictions.mockResolvedValue([TestData.getContactRestrictionDetails()])
      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/match/22/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)

      expect($('.govuk-caption-l').text()).toStrictEqual('Link a contact to a prisoner')
      expect($('[data-qa=confim-title-value-top]').text().trim()).toStrictEqual(
        'Check and confirm if you want to link contact Jones Mason to prisoner John Smith',
      )
      expect($('[data-qa=authoriser-permission-warning]')).toHaveLength(0)
      expect($('.moj-badge').text().trim()).toStrictEqual('Active restrictions in place')
      expect($('p.govuk-body.govuk-\\!-margin-top-3').text().trim()).toStrictEqual(
        'If this is the correct contact record but their information needs to be updated, you can make updates after you link the record to the prisoner.',
      )
    })
  })
})
