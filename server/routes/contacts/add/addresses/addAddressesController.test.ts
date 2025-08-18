import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
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
let currentUser: HmppsUser

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
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })

  mockPermissions(app, adminUserPermissions)

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
    expect($('title').text()).toStrictEqual('Add addresses for the contact - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add addresses for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to additional information options')
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
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
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

    const expectedTitle = 'Primary address'
    expectSummaryListItem(
      addressCard,
      'Type',
      'Home address',
      `/prisoner/A1234BC/contacts/create/addresses/1/select-type/${journeyId}`,
      `Change the address type (${expectedTitle})`,
    )
    expectSummaryListItem(
      addressCard,
      'Address',
      /No fixed addressEngland/,
      `/prisoner/A1234BC/contacts/create/addresses/1/enter-address/${journeyId}`,
      `Change the address (${expectedTitle})`,
    )
    expectSummaryListItem(
      addressCard,
      'Date',
      'From December 2011',
      `/prisoner/A1234BC/contacts/create/addresses/1/dates/${journeyId}`,
      `Change the dates for the prisoner’s use of the address (${expectedTitle})`,
    )
    expectSummaryListItem(
      addressCard,
      'Primary or postal address',
      'Primary address',
      `/prisoner/A1234BC/contacts/create/addresses/1/primary-or-postal/${journeyId}`,
      `Change if this address is set as the primary or postal address for the contact (${expectedTitle})`,
    )
    expectSummaryListItem(
      addressCard,
      'Address phone numbers',
      'Not provided',
      `/prisoner/A1234BC/contacts/create/addresses/1/phone/create/${journeyId}`,
      `Change the information about the phone number for this address (${expectedTitle})`,
    )
    expectSummaryListItem(
      addressCard,
      'Comments on this address',
      'some text',
      `/prisoner/A1234BC/contacts/create/addresses/1/comments/${journeyId}`,
      `Change the comments on this address (${expectedTitle})`,
    )

    expect($('a:contains("Delete address")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/create/addresses/1/delete/${journeyId}`,
    )
  })

  it('should render edit/delete phone links', async () => {
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
        phoneNumbers: [
          {
            type: 'HOME',
            phoneNumber: '1234',
          },
        ],
      },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=add-address-phone-link-undefined]').attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/addresses/1/phone/create/${journeyId}`,
    )
    expect($('[data-qa=delete-address-phone-undefined]').attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/addresses/1/phone/1/delete/${journeyId}`,
    )
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/addresses/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`).expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/addresses', () => {
  it('should save addresses and redirect to task list', async () => {
    existingJourney.pendingAddresses = [{ addressType: 'HOME' }]
    delete existingJourney.addresses

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.addresses).toEqual(existingJourney.pendingAddresses)
  })

  it('should delete addresses on empty list', async () => {
    existingJourney.pendingAddresses = []
    existingJourney.addresses = [{ addressType: 'HOME' }]

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.addresses).toBeUndefined()
  })

  it('should bounce back to check answers', async () => {
    existingJourney.isCheckingAnswers = true

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`)
      .type('form')
      .send({})
      .expect(403)
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
