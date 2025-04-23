import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
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
      middleNames: 'middle',
      firstName: 'first',
    },
    relationship: {
      relationshipType: 'S',
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

describe('GET /prisoner/:prisonerNumber/contacts/create/add-phone-numbers/:journeyId', () => {
  it('should render create phone number with correct navigation before check answers', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add phone numbers for the contact - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add phone numbers for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render create phone number with correct navigation when checking answers', async () => {
    existingJourney.isCheckingAnswers = true

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add phone numbers for First Middle Last (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_ADD_PHONE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.phoneNumbers = [
      { type: 'MOB', phoneNumber: '0123456789' },
      {
        type: 'HOME',
        phoneNumber: '987654321',
        extension: '#123',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('MOB')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('0123456789')
    expect($('[data-qa=phones-0-extension]').val()).toBeUndefined()
    expect($('[data-qa=phones-1-type]').val()).toStrictEqual('HOME')
    expect($('[data-qa=phones-1-phoneNumber]').val()).toStrictEqual('987654321')
    expect($('[data-qa=phones-1-extension]').val()).toStrictEqual('#123')
  })

  it('should render previously entered details if there are validation errors overriding any session values', async () => {
    // Given session has 1 but form has two different
    existingJourney.phoneNumbers = [{ type: 'MOB', phoneNumber: '999' }]
    const form = {
      phones: [
        { type: 'MOB', phoneNumber: '123456789', extension: '000' },
        {
          type: 'HOME',
          phoneNumber: '897654321',
        },
      ],
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=phones-0-type]').val()).toStrictEqual('MOB')
    expect($('[data-qa=phones-0-phoneNumber]').val()).toStrictEqual('123456789')
    expect($('[data-qa=phones-0-extension]').val()).toStrictEqual('000')
    expect($('[data-qa=phones-1-type]').val()).toStrictEqual('HOME')
    expect($('[data-qa=phones-1-phoneNumber]').val()).toStrictEqual('897654321')
    expect($('[data-qa=phones-1-extension]').val()).toBeUndefined()
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/add-phone-numbers/:journeyId', () => {
  it('should pass to additional info if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
      .type('form')
      .send({
        save: '',
        phones: [
          { type: 'MOB', phoneNumber: '999' },
          { type: 'HOME', phoneNumber: '015234879', extension: '000' },
        ],
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    const expected = [
      { type: 'MOB', phoneNumber: '999', extension: undefined },
      { type: 'HOME', phoneNumber: '015234879', extension: '000' },
    ]
    expect(session.addContactJourneys![journeyId]!.phoneNumbers).toStrictEqual(expected)
  })

  it('should allow a blank form to mean no phone numbers', async () => {
    // Given
    existingJourney.isCheckingAnswers = false
    existingJourney.phoneNumbers = [{ type: 'MOB', phoneNumber: '999' }]

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
      .type('form')
      .send({
        save: '',
        phones: [
          { type: '', phoneNumber: '', extension: '' },
          { type: '', phoneNumber: '', extension: '' },
        ],
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.phoneNumbers).toBeUndefined()
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
      .type('form')
      .send({
        save: '',
        phones: [
          { type: 'MOB', phoneNumber: '999' },
          { type: 'HOME', phoneNumber: '015234879', extension: '000' },
        ],
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expected = [
      { type: 'MOB', phoneNumber: '999', extension: undefined },
      { type: 'HOME', phoneNumber: '015234879', extension: '000' },
    ]
    expect(session.addContactJourneys![journeyId]!.phoneNumbers).toStrictEqual(expected)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
      .type('form')
      .send({ save: '', phones: [{ type: '', phoneNumber: '0123', extension: '' }] })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}#`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding a phone number', async () => {
      const form = {
        add: '',
        phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
      }

      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
        .type('form')
        .send(form)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)

      expect(existingJourney.phoneNumbers).toBeUndefined()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [
            { type: 'MOB', phoneNumber: 'a123456789', extension: '000' },
            { type: '', phoneNumber: '', extension: '' },
          ],
          add: '',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating if we are removing a phone number', async () => {
      const form = {
        remove: '1',
        phones: [
          { type: 'MOB', phoneNumber: 'a123456789', extension: '000' },
          { type: 'HOME', phoneNumber: 'b987654321', extension: 'b'.repeat(100) },
        ],
      }

      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
        .type('form')
        .send(form)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)

      expect(existingJourney.phoneNumbers).toBeUndefined()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
          remove: '1',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating even if action is not save, add or remove', async () => {
      const form = {
        phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
      }

      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
        .type('form')
        .send(form)
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)

      expect(existingJourney.phoneNumbers).toBeUndefined()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          phones: [{ type: 'MOB', phoneNumber: 'a123456789', extension: '000' }],
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })
  })
})
