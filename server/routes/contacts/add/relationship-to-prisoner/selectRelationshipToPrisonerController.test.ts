import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { mockedReferenceData, STUBBED_SOCIAL_RELATIONSHIP_OPTIONS } from '../../../testutils/stubReferenceData'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'

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

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    names: { firstName: 'First', middleNames: 'Middle', lastName: 'Last' },
    relationship: { pendingNewRelationshipType: 'S' },
    mode: 'NEW',
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

describe('GET /prisoner/:prisonerNumber/contacts/create/select-relationship-to-prisoner', () => {
  it.each([
    ['NEW', 'Add a contact and link to a prisoner', 'Add a contact - DPS'],
    ['EXISTING', 'Link a contact to a prisoner', 'Link a contact to a prisoner - DPS'],
  ])('should render select relationship page for mode %s', async (mode, expectedCaption, titleSuffix) => {
    // Given
    existingJourney.mode = mode as 'NEW' | 'EXISTING'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(`What is the contact’s relationship to the prisoner? - ${titleSuffix}`)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is First Middle Last’s relationship to John Smith?',
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
  })

  it.each([
    [
      'S',
      'Mother',
      'For example, if First Middle Last is the prisoner’s uncle, select ‘Uncle’.',
      'Select social relationship',
    ],
    [
      'O',
      'Case Administrator',
      'For example, if First Middle Last is the prisoner’s doctor, select ‘Doctor’.',
      'Select official relationship',
    ],
  ])(
    'should use correct reference group for different relationship types %s',
    async (relationshipType, expectedFirstOption: string, expectedHintText: string, expectedDefaultLabel: string) => {
      // Given
      existingJourney.relationship = { relationshipType }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
        'What is First Middle Last’s relationship to John Smith?',
      )
      expect($('#relationship-hint').text().trim()).toStrictEqual(expectedHintText)
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('#relationship :nth-child(1)').text()).toStrictEqual(expectedDefaultLabel)
      expect($('#relationship :nth-child(2)').text()).toStrictEqual(expectedFirstOption)
    },
  )

  it.each([
    [
      'O',
      'S',
      'Mother',
      'For example, if First Middle Last is the prisoner’s uncle, select ‘Uncle’.',
      'Select social relationship',
    ],
    [
      'S',
      'O',
      'Case Administrator',
      'For example, if First Middle Last is the prisoner’s doctor, select ‘Doctor’.',
      'Select official relationship',
    ],
  ])(
    'should use correct reference group for different relationship types when we are pending a relationship type change %s',
    async (
      originalRelationshipType,
      pendingNewRelationshipType,
      expectedFirstOption: string,
      expectedHintText: string,
      expectedDefaultLabel: string,
    ) => {
      // Given
      existingJourney.relationship = {
        relationshipType: originalRelationshipType,
        pendingNewRelationshipType,
      }

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
        'What is First Middle Last’s relationship to John Smith?',
      )
      expect($('#relationship-hint').text().trim()).toStrictEqual(expectedHintText)
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('#relationship :nth-child(1)').text()).toStrictEqual(expectedDefaultLabel)
      expect($('#relationship :nth-child(2)').text()).toStrictEqual(expectedFirstOption)
    },
  )

  it('options should be default order', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#relationship :nth-child(1)').text()).toStrictEqual('Select social relationship')
    expect($('#relationship :nth-child(2)').text()).toStrictEqual('Mother')
    expect($(`#relationship :nth-child(${STUBBED_SOCIAL_RELATIONSHIP_OPTIONS.length + 1})`).text()).toStrictEqual(
      'In Loco Parentes',
    )
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_CONTACT_RELATIONSHIP, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.relationship = { relationshipType: 'S', relationshipToPrisoner: 'MOT' }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#relationship').val()).toStrictEqual('MOT')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/select-relationship-to-prisoner/:journeyId', () => {
  it('should pass to success page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`)
      .type('form')
      .send({ relationship: 'MOT' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`)

    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual({
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
    })
  })

  it('should pass to check answers page if there are no validation errors and journey is in check state where we changed the relationship type', async () => {
    // Given
    existingJourney.relationship = {
      pendingNewRelationshipType: 'S',
      relationshipToPrisoner: 'FA',
    }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`)
      .type('form')
      .send({ relationship: 'MOT' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual({
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
    })
  })

  it('should pass to check answers page if there are no validation errors and journey is in check state where we came directly to here', async () => {
    // Given
    existingJourney.relationship = {
      relationshipType: 'S',
      relationshipToPrisoner: 'FA',
    }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`)
      .type('form')
      .send({ relationship: 'MOT' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual({
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
    })
  })

  it('should return to enter page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}#`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${uuidv4()}`)
      .type('form')
      .send({ relationship: 'MOT' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
