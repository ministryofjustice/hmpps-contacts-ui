import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, flashProvider, user } from '../../../../../testutils/appSetup'
import { Page } from '../../../../../../services/auditService'
import { mockedReferenceData } from '../../../../../testutils/stubReferenceData'
import TestData from '../../../../../testutils/testData'
import { MockedService } from '../../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../../middleware/setUpSuccessNotificationBanner'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PatchRelationshipRequest = contactsApiClientTypes.PatchRelationshipRequest
import ChangeRelationshipTypeJourney = journeys.ChangeRelationshipTypeJourney

jest.mock('../../../../../../services/auditService')
jest.mock('../../../../../../services/referenceDataService')
jest.mock('../../../../../../services/prisonerSearchService')
jest.mock('../../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 897
let existingJourney: ChangeRelationshipTypeJourney
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
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    contactId,
    prisonerContactId,
    names: {
      lastName: 'last',
      middleNames: 'middle',
      firstName: 'first',
    },
    relationshipType: 'S',
    relationshipToPrisoner: 'MOT',
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.changeRelationshipTypeJourneys = {}
      session.changeRelationshipTypeJourneys[journeyId] = { ...existingJourney }
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/type/select-new-relationship-to-prisoner/${journeyId}/:journeyId`, () => {
  it('should have correct navigation', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(relationship)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What is the contact’s relationship to the prisoner? - Edit contact details - DPS',
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is First Middle Last’s relationship to John Smith?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact relationship information')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-type/${journeyId}`,
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
      existingJourney.relationshipType = relationshipType

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
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
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(
      Page.CHANGE_RELATIONSHIP_SELECT_NEW_RELATIONSHIP_TO_PRISONER_PAGE,
      {
        who: user.username,
        correlationId: expect.any(String),
        details: {
          contactId: '123',
          prisonerContactId: '897',
          prisonerNumber: 'A1234BC',
        },
      },
    )
  })

  it('should return not found in no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/type/select-new-relationship-to-prisoner/${journeyId}`, () => {
  it('should update relationship type and relationship to prisoner and pass back to contact details page with success banner', async () => {
    // Given
    existingJourney.relationshipType = 'O'
    contactsService.getContactName.mockResolvedValue(contact)
    contactsService.updateContactRelationshipById.mockResolvedValue(undefined)

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
      )
      .type('form')
      .send({ relationship: 'DR' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    // Then
    const expected: PatchRelationshipRequest = {
      relationshipTypeCode: 'O',
      relationshipToPrisonerCode: 'DR',
      updatedBy: 'user1',
    }
    expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
      prisonerContactId,
      expected,
      user,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the relationship information for contact First Middle Last and prisoner John Smith.',
    )
    expect(session.changeRelationshipTypeJourneys![journeyId]).toBeUndefined()
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
      )
    expect(contactsService.updateContactRelationshipById).not.toHaveBeenCalled()
  })

  it('should return not found in no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${uuidv4()}`,
      )
      .type('form')
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
