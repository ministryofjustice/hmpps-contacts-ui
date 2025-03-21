import type { Express } from 'express'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../testutils/stubReferenceData'
import AddContactJourney = journeys.AddContactJourney
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import { MockedService } from '../../../../testutils/mockedServices'
import YesOrNo = journeys.YesOrNo
import LanguageAndInterpreterRequiredForm = journeys.LanguageAndInterpreterRequiredForm

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

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
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it('should render check answers page with dob for mode NEW', async () => {
    // Given
    journey.mode = 'NEW'

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before linking the contact to John Smith',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
    )
    expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('1 January 2024')
    expect($('.check-answers-comments-value').first().text().trim()).toStrictEqual('some comments')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    const backLink = $('.govuk-back-link')
    expect(backLink.text().trim()).toStrictEqual('Back to additional information options')
    expect(backLink.attr('href')).toStrictEqual('?back=true')
  })

  it('should render alternative check answers page for mode EXISTING', async () => {
    // Given
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
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
    )
    expect($('.check-answers-comments-value').first().text().trim()).toStrictEqual('some comments')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('p > strong:contains("Contact:")').first().next().text().trim()).toStrictEqual('First Last (12345)')
    const backLink = $('.govuk-back-link')
    expect(backLink.text().trim()).toStrictEqual('Back')
    expect(backLink.attr('href')).toStrictEqual('?back=true')
  })

  it('should render check answers page without dob', async () => {
    // Given
    journey.dateOfBirth = { isKnown: 'NO' }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before linking the contact to John Smith',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
    )
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
      journey.relationship!.relationshipType = relationshipType
      journey.relationship!.relationshipToPrisoner = relationshipToPrisoner

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
    delete journey.relationship!.comments

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('.check-answers-comments-value').first().text().trim()).toStrictEqual('Not provided')
  })

  it.each([
    [undefined, 'Not provided'],
    ['M', 'Male'],
  ])(
    'should render check answers page with gender (journey: %s, display: %s)',
    async (journeyGender, displayedGender) => {
      // Given
      journey.gender = journeyGender

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(journey.isCheckingAnswers).toStrictEqual(true)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-gender-value').first().text().trim()).toStrictEqual(displayedGender)
    },
  )

  it.each([
    [undefined, 'Not provided'],
    ['YES', 'Yes'],
    ['NO', 'No'],
  ])('should render check answers page with is staff (journey: %s, display: %s)', async (journeyIsStaff, displayed) => {
    // Given
    journey.isStaff = journeyIsStaff as YesOrNo

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('.check-answers-is-staff-value').first().text().trim()).toStrictEqual(displayed)
  })

  it.each([
    [undefined, 'Not provided', 'Not provided'],
    [{ language: 'ENG' }, 'English', 'Not provided'],
    [{ language: 'ENG', interpreterRequired: 'YES' }, 'English', 'Yes'],
    [{ language: 'ENG', interpreterRequired: 'NO' }, 'English', 'No'],
    [{ interpreterRequired: 'NO' }, 'Not provided', 'No'],
  ])(
    'should render check answers page with is staff (journey: %s, display lang: %s, display interpreter: %s)',
    async (languageAndInterpreter, displayedLanguage, displayedInterpreter) => {
      // Given
      journey.languageAndInterpreter = languageAndInterpreter as LanguageAndInterpreterRequiredForm

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(journey.isCheckingAnswers).toStrictEqual(true)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-language-value').first().text().trim()).toStrictEqual(displayedLanguage)
      expect($('.check-answers-interpreter-value').first().text().trim()).toStrictEqual(displayedInterpreter)
    },
  )

  it.each([
    ['REV', 'First', 'Middle Names', 'Last', 'First Middle Names Last', 'Reverend'],
    [undefined, 'First', 'Middle Names', 'Last', 'First Middle Names Last', 'Not provided'],
    [undefined, 'First', undefined, 'Last', 'First Last', 'Not provided'],
  ])(
    'should render the title and name with optional values',
    async (title, firstName, middleNames, lastName, expectedName, expectedTitle) => {
      // Given
      journey.names = { title, firstName, middleNames, lastName }

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(journey.isCheckingAnswers).toStrictEqual(true)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-name-value').first().text().trim()).toStrictEqual(expectedName)
      expect($('.check-answers-title-value').first().text().trim()).toStrictEqual(expectedTitle)
    },
  )

  it('should render check answers page with a phone numbers', async () => {
    // Given
    journey.phoneNumbers = [
      { type: 'MOB', phoneNumber: '0123456789' },
      { type: 'HOME', phoneNumber: '987654321', extension: '#123' },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    const mobileHeading = $('dt:contains("Mobile")')
    expect(mobileHeading.next().text().trim()).toStrictEqual('0123456789')
    expect(mobileHeading.next().next().find('a').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/add-phone-numbers/${journeyId}`,
    )
    expect(mobileHeading.next().next().find('a').last().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/delete-phone-number/0/${journeyId}`,
    )
    const homeHeading = $('dt:contains("Home")')
    expect(homeHeading.next().text().trim()).toStrictEqual('987654321, ext. #123')
    expect(homeHeading.next().next().find('a').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/add-phone-numbers/${journeyId}`,
    )
    expect(homeHeading.next().next().find('a').last().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/delete-phone-number/1/${journeyId}`,
    )
  })

  it('should render check answers page with identity documents', async () => {
    // Given
    journey.identities = [
      { identityType: 'DL', identityValue: '0123456789' },
      {
        identityType: 'PASS',
        identityValue: '987654321',
        issuingAuthority: 'Authority',
      },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    const dlHeading = $('dt:contains("Driving licence")')
    expect(dlHeading.next().text().trim()).toStrictEqual('0123456789')
    expect(dlHeading.next().next().find('a').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/identities/${journeyId}#identities[0].identityValue`,
    )
    expect(dlHeading.next().next().find('a').last().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/delete-identity/1/${journeyId}`,
    )
    const ppHeading = $('dt:contains("Passport number")')
    expect(ppHeading.next().text().trim()).toStrictEqual('987654321Issued by Authority')
    expect(ppHeading.next().next().find('a').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/identities/${journeyId}#identities[1].identityValue`,
    )
    expect(ppHeading.next().next().find('a').last().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/delete-identity/2/${journeyId}`,
    )
  })

  it('should render check answers page with email addresses', async () => {
    // Given
    journey.emailAddresses = [{ emailAddress: 'a@b.cd' }, { emailAddress: 'z@y.xx' }]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    const heading = $('dt:contains("Email addresses")')
    expect(heading.next().text().trim()).toStrictEqual('a@b.cd')
    expect(heading.next().next().find('a').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/emails/${journeyId}#emails[0].emailAddress`,
    )
    expect(heading.next().next().find('a').last().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/delete-email/1/${journeyId}`,
    )
    const nextRowHeading = heading.parent().next().find('dt')
    expect(nextRowHeading.next().text().trim()).toStrictEqual('z@y.xx')
    expect(nextRowHeading.next().next().find('a').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/emails/${journeyId}#emails[1].emailAddress`,
    )
    expect(nextRowHeading.next().next().find('a').last().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/delete-email/2/${journeyId}`,
    )
  })

  it.each([
    ['S', 'Single-not married/in civil partnership'],
    [undefined, 'Not provided'],
  ])('should render the title and name with optional values', async (domesticStatusCode, displayValue) => {
    // Given
    journey.domesticStatusCode = domesticStatusCode

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('.check-answers-domestic-status-value').first().text().trim()).toStrictEqual(displayValue)
  })

  it('should call the audit service for the page view', async () => {
    // Given

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
    expect(session.addContactJourneys![journeyId]).toBeUndefined()
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
    expect(session.addContactJourneys![journeyId]).toBeUndefined()
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${uuidv4()}`)
      .type('form')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
