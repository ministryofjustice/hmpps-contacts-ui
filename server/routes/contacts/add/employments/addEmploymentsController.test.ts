import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/referenceDataService')
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    names: {
      lastName: 'last',
      middleNames: 'Middle',
      firstName: 'first',
    },
    dateOfBirth: {
      isKnown: 'NO',
    },
    relationship: {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: true,
      isNextOfKin: true,
    },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
    },
    userSupplier: () => basicPrisonUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/employments/:journeyId', () => {
  it('should render empty employments page', async () => {
    // Given
    existingJourney.employments = undefined

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Record employment information for the contact - Add a contact - DPS')
    expect($('h1').first().text().trim()).toStrictEqual(
      'Record employment information for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to additional information options')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('button:contains("Continue")').text()).toBeTruthy()

    expect($('a:contains("Add employer")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/organisation-search/${journeyId}`,
    )

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_EMPLOYMENTS, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render populated employments page', async () => {
    // Given
    existingJourney.employments = [
      {
        employer: {
          organisationId: 123,
          organisationName: 'Big Corp',
          countryDescription: 'England',
          businessPhoneNumber: '01234',
          businessPhoneNumberExtension: '99',
          organisationActive: true,
        },
        isActive: true,
      },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('a:contains("Add another employer")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/create/employments/new/organisation-search/${journeyId}`,
    )

    const employmentCard = $(`h2:contains("Active employer: Big Corp")`).last().parent().parent()
    expect(employmentCard).toHaveLength(1)

    const expectedTitle = 'Active employer: Big Corp'
    expectSummaryListItem(
      employmentCard,
      'Employer name',
      'Big Corp',
      `/prisoner/A1234BC/contacts/create/employments/1/organisation-search/${journeyId}`,
      `Change organisation (${expectedTitle})`,
    )
    expectSummaryListItem(employmentCard, 'Employer’s primary address', /England/)
    expectSummaryListItem(employmentCard, 'Business phone number at primary address', '01234, ext. 99')
    expectSummaryListItem(
      employmentCard,
      'Employment status',
      'Active',
      `/prisoner/A1234BC/contacts/create/employments/1/employment-status/${journeyId}`,
      `Change status of the employment with (${expectedTitle})`,
    )

    expect($('a:contains("Delete employer")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/create/employments/1/delete-employment/${journeyId}`,
    )
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/employments/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses', () => {
  it('should save employments and redirect to task list', async () => {
    existingJourney.pendingEmployments = [
      { employer: { organisationId: 123, organisationName: 'Org', organisationActive: true }, isActive: true },
    ]
    delete existingJourney.employments

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.addresses).toEqual(existingJourney.pendingAddresses)
  })

  it('should delete employments on empty list', async () => {
    existingJourney.pendingEmployments = []
    existingJourney.employments = [
      { employer: { organisationId: 123, organisationName: 'Org', organisationActive: true }, isActive: true },
    ]

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.employments).toBeUndefined()
  })

  it('should bounce back to check answers', async () => {
    existingJourney.isCheckingAnswers = true

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/employments/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

const expectSummaryListItem = (
  card: Cheerio<Element>,
  label: string,
  value: string | RegExp,
  changeLink?: string,
  changeLabel?: string,
) => {
  const summaryCardFirstColumn = card.find(`dt:contains("${label}")`).first()
  if (value instanceof RegExp) {
    expect(summaryCardFirstColumn.next().text().trim()).toMatch(value)
  } else {
    expect(summaryCardFirstColumn.next().text().trim()).toStrictEqual(value)
  }
  const link = summaryCardFirstColumn.next().next().find('a')
  if (changeLink) expect(link.attr('href')).toStrictEqual(changeLink)
  if (changeLabel) expect(link.text().trim()).toStrictEqual(changeLabel)
}
