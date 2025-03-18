import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import AddContactJourney = journeys.AddContactJourney
import { mockedReferenceData } from '../../../testutils/stubReferenceData'

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
      isEmergencyContact: 'YES',
      isNextOfKin: 'YES',
    },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
    },
    userSupplier: () => user,
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

describe('GET /prisoner/:prisonerNumber/contacts/create/addresses/:journeyId', () => {
  it('should render empty addresses page', async () => {
    // Given
    existingJourney.addresses = undefined

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add addresses for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')

    expect($('a:contains("Add address")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`,
    )

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_ADDRESSES, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render populated addresses page', async () => {
    // Given
    existingJourney.addresses = [
      {
        addressType: 'HOME',
        addressLines: {
          noFixedAddress: true,
          countryCode: 'ENG',
        },
        addressMetadata: {
          fromMonth: '12',
          fromYear: '2011',
          comments: 'some text',
          primaryAddress: true,
          mailAddress: false,
        },
      },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('a:contains("Add another address")').attr('href')).toEqual(
      `/prisoner/${prisonerNumber}/contacts/create/addresses/new/select-type/${journeyId}`,
    )

    const addressCard = $(`h2:contains("Primary address")`).last().parent().parent()
    expect(addressCard).toHaveLength(1)
    expectSummaryListItem(addressCard, 'Type', 'Home address')
    expectSummaryListItem(addressCard, 'Address', /No fixed addressEngland/)
    expectSummaryListItem(addressCard, 'Dates', 'From December 2011')
    expectSummaryListItem(addressCard, 'Primary or postal address', 'Primary address')
    expectSummaryListItem(addressCard, 'Address phone numbers', 'Not provided')
    expectSummaryListItem(addressCard, 'Comments on this address', 'some text')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses', () => {
  it('should pass to task list', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${uuidv4()}`)
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
