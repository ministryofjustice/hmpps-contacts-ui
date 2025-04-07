import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import { mockedReferenceData } from '../../testutils/stubReferenceData'
import TestData from '../../testutils/testData'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import RestrictionClass = journeys.RestrictionClass
import { MockedService } from '../../../testutils/mockedServices'

jest.mock('../../../services/auditService')
jest.mock('../../../services/referenceDataService')
jest.mock('../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 321
let existingJourney: AddRestrictionJourney

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
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addRestrictionJourneys = {}
      session.addRestrictionJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/enter-restriction/:journeyId', () => {
  it('should render enter restriction page', async () => {
    // Given
    existingJourney.restrictionClass = 'PRISONER_CONTACT'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/enter-restriction/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add a new relationship restriction - Manage contact restrictions - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Add a new relationship restriction')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-restrictions`,
    )
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render enter restriction page for estate wide', async () => {
    // Given
    existingJourney.restrictionClass = 'CONTACT_GLOBAL'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Add a new global restriction for the contact - Manage contact restrictions - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Add a new global restriction for Bar Foo')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-restrictions`,
    )
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    existingJourney.restrictionClass = 'PRISONER_CONTACT'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_RESTRICTION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: 123,
        prisonerContactId: 321,
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { type: 'BAN', startDate: '1/2/2024', expiryDate: 'never', comments: 'some comments' }
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#type').val()).toStrictEqual('BAN')
    expect($('#startDate').val()).toStrictEqual('1/2/2024')
    expect($('#expiryDate').val()).toStrictEqual('never')
    expect($('#comments').val()).toStrictEqual('some comments')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#type').val()).toStrictEqual('BAN')
    expect($('#startDate').val()).toStrictEqual('1/2/2024')
    expect($('#expiryDate').val()).toStrictEqual('2/3/2025')
    expect($('#comments').val()).toStrictEqual('some comments')
  })

  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }
    const form = { type: 'CCTV', startDate: '9/8/2027', expiryDate: 'wrong', comments: 'some comments updated' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#type').val()).toStrictEqual('CCTV')
    expect($('#startDate').val()).toStrictEqual('9/8/2027')
    expect($('#expiryDate').val()).toStrictEqual('wrong')
    expect($('#comments').val()).toStrictEqual('some comments updated')
  })

  it('should return not found if no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/enter-restriction/${uuidv4()}`,
      )
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/enter-restriction/:journeyId', () => {
  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should pass to check answers page if there are no validation errors',
    async restrictionClass => {
      existingJourney.restrictionClass = restrictionClass as RestrictionClass
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/enter-restriction/${journeyId}`,
        )
        .type('form')
        .send({ type: 'BAN', startDate: '1/2/2024', expiryDate: '2/3/2025', comments: 'some comments' })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
        )

      expect(session.addRestrictionJourneys![journeyId]!.restriction).toStrictEqual({
        type: 'BAN',
        startDate: '1/2/2024',
        expiryDate: '2/3/2025',
        comments: 'some comments',
      })
    },
  )

  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should return to enter page with details kept if there are validation errors (%s)',
    async restrictionClass => {
      existingJourney.restrictionClass = restrictionClass as RestrictionClass
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/enter-restriction/${journeyId}`,
        )
        .type('form')
        .send({})
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/enter-restriction/${journeyId}`,
        )
    },
  )

  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should return not found if no journey in session',
    async restrictionClass => {
      existingJourney.restrictionClass = restrictionClass as RestrictionClass
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/enter-restriction/${uuidv4()}`,
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
})
