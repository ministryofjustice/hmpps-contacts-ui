import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
const prisonerNumber = 'A1234BC'
const prisonerContactId = '1'
const contactId = '10'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status', () => {
  it('should render manage relationship status active status page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue({ isRelationshipActive: true })
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-status?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').text().trim()).toBe(
      'Is the relationship between Jones Mason and the prisoner active?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Save and continue')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_STATUS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status`, () => {
  it.each([
    [true, 'YES'],
    [false, 'NO'],
  ])(
    'should update relationship status active status to %s when %s is selected',
    async (expected: boolean, input: string) => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-status?returnUrl=/foo-bar`,
        )
        .type('form')
        .send({ relationshipStatus: input })
        .expect(302)
        .expect('Location', '/foo-bar')
      expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
        1,
        { isRelationshipActive: expected, updatedBy: 'user1' },
        user,
      )
    },
  )
})
