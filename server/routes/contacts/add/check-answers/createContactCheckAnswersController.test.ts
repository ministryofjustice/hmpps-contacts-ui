import type { Express } from 'express'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import { mockedGetReferenceDescriptionForCode } from '../../../testutils/stubReferenceData'
import AddContactJourney = journeys.AddContactJourney
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let journey: AddContactJourney
beforeEach(() => {
  journey = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    names: {
      lastName: 'last',
      firstName: 'first',
    },
    dateOfBirth: {
      isKnown: 'YES',
      day: 1,
      month: 1,
      year: 2024,
    },
    relationship: {
      relationshipToPrisoner: 'MOT',
      isNextOfKin: 'YES',
      isEmergencyContact: 'YES',
      comments: 'some comments',
    },
    mode: 'NEW',
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      referenceDataService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = journey
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it('should render check answers page with dob for mode NEW', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.mode = 'NEW'

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Check your answers')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('1 January 2024')
    expect($('.check-answers-comments-value').first().text().trim()).toStrictEqual('some comments')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render alternative check answers page for mode EXISTING', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.mode = 'EXISTING'
    journey.contactId = 12345

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before linking the contact to John Smith',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('.check-answers-comments-value').first().text().trim()).toStrictEqual('some comments')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('p > strong:contains("Contact:")').first().next().text().trim()).toStrictEqual('First Last (12345)')
  })

  it('should render check answers page without dob', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.dateOfBirth = { isKnown: 'NO' }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Check your answers')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('Not provided')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it.each([
    ['S', 'MOT', 'Mother'],
    ['O', 'DR', 'Doctor'],
  ])(
    'should render check answers page with different relationship types (%s, %s, %s)',
    async (relationshipType: string, relationshipToPrisoner: string, relationshipToPrisonerDescription: string) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      journey.relationship.relationshipType = relationshipType
      journey.relationship.relationshipToPrisoner = relationshipToPrisoner

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-relationship-to-prisoner-value').first().text().trim()).toStrictEqual(
        relationshipToPrisonerDescription,
      )
    },
  )

  it('should render check answers page without comments', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.relationship.comments = undefined

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('.check-answers-comments-value').first().text().trim()).toStrictEqual('Not provided')
  })

  it.each([
    ['REV', 'First', 'Middle Names', 'Last', 'Last, Reverend First Middle Names'],
    [undefined, 'First', 'Middle Names', 'Last', 'Last, First Middle Names'],
    [undefined, 'First', undefined, 'Last', 'Last, First'],
  ])(
    'should render the full name with optional values and reference data',
    async (title: string, firstName: string, middleNames: string, lastName: string, expected: string) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      journey.names = { title, firstName, middleNames, lastName }

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(journey.isCheckingAnswers).toStrictEqual(true)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-name-value').first().text().trim()).toStrictEqual(expected)
    },
  )

  it('should render check answers page with a deceased date', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.existingContact = {
      isDeceased: true,
      deceasedDate: '2020-12-25',
    }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('.check-answers-deceased-value').first().text().trim()).toStrictEqual('25 December 2020')
  })

  it('should not show deceased date if not present, even if flag set to true', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.existingContact = {
      isDeceased: true,
    }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('.check-answers-deceased-value')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it('should create the contact and pass to success page', async () => {
    // Given
    const created: ContactCreationResult = {
      createdContact: {
        id: 123456,
      },
      createdRelationship: {
        prisonerContactId: 654321,
      },
    }
    contactsService.createContact.mockResolvedValue(created)
    journey.mode = 'NEW'

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
      .type('form')
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contact/NEW/123456/654321/success')

    // Then
    expect(contactsService.createContact).toHaveBeenCalledWith(journey, user)
    expect(session.addContactJourneys[journeyId]).toBeUndefined()
  })

  it('should add the contact relationship and pass to success page', async () => {
    // Given
    const created: PrisonerContactRelationshipDetails = {
      prisonerContactId: 654321,
    }
    contactsService.addContact.mockResolvedValue(created)
    journey.mode = 'EXISTING'
    journey.contactId = 123456

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
      .type('form')
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contact/EXISTING/123456/654321/success')

    // Then
    expect(contactsService.addContact).toHaveBeenCalledWith(journey, user)
    expect(session.addContactJourneys[journeyId]).toBeUndefined()
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${uuidv4()}`)
      .type('form')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
