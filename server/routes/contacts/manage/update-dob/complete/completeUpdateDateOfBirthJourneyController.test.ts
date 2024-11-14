import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ContactsService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import UpdateDateOfBirthJourney = journeys.UpdateDateOfBirthJourney
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import YesNoOrDoNotKnow = journeys.YesNoOrDoNotKnow

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/contactsService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const contactId = 99
const prisonerNumber = 'A1234BC'
let existingJourney: UpdateDateOfBirthJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    contactId,
    prisonerNumber,
    returnPoint: { url: '/foo-bar' },
    names: {
      lastName: 'last',
      firstName: 'first',
    },
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
      session.updateDateOfBirthJourneys = {}
      session.updateDateOfBirthJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/complete/:journeyId', () => {
  it('should create a patch request and redirect to manage contact when a dob is entered', async () => {
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 1,
      month: 2,
      year: 2020,
    }
    auditService.logPageView.mockResolvedValue(null)

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/complete/${journeyId}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_COMPLETE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })

    const expectedPatchRequest: PatchContactRequest = {
      dateOfBirth: new Date('2020-02-01T00:00:00.000Z'),
      estimatedIsOverEighteen: null,
      updatedBy: 'user1',
    }
    expect(contactsService.updateContactById).toHaveBeenCalledWith(contactId, expectedPatchRequest, user)
  })

  it.each([['YES'], ['NO'], ['DO_NOT_KNOW']])(
    'should create a patch request and redirect to manage contact when a dob is unknown (%s)',
    async (isOverEighteen: YesNoOrDoNotKnow) => {
      existingJourney.dateOfBirth = {
        isKnown: 'NO',
        isOverEighteen,
      }
      auditService.logPageView.mockResolvedValue(null)

      await request(app)
        .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/complete/${journeyId}`)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_COMPLETE_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })

      const expectedPatchRequest: PatchContactRequest = {
        dateOfBirth: null,
        estimatedIsOverEighteen: isOverEighteen,
        updatedBy: 'user1',
      }
      expect(contactsService.updateContactById).toHaveBeenCalledWith(contactId, expectedPatchRequest, user)
    },
  )
})
