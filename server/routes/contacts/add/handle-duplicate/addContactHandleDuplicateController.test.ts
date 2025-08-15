import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { mockedGetReferenceDescriptionForCode } from '../../../testutils/stubReferenceData'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { PrisonerContactSummary } from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

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
    names: {
      lastName: 'last',
      middleNames: 'Middle',
      firstName: 'first',
    },
    relationship: {
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
    },
    mode: 'EXISTING',
    contactId: 123,
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
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true })
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/add/handle-duplicate/:journeyId`, () => {
  it('should have correct navigation', async () => {
    // Given
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'This relationship has already been recorded - Link a contact to a prisoner - DPS',
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'This relationship has already been recorded',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
  })

  it('should render all relationships with inactive last and multi relationship warning', async () => {
    // Given
    existingJourney.relationship!.relationshipToPrisoner = 'BRO'
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
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    const rows = $('#prisoner-contact-list tbody tr')
    const firstRowColumns = rows.eq(0).find('td')
    expect(firstRowColumns.eq(2).text().trim()).toStrictEqual('Friend')
    const secondRowColumns = rows.eq(1).find('td')
    expect(secondRowColumns.eq(2).text().trim()).toStrictEqual('Inactive relationship: Brother')

    expect($('[data-qa=multiple-relationships-warning]')).toHaveLength(1)
  })

  it('hide multi relationship warning if there is only one existing relationship and show different go to dupe label', async () => {
    // Given
    existingJourney.relationship!.relationshipToPrisoner = 'BRO'
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
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=multiple-relationships-warning]')).toHaveLength(0)
    expect($('#duplicateActionGoToDupe').next().text().trim()).toStrictEqual(
      `Go to the existing record of the relationship`,
    )
  })

  it.each([
    ['S', 'MOT', 'Mother'],
    ['O', 'CA', 'Case Administrator'],
  ])(
    'should use correct reference group for different relationship types %s',
    async (relationshipType, relationshipToPrisoner: string, expectedDescription: string) => {
      // Given
      existingJourney.relationship!.relationshipType = relationshipType
      existingJourney.relationship!.relationshipToPrisoner = relationshipToPrisoner
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
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)

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

  it('should call the audit service for the page view', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_HANDLE_DUPLICATE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return not found in no journey in session', async () => {
    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([])
    await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`).expect(403)
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/add/handle-duplicate/:journeyId`, () => {
  it('should go to the contact list if that is selected', async () => {
    // Given
    existingJourney.relationship!.relationshipType = 'O'
    existingJourney.relationship!.relationshipToPrisoner = 'DR'

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)
      .type('form')
      .send({ duplicateAction: 'GO_TO_CONTACT_LIST' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/list`)

    expect(session.addContactJourneys![journeyId]).toBeUndefined()
  })

  it('should go to the duplicated contact details if that is selected', async () => {
    // Given
    const duplicatePrisonerContactId = 15896471
    existingJourney.relationship!.relationshipType = 'S'
    existingJourney.relationship!.relationshipToPrisoner = 'BRO'
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
      .post(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)
      .type('form')
      .send({ duplicateAction: 'GO_TO_DUPE' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${duplicatePrisonerContactId}`,
      )

    expect(session.addContactJourneys![journeyId]).toBeUndefined()
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}#`)
  })

  it('should return not found in no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${uuidv4()}`)
      .type('form')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    existingJourney.relationship!.relationshipType = 'O'
    contactsService.updateContactRelationshipById.mockResolvedValue(undefined)

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/handle-duplicate/${journeyId}`)
      .type('form')
      .send({ duplicateAction: 'GO_TO_CONTACT_LIST' })
      .expect(403)
  })
})
