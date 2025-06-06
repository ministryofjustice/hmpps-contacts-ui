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
let existingJourney: AddContactJourney
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    names: { firstName: 'First', middleNames: 'Middle', lastName: 'Last' },
    mode: 'NEW',
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
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/possible-existing-records', () => {
  it('should render possible existing records if there was a dob and more than one match', async () => {
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 15,
      month: 6,
      year: 1982,
    }
    const possibleRecords = [
      TestData.contactSearchResultItem({ id: 123456, firstName: 'First', middleNames: 'One', lastName: 'Last' }),
      TestData.contactSearchResultItem({ id: 654321, firstName: 'First', middleNames: '', lastName: 'Last' }),
    ]
    contactsService.searchContact.mockResolvedValue({
      content: possibleRecords,
      page: { totalPages: 1, totalElements: 1, number: 0, size: 100 },
    })

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`,
    )

    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(`Possible existing records have been found - Manage contacts - DPS`)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Possible existing records have been found')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`,
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('[data-qa=continue-button]')).toHaveLength(0)

    const continueLink = $('[data-qa=continue-adding-new-link]').first()
    expect(continueLink.attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(continueLink.parent().text().trim()).toStrictEqual(
      'Continue adding a new contact if none of these are the correct contact.',
    )

    const matchCounts = $('[data-qa=match-count]')
    expect(matchCounts).toHaveLength(2)
    expect(matchCounts.first().text().trim()).toStrictEqual('Showing 1 to 2 of 2 results')
    expect(contactsService.searchContact).toHaveBeenCalled()

    expect($('[data-qa=add-contact-123456-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/possible-existing-record-match/123456/${journeyId}`,
    )

    expect($('[data-qa=add-contact-654321-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/possible-existing-record-match/654321/${journeyId}`,
    )
  })

  it('should render possible existing records if there was a dob and only one match', async () => {
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 15,
      month: 6,
      year: 1982,
    }
    const possibleRecords = [TestData.contactSearchResultItem()]
    contactsService.searchContact.mockResolvedValue({
      content: possibleRecords,
      page: { totalPages: 1, totalElements: 1, number: 0, size: 100 },
    })

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`,
    )

    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(`Possible existing records have been found - Manage contacts - DPS`)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('A possible existing record has been found')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`,
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('[data-qa=continue-button]')).toHaveLength(0)

    const continueLink = $('[data-qa=continue-adding-new-link]').first()
    expect(continueLink.attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(continueLink.parent().text().trim()).toStrictEqual(
      'Continue adding a new contact if this is not the correct contact.',
    )

    expect($('[data-qa=match-count]')).toHaveLength(0)
    expect(contactsService.searchContact).toHaveBeenCalled()
  })

  it('should not search again if the possible matches exist already (they are reset by dob and name controllers)', async () => {
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 15,
      month: 6,
      year: 1982,
    }
    existingJourney.possibleExistingRecords = [
      TestData.contactSearchResultItem({ id: 9999, firstName: 'First', middleNames: 'One', lastName: 'Last' }),
      TestData.contactSearchResultItem({ id: 8888, firstName: 'First', middleNames: '', lastName: 'Last' }),
    ]

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`,
    )

    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    const matchCounts = $('[data-qa=match-count]')
    expect(matchCounts).toHaveLength(2)
    expect(matchCounts.first().text().trim()).toStrictEqual('Showing 1 to 2 of 2 results')

    expect(contactsService.searchContact).not.toHaveBeenCalled()
  })

  it('should not search again if the possible matches exist already even if they are empty', async () => {
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 15,
      month: 6,
      year: 1982,
    }
    existingJourney.possibleExistingRecords = []

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    expect(contactsService.searchContact).not.toHaveBeenCalled()
  })

  it('should redirect straight to relationship type if there was a dob but no matches', async () => {
    contactsService.searchContact.mockResolvedValue({
      content: [],
      page: { totalPages: 0, totalElements: 0, number: 0, size: 100 },
    })
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 15,
      month: 6,
      year: 1982,
    }

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    expect(contactsService.searchContact).toHaveBeenCalled()
  })

  it('should redirect straight to relationship type if there was no dob', async () => {
    existingJourney.dateOfBirth = {
      isKnown: 'NO',
    }

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    expect(contactsService.searchContact).not.toHaveBeenCalled()
  })

  it('should call the audit service for the page view', async () => {
    contactsService.searchContact.mockResolvedValue({
      content: [TestData.contactSearchResultItem()],
      page: { totalPages: 1, totalElements: 1, number: 0, size: 100 },
    })
    existingJourney.dateOfBirth = {
      isKnown: 'YES',
      day: 15,
      month: 6,
      year: 1982,
    }

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_POSSIBLE_EXISTING_RECORDS_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/possible-existing-records/${journeyId}`)
      .expect(expectedStatus)
  })
})
