import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  adminUser,
  adminUserPermissions,
  authorisingUser,
  authorisingUserPermissions,
} from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { mockedReferenceData, STUBBED_TITLE_OPTIONS } from '../../../testutils/stubReferenceData'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

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
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })

  mockPermissions(app, adminUserPermissions)

  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-name', () => {
  it('should render enter name page', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What’s the name of the contact you want to link to the prisoner? - Add a contact - DPS',
    )
    expect($('a:contains("Back to contact search")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/search/${journeyId}`,
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What’s the name of the contact you want to link to John Smith?',
    )
    const warningText = $('[data-qa=authoriser-permission-warning]').text().trim()
    expect(warningText).toContain(
      "As a Contacts Administrator, you cannot approve this contact's visit to John Smith. If you need to do this, ask for the Contacts Authoriser",
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render enter name page with no contact authoriser role', async () => {
    currentUser = authorisingUser
    existingJourney = {
      id: journeyId,
      lastTouched: new Date().toISOString(),
      prisonerNumber,
      isCheckingAnswers: false,
      mode: 'NEW',
    }
    app = appWithAllRoutes({
      services: {
        auditService,
        referenceDataService,
        prisonerSearchService,
      },
      userSupplier: () => currentUser,
      sessionReceiver: (receivedSession: Partial<SessionData>) => {
        session = receivedSession
        session.addContactJourneys = {}
        session.addContactJourneys[journeyId] = existingJourney
      },
    })

    mockPermissions(app, authorisingUserPermissions)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What’s the name of the contact you want to link to the prisoner? - Add a contact - DPS',
    )
    expect($('a:contains("Back to contact search")').attr('href')).toEqual(
      `/prisoner/A1234BC/contacts/search/${journeyId}`,
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What’s the name of the contact you want to link to John Smith?',
    )
    expect($('[data-qa=authoriser-permission-warning]')).toHaveLength(0)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('title options are ordered alphabetically', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#title :nth-child(1)').text()).toStrictEqual('')
    expect($('#title :nth-child(2)').text()).toStrictEqual('Brother')
    expect($(`#title :nth-child(${STUBBED_TITLE_OPTIONS.length + 1})`).text()).toStrictEqual('Sister')
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_NAME_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'MR' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleNames').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.names = { firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'MR' }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleNames').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })

  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    existingJourney.names = { firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'MR' }
    const form = { firstName: 'first updated', lastName: 'last updated', middleNames: 'middle updated', title: 'DR' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first updated')
    expect($('#middleNames').val()).toStrictEqual('middle updated')
    expect($('#lastName').val()).toStrictEqual('last updated')
    expect($('#title').val()).toStrictEqual('DR')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`).expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId', () => {
  it('should pass to next page if there are no validation errors', async () => {
    existingJourney.possibleExistingRecords = [TestData.contactSearchResultItem()]

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'Mr' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.names).toStrictEqual({
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
      title: 'Mr',
    })
    expect(existingJourney.possibleExistingRecords).toBeUndefined()
  })

  it('should pass to check answers page if there are no validation errors and journey is in check state', async () => {
    // Given
    existingJourney.names = {
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
      title: 'MR',
    }
    existingJourney.isCheckingAnswers = true
    existingJourney.possibleExistingRecords = [TestData.contactSearchResultItem()]

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first updated', lastName: 'last updated', middleNames: 'middle updated', title: 'DR' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.names).toStrictEqual({
      lastName: 'last updated',
      firstName: 'first updated',
      middleNames: 'middle updated',
      title: 'DR',
    })
    expect(existingJourney.possibleExistingRecords).toBeUndefined()
  })

  it('should return to enter page with details kept if there are validation errors', async () => {
    const possibleExistingRecords = [TestData.contactSearchResultItem()]
    existingJourney.possibleExistingRecords = possibleExistingRecords

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}#`)

    expect(existingJourney.possibleExistingRecords).toStrictEqual(possibleExistingRecords)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${uuidv4()}`)
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'Mr' })
      .expect(403)
  })
})
