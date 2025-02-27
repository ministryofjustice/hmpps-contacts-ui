import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import ContactDetails = contactsApiClientTypes.ContactDetails
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 987654
const prisonerContactId = 456789
const contact: ContactDetails = {
  id: contactId,
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: user.username,
  createdTime: '2024-01-01',
}
const relationship = TestData.prisonerContactRelationship({
  relationshipToPrisonerCode: 'OTHER',
})
beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-relationship-to-prisoner', () => {
  it('should have correct navigations', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(relationship)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-relationship-to-prisoner`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is First Middle Last’s relationship to John Smith?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact relationship information')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-contact-details`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
  })

  it.each([
    [
      'S',
      'Mother',
      'For example, if First Middle Last is the prisoner’s uncle, select ‘Uncle’.',
      'Select social relationship',
    ],
    [
      'O',
      'Case Administrator',
      'For example, if First Middle Last is the prisoner’s doctor, select ‘Doctor’.',
      'Select official relationship',
    ],
  ])(
    'should use correct reference group for different relationship types %s',
    async (relationshipType, expectedFirstOption: string, expectedHintText: string, expectedDefaultLabel: string) => {
      // Given
      contactsService.getContact.mockResolvedValue(contact)
      contactsService.getPrisonerContactRelationship.mockResolvedValue({
        ...relationship,
        relationshipType,
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-relationship-to-prisoner`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
        'What is First Middle Last’s relationship to John Smith?',
      )
      expect($('#relationship-hint').text().trim()).toStrictEqual(expectedHintText)
      expect($('#relationship :nth-child(1)').text()).toStrictEqual(expectedDefaultLabel)
      expect($('#relationship :nth-child(2)').text()).toStrictEqual(expectedFirstOption)
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(relationship)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-relationship-to-prisoner`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_RELATIONSHIP_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-relationship-to-prisoner', () => {
  it('should update relationship and pass to return url if there are no validation errors', async () => {
    contactsService.getContact.mockResolvedValue(contact)
    contactsService.updateContactRelationshipById.mockResolvedValue(undefined)
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-relationship-to-prisoner`,
      )
      .type('form')
      .send({ relationship: 'MOT' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const expected: UpdateRelationshipRequest = {
      relationshipToPrisoner: 'MOT',
      updatedBy: 'user1',
    }
    expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(prisonerContactId, expected, user)
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the relationship information for contact First Middle Last and prisoner John Smith.',
    )
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-relationship-to-prisoner`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-relationship-to-prisoner`,
      )
    expect(contactsService.updateContactRelationshipById).not.toHaveBeenCalled()
  })
})
