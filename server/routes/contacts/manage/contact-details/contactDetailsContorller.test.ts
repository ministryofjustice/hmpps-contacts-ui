import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>

let app: Express
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/', () => {
  it('should render contact details page', async () => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/contacts/manage/${prisonerNumber}/1`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})
