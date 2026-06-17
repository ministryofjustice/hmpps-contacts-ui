import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser, authorisingUserPermissions } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'
import config from '../../../../config'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const prisonerContactId = 12232
let currentUser: HmppsUser

const { linkedPrisonersConfirmationThreshold } = config
const pageVariants = [['edit-contact-details'], ['edit-contact-methods']]
const contactDetails = TestData.contact()

beforeEach(() => {
  currentUser = authorisingUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
  })
  mockPermissions(app, authorisingUserPermissions)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each(pageVariants)(
  'GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/%p/confirm',
  pageVariant => {
    it('should render edit contact confirmation page', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contactDetails)
      contactsService.getLinkedPrisoners.mockResolvedValue({
        content: [],
        page: { totalElements: linkedPrisonersConfirmationThreshold },
      })

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm`,
      )
      const $ = cheerio.load(response.text)

      expect(response.status).toEqual(200)
      expect($('title').text()).toStrictEqual('Confirm you want to edit - Edit contact details - DPS')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/12232',
      )
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('[data-qa=mini-profile]')).toHaveLength(0)
      expect($('.main-heading').text().trim()).toBe(
        `${linkedPrisonersConfirmationThreshold} prisoners are linked to Jones Mason. Are you sure you want to edit this contact?`,
      )

      expect($('input[type=radio][name=confirmContactEdit]').length).toBe(2)
      expect($('input[type=radio]:checked').length).toBe(0)
      expect($('[data-qa=continue-button]').text().trim()).toStrictEqual('Continue')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EDIT_CONTACT_CONFIRM_PAGE, {
        who: authorisingUser.username,
        correlationId: expect.any(String),
        details: {
          contactId: '22',
          prisonerContactId: '12232',
          prisonerNumber: 'A1234BC',
        },
      })
    })

    it('GET should block access without edit contacts permission', async () => {
      mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contactDetails)
      contactsService.getLinkedPrisoners.mockResolvedValue({
        content: [],
        page: { totalElements: linkedPrisonersConfirmationThreshold },
      })

      await request(app)
        .get(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm`,
        )
        .expect(403)
    })
  },
)

describe.each(pageVariants)(
  'POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/%p/confirm',
  pageVariant => {
    it('should redirect to edit page if YES is selected', async () => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm`,
        )
        .send({ confirmContactEdit: 'YES' })
        .expect(302)
        .expect('Location', `/prisoner/A1234BC/contacts/manage/22/relationship/12232/${pageVariant}`)
    })

    it('should redirect back to contact info page if NO is selected', async () => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm`,
        )
        .send({ confirmContactEdit: 'NO' })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/22/relationship/12232')
    })

    it('should return to confirmation page if there are validation errors', async () => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm`,
        )
        // .send({ isApprovedToVisit: undefined })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm#`,
        )
    })

    it('POST should block access without edit contacts permission', async () => {
      mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/${pageVariant}/confirm`,
        )
        .send({ confirmContactEdit: 'YES' })
        .expect(403)
    })
  },
)
