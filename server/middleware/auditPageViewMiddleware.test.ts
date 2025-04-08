import type { Express } from 'express'
import request from 'supertest'
import createError from 'http-errors'
import { appWithAllRoutes, user } from '../routes/testutils/appSetup'
import { Page } from '../services/auditService'
import TestData from '../routes/testutils/testData'
import { MockedService } from '../testutils/mockedServices'
import { mockedReferenceData } from '../routes/testutils/stubReferenceData'

jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/contactsService')
jest.mock('../services/referenceDataService')
jest.mock('../services/restrictionsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const restrictionsService = MockedService.RestrictionsService()

let app: Express
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
      restrictionsService,
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
  restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
    prisonerContactRestrictions: [],
    contactGlobalRestrictions: [],
  })
  contactsService.getLinkedPrisoners.mockResolvedValue({ content: [], page: { totalElements: 0 } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('auditPageViewMiddleware', () => {
  it('should only log page view event on successful access', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: '1',
        prisonerContactId: '99',
        prisonerNumber: 'A1234BC',
      },
    })
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('should log forbidden access event on failed access', async () => {
    prisonerSearchService.getByPrisonerNumber.mockRejectedValue(createError.NotFound())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    expect(response.status).toEqual(404)
    expect(auditService.logPageView).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonNumber: 'A1234BC',
        statusCode: 404,
        url: '/prisoner/A1234BC/contacts/manage/1/relationship/99',
      },
      subjectId: '1',
      subjectType: 'CONTACT',
      what: 'UNAUTHORISED_PAGE_VIEW',
    })
  })

  it('should log failed access event on server error', async () => {
    prisonerSearchService.getByPrisonerNumber.mockRejectedValue(createError.InternalServerError())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    expect(response.status).toEqual(500)
    expect(auditService.logPageView).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonNumber: 'A1234BC',
        statusCode: 500,
        url: '/prisoner/A1234BC/contacts/manage/1/relationship/99',
      },
      subjectId: '1',
      subjectType: 'CONTACT',
      what: 'FAILED_PAGE_VIEW',
    })
  })
})
