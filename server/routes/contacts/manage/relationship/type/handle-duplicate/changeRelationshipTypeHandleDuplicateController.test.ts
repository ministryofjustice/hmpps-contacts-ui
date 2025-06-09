import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../../../testutils/appSetup'
import { Page } from '../../../../../../services/auditService'
import { mockedGetReferenceDescriptionForCode } from '../../../../../testutils/stubReferenceData'
import TestData from '../../../../../testutils/testData'
import { MockedService } from '../../../../../../testutils/mockedServices'
import { ChangeRelationshipTypeJourney } from '../../../../../../@types/journeys'
import { PrisonerContactSummary } from '../../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../../interfaces/hmppsUser'

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
    mode: 'all',
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
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.changeRelationshipTypeJourneys = {}
      session.changeRelationshipTypeJourneys[journeyId] = { ...existingJourney }
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-relationship-type/handle-duplicate/${journeyId}/:journeyId`, () => {
  it('should have correct navigation', async () => {
    // Given
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'You cannot make this change as the relationship has already been recorded - Edit contact details - DPS',
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'You cannot make this change as the relationship has already been recorded',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact relationship information')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/select-new-relationship-to-prisoner/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
  })

  it('should render all relationships with inactive last', async () => {
    // Given
    existingJourney.relationshipToPrisoner = 'BRO'
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
        prisonerContactId,
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
        isRelationshipActive: true,
      },
    ])

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    const rows = $('#prisoner-contact-list tbody tr')
    const firstRowColumns = rows.eq(0).find('td')
    expect(firstRowColumns.eq(2).text().trim()).toStrictEqual('Friend')
    const secondRowColumns = rows.eq(1).find('td')
    expect(secondRowColumns.eq(2).text().trim()).toStrictEqual('Inactive relationship: Brother')
  })

  it.each([
    ['S', 'MOT', 'Mother'],
    ['O', 'CA', 'Case Administrator'],
  ])(
    'should use correct reference group for different relationship types %s',
    async (relationshipType, relationshipToPrisoner: string, expectedDescription: string) => {
      // Given
      existingJourney.relationshipType = relationshipType
      existingJourney.relationshipToPrisoner = relationshipToPrisoner
      contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([
        {
          ...minimalContact,
          prisonerContactId: 15896471,
          relationshipToPrisonerCode: relationshipToPrisoner,
          relationshipToPrisonerDescription: expectedDescription,
          isRelationshipActive: true,
        },
        {
          ...minimalContact,
          prisonerContactId,
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          isRelationshipActive: true,
        },
      ])

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('#duplicateActionGoToDupe').next().text().trim()).toStrictEqual(
        `Go to the existing record of the ‘${expectedDescription}’ relationship`,
      )
      expect($('#duplicateActionGoToContactList').next().text().trim()).toStrictEqual(
        'Go to the prisoner’s contact list',
      )
      expect($('.govuk-warning-text__text').first().text()).toContain(
        `The relationship ‘${expectedDescription}’ has already been recorded as one of multiple relationships between the contact and the prisoner.`,
      )
    },
  )

  it('should render single relationships with a different go to duple label and without the warning', async () => {
    // Given
    existingJourney.relationshipToPrisoner = 'BRO'
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([
      {
        ...minimalContact,
        prisonerContactId: 15896471,
        relationshipToPrisonerCode: 'BRO',
        relationshipToPrisonerDescription: 'Brother',
        isRelationshipActive: false,
      },
    ])

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    const rows = $('#prisoner-contact-list tbody tr')
    const firstRowColumns = rows.eq(0).find('td')
    expect(firstRowColumns.eq(2).text().trim()).toStrictEqual('Inactive relationship: Brother')
    expect($('#duplicateActionGoToDupe').next().text().trim()).toStrictEqual(
      `Go to the existing record of the relationship`,
    )
    expect($('#duplicateActionGoToContactList').next().text().trim()).toStrictEqual('Go to the prisoner’s contact list')
    expect($('.govuk-warning-text__text')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CHANGE_RELATIONSHIP_HANDLE_DUPLICATE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123',
        prisonerContactId: '897',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return not found in no journey in session', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${uuidv4()}`,
      )
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
      )
      .expect(expectedStatus)
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-relationship-type/handle-duplicate/${journeyId}`, () => {
  it('should go to the contact list if that is selected', async () => {
    // Given
    existingJourney.relationshipType = 'O'

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
      )
      .type('form')
      .send({ duplicateAction: 'GO_TO_CONTACT_LIST' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/list`)

    expect(session.changeRelationshipTypeJourneys![journeyId]).toBeUndefined()
  })

  it('should go to the duplicated contact details if that is selected', async () => {
    // Given
    const duplicatePrisonerContactId = 15896471
    existingJourney.relationshipToPrisoner = 'BRO'
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([
      {
        ...minimalContact,
        prisonerContactId: duplicatePrisonerContactId,
        relationshipToPrisonerCode: 'BRO',
        relationshipToPrisonerDescription: 'Brother',
        isRelationshipActive: false,
      },
      {
        ...minimalContact,
        prisonerContactId,
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
        isRelationshipActive: true,
      },
    ])

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
      )
      .type('form')
      .send({ duplicateAction: 'GO_TO_DUPE' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${duplicatePrisonerContactId}`,
      )

    expect(session.changeRelationshipTypeJourneys![journeyId]).toBeUndefined()
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}#`,
      )
  })

  it('should return not found in no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${uuidv4()}`,
      )
      .type('form')
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    existingJourney.relationshipType = 'O'
    contactsService.updateContactRelationshipById.mockResolvedValue(undefined)

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journeyId}`,
      )
      .type('form')
      .send({ duplicateAction: 'GO_TO_CONTACT_LIST' })
      .expect(expectedStatus)
  })
})
