import type { Express } from 'express'
import request from 'supertest'
import createError from 'http-errors'
import { appWithAllRoutes, basicPrisonUser, readOnlyPermissions } from '../routes/testutils/appSetup'
import { Page } from '../services/auditService'
import TestData from '../routes/testutils/testData'
import { MockedService } from '../testutils/mockedServices'
import { mockedReferenceData } from '../routes/testutils/stubReferenceData'
import mockPermissions from '../routes/testutils/mockPermissions'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/contactsService')
jest.mock('../services/referenceDataService')
jest.mock('../services/restrictionsService')
jest.mock('../services/contactAuditHistoryService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const restrictionsService = MockedService.RestrictionsService()
const contactAuditHistoryService = MockedService.ContactAuditHistoryService()

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
      contactAuditHistoryService,
    },
  })

  mockPermissions(app, readOnlyPermissions)

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
    contactsService.searchContact.mockResolvedValue({ content: [TestData.contactSearchResultItem()] })
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    contactsService.getPrisonerRestrictions.mockResolvedValue({ content: [] })
    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
      who: basicPrisonUser.username,
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
      who: basicPrisonUser.username,
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
      who: basicPrisonUser.username,
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
