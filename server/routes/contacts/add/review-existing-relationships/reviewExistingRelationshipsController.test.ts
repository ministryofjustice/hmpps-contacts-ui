import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import { PrisonerContactSummary } from '../../../../@types/contactsApiClient'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/telemetryService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const telemetryService = MockedService.TelemetryService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
let currentUser: HmppsUser
const minimalContact: PrisonerContactSummary = {
  prisonerContactId: 987654321,
  contactId: 123456789,
  prisonerNumber,
  lastName: 'Last',
  firstName: 'First',
  relationshipTypeCode: 'S',
  relationshipTypeDescription: 'Social',
  relationshipToPrisonerCode: 'FR',
  relationshipToPrisonerDescription: 'Father',
  isApprovedVisitor: false,
  isNextOfKin: false,
  isEmergencyContact: false,
  isRelationshipActive: false,
  currentTerm: true,
  isStaff: false,
  restrictionSummary: {
    active: [],
    totalActive: 0,
    totalExpired: 0,
  },
}

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    names: { firstName: 'First', middleNames: 'Middle', lastName: 'Last' },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
      telemetryService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/review-existing-relationships/:matchingContactId/:journeyId', () => {
  it('should render existing relationships and navigation when there is more than one', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([
      {
        ...minimalContact,
        prisonerContactId: 15896471,
        relationshipToPrisonerCode: 'BRO',
        relationshipToPrisonerDescription: 'Brother',
        isRelationshipActive: false,
      },
      {
        ...minimalContact,
        prisonerContactId: 568598312,
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
        isRelationshipActive: true,
      },
    ])

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/review-existing-relationships/456789/${journeyId}`,
    )

    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(`The contact is already linked to the prisoner - Manage contacts - DPS`)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'The contact is already linked to the prisoner',
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to contact search')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`,
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('[data-qa=continue-button]')).toHaveLength(0)

    expect($('[data-qa=view-existing-hint]').first().text().trim()).toStrictEqual(
      'view and update these existing records',
    )

    const addAnotherLink = $('[data-qa=add-another-relationship-link]').first()
    expect(addAnotherLink.attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/match/456789/${journeyId}`,
    )
    expect(addAnotherLink.parent().text().trim()).toStrictEqual(
      'link this contact to the prisoner again - for example, to record when a contact has both social and official relationships to a prisoner',
    )

    const contactListLink = $('[data-qa=return-to-contact-list-link]').first()
    expect(contactListLink.attr('href')).toStrictEqual(`/prisoner/${prisonerNumber}/contacts/list`)
    expect(contactListLink.parent().text().trim()).toStrictEqual(
      'go back to the prisoner’s contact list without making any changes',
    )

    expect(telemetryService.trackEvent).toHaveBeenCalledWith('REVIEWING_EXISTING_RELATIONSHIPS', adminUser, {
      journeyId,
      numberOfExistingRelationships: 2,
      prisonerNumber,
      matchingContactId: '456789',
    })
    expect(contactsService.getAllSummariesForPrisonerAndContact).toHaveBeenCalledWith(prisonerNumber, 456789, adminUser)
  })

  it('should render existing relationships and navigation if there was only one', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([
      {
        ...minimalContact,
        prisonerContactId: 15896471,
        relationshipToPrisonerCode: 'BRO',
        relationshipToPrisonerDescription: 'Brother',
        isRelationshipActive: false,
      },
    ])

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/review-existing-relationships/456789/${journeyId}`,
    )

    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(`The contact is already linked to the prisoner - Manage contacts - DPS`)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'The contact is already linked to the prisoner',
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to contact search')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`,
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('[data-qa=continue-button]')).toHaveLength(0)

    expect($('[data-qa=view-existing-hint]').first().text().trim()).toStrictEqual(
      'view and update this existing record',
    )

    const addAnotherLink = $('[data-qa=add-another-relationship-link]').first()
    expect(addAnotherLink.attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/match/456789/${journeyId}`,
    )
    expect(addAnotherLink.parent().text().trim()).toStrictEqual(
      'link this contact to the prisoner again - for example, to record when a contact has both social and official relationships to a prisoner',
    )

    const contactListLink = $('[data-qa=return-to-contact-list-link]').first()
    expect(contactListLink.attr('href')).toStrictEqual(`/prisoner/${prisonerNumber}/contacts/list`)
    expect(contactListLink.parent().text().trim()).toStrictEqual(
      'go back to the prisoner’s contact list without making any changes',
    )

    expect(telemetryService.trackEvent).toHaveBeenCalledWith('REVIEWING_EXISTING_RELATIONSHIPS', adminUser, {
      journeyId,
      numberOfExistingRelationships: 1,
      prisonerNumber,
      matchingContactId: '456789',
    })
    expect(contactsService.getAllSummariesForPrisonerAndContact).toHaveBeenCalledWith(prisonerNumber, 456789, adminUser)
  })

  it('should call the audit service for the page view', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([minimalContact])
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/review-existing-relationships/456789/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_REVIEW_EXISTING_RELATIONSHIPS_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return to start if no journey in session', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([minimalContact])
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/review-existing-relationships/456789/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([minimalContact])
    currentUser = user
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/review-existing-relationships/456789/${journeyId}`)
      .expect(expectedStatus)
  })
})
