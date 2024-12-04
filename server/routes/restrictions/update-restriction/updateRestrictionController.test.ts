import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../testutils/appSetup'
import AuditService, { Page } from '../../../services/auditService'
import ReferenceDataService from '../../../services/referenceDataService'
import { mockedReferenceData } from '../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import RestrictionsService from '../../../services/restrictionsService'
import ContactsService from '../../../services/contactsService'
import TestData from '../../testutils/testData'
import RestrictionClass = journeys.RestrictionClass
import ContactDetails = contactsApiClientTypes.ContactDetails
import { RestrictionSchemaType } from '../schema/restrictionSchema'

jest.mock('../../../services/auditService')
jest.mock('../../../services/referenceDataService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/restrictionsService')
jest.mock('../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const restrictionsService = new RestrictionsService(null) as jest.Mocked<RestrictionsService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 321
const restrictionId = 999
const contact: ContactDetails = {
  id: contactId,
  title: 'MR',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: user.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
      contactsService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  contactsService.getContact.mockResolvedValue(contact)
  contactsService.getGlobalContactRestrictions.mockResolvedValue([
    TestData.getContactRestrictionDetails({
      contactRestrictionId: 1,
      restrictionType: 'CCTV',
    }),
    TestData.getContactRestrictionDetails({
      contactRestrictionId: restrictionId,
      restrictionType: 'BAN',
      startDate: '2024-02-01',
      expiryDate: '2025-03-02',
      comments: 'some comments',
    }),
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/update/:restrictionClass/enter-restriction/:restrictionId', () => {
  it('should render enter restriction page for PRISONER_CONTACT', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getPrisonerContactRestrictions.mockResolvedValue({
      prisonerContactRestrictions: [
        TestData.getPrisonerContactRestrictionDetails({
          prisonerContactRestrictionId: 1,
          restrictionType: 'CCTV',
        }),
        TestData.getPrisonerContactRestrictionDetails({
          prisonerContactRestrictionId: restrictionId,
          restrictionType: 'BAN',
          startDate: '2024-02-01',
          expiryDate: '2025-03-02',
          comments: 'some comments',
        }),
      ],
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/PRISONER_CONTACT/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Update a prisoner-contact restriction')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('First Middle Last (123)')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

    expect($('#type').val()).toStrictEqual('BAN')
    expect($('#startDate').val()).toStrictEqual('01/02/2024')
    expect($('#expiryDate').val()).toStrictEqual('02/03/2025')
    expect($('#comments').val()).toStrictEqual('some comments')
  })

  it('should render enter restriction page for CONTACT_GLOBAL', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Update a global restriction for contact First Last',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

    expect($('#type').val()).toStrictEqual('BAN')
    expect($('#startDate').val()).toStrictEqual('01/02/2024')
    expect($('#expiryDate').val()).toStrictEqual('02/03/2025')
    expect($('#comments').val()).toStrictEqual('some comments')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_RESTRICTION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { type: 'CHILD', startDate: '9/9/1999', expiryDate: 'never', comments: 'changed comments' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#type').val()).toStrictEqual('CHILD')
    expect($('#startDate').val()).toStrictEqual('9/9/1999')
    expect($('#expiryDate').val()).toStrictEqual('never')
    expect($('#comments').val()).toStrictEqual('changed comments')
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/update/:restrictionClass/enter-restriction/:restrictionId', () => {
  it('should update restriction and pass to entry point with flash success for PRISONER_CONTACT if there are no validation errors', async () => {
    restrictionsService.updatePrisonerContactRestriction.mockResolvedValue({})
    const form: RestrictionSchemaType = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/PRISONER_CONTACT/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
      )
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', '/foo-bar')
    expect(restrictionsService.updatePrisonerContactRestriction).toHaveBeenCalledWith(
      prisonerContactId,
      restrictionId,
      form,
      user,
    )
    expect(flashProvider).toHaveBeenCalledWith(
      'successNotificationBanner',
      'You’ve updated a prisoner-contact restriction',
    )
  })

  it('should update restriction and pass to entry point with flash success for CONTACT_GLOBAL if there are no validation errors', async () => {
    restrictionsService.updateContactGlobalRestriction.mockResolvedValue({})
    const form: RestrictionSchemaType = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
      )
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', `/foo-bar`)
    expect(restrictionsService.updateContactGlobalRestriction).toHaveBeenCalledWith(
      contactId,
      restrictionId,
      form,
      user,
    )
    expect(flashProvider).toHaveBeenCalledWith('successNotificationBanner', 'You’ve updated a global restriction')
  })

  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should return to enter page with details kept if there are validation errors (%s)',
    async (restrictionClass: RestrictionClass) => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/${restrictionClass}/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
        )
        .type('form')
        .send({})
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/${restrictionClass}/enter-restriction/${restrictionId}?returnUrl=/foo-bar`,
        )
    },
  )
})
