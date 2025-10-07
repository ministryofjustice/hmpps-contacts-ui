import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import { mockedReferenceData } from '../../testutils/stubReferenceData'
import TestData from '../../testutils/testData'
import { MockedService } from '../../../testutils/mockedServices'
import { AddRestrictionJourney, RestrictionClass } from '../../../@types/journeys'
import { ContactRestrictionDetails } from '../../../@types/contactsApiClient'
import mockPermissions from '../../testutils/mockPermissions'
import Permission from '../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/auditService')
jest.mock('../../../services/referenceDataService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/restrictionsService')
jest.mock('../../../services/contactsService')
jest.mock('../../../services/alertsService')

const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const restrictionsService = MockedService.RestrictionsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 321
let existingJourney: AddRestrictionJourney
const currentUser = authorisingUser

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    contactId,
    prisonerContactId,
    restrictionClass: 'PRISONER_CONTACT',
    contactNames: {
      lastName: 'foo',
      firstName: 'bar',
    },
    restriction: {
      type: 'BAN',
      startDate: '01/02/2008',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
      contactsService,
      alertsService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addRestrictionJourneys = {}
      session.addRestrictionJourneys[journeyId] = existingJourney
    },
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: true })

  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId', () => {
  it('should render CYA restriction page for prisoner-contact with minimal details', async () => {
    // Given
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Check your answers before saving a new relationship restriction - Manage contact restrictions - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new relationship restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
    )
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/enter-restriction/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Not provided')
  })

  it('should render CYA restriction page for estate wide with minimal details', async () => {
    // Given
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'CONTACT_GLOBAL'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Check your answers before saving a new global restriction - Manage contact restrictions - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new global restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/cancel/${journeyId}`,
    )
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Not provided')
  })

  it('should render CYA restriction page for prisoner-contact with all details', async () => {
    // Given
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'Some comments',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new relationship restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
    )
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/enter-restriction/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('2 March 2025')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Some comments')

    const expectedBaseChangeLink = `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/enter-restriction/${journeyId}`
    expect($('[data-qa=change-type-link]').first().attr('href')).toStrictEqual(`${expectedBaseChangeLink}#type`)
    expect($('[data-qa=change-start-date-link]').first().attr('href')).toStrictEqual(
      `${expectedBaseChangeLink}#startDate`,
    )
    expect($('[data-qa=change-expiry-date-link]').first().attr('href')).toStrictEqual(
      `${expectedBaseChangeLink}#expiryDate`,
    )
    expect($('[data-qa=change-comments-link]').first().attr('href')).toStrictEqual(`${expectedBaseChangeLink}#comments`)
  })

  it('should render CYA restriction page for estate wide with all details', async () => {
    // Given
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'CONTACT_GLOBAL'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'Some comments',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new global restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/cancel/${journeyId}`,
    )
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('2 March 2025')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Some comments')

    const expectedBaseChangeLink = `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`
    expect($('[data-qa=change-type-link]').first().attr('href')).toStrictEqual(`${expectedBaseChangeLink}#type`)
    expect($('[data-qa=change-start-date-link]').first().attr('href')).toStrictEqual(
      `${expectedBaseChangeLink}#startDate`,
    )
    expect($('[data-qa=change-expiry-date-link]').first().attr('href')).toStrictEqual(
      `${expectedBaseChangeLink}#expiryDate`,
    )
    expect($('[data-qa=change-comments-link]').first().attr('href')).toStrictEqual(`${expectedBaseChangeLink}#comments`)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
    }
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_RESTRICTION_CHECK_ANSWERS_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123',
        prisonerContactId: '321',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return not found if no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${uuidv4()}`,
      )
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('GET should block access without edit_contact_restrictions permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: false })

    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'CONTACT_GLOBAL'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'Some comments',
    }

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
      )
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId', () => {
  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should pass to success page and remove from session %s',
    async restrictionClass => {
      existingJourney.restrictionClass = restrictionClass as RestrictionClass
      restrictionsService.createRestriction.mockResolvedValue({} as ContactRestrictionDetails)

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
        )
        .type('form')
        .send({ type: 'BAN', startDate: '1/2/2024', expiryDate: '2/3/2025', comments: 'some comments' })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/success`,
        )

      expect(restrictionsService.createRestriction).toHaveBeenCalledWith(
        existingJourney,
        authorisingUser,
        expect.any(String),
      )
      expect(session.addRestrictionJourneys![journeyId]).toBeUndefined()
    },
  )

  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should return not found if no journey in session',
    async restrictionClass => {
      existingJourney.restrictionClass = restrictionClass as RestrictionClass
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${uuidv4()}`,
        )
        .type('form')
        .send({ firstName: 'first' })
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
        })
    },
  )

  it('POST should block access without edit_contact_restrictions permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: false })

    restrictionsService.createRestriction.mockResolvedValue({} as ContactRestrictionDetails)

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
      )
      .type('form')
      .send({ type: 'BAN', startDate: '1/2/2024', expiryDate: '2/3/2025', comments: 'some comments' })
      .expect(403)
  })
})
