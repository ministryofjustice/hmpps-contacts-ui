import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import YesNoOrDoNotKnow = journeys.YesNoOrDoNotKnow

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
const contactId = 99
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/update-estimated-dob?returnUrl=/foo-bar', () => {
  it('should render enter estimated dob page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        lastName: 'Last',
        middleNames: 'Middle Names',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-estimated-dob?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Is Last, First Middle Names over 18 years old?',
    )
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it.each([
    ['YES', true, false, false],
    ['NO', false, true, false],
    ['DO_NOT_KNOW', false, false, true],
    [null, false, false, false],
  ])(
    'should pre-tick previous option (value: %s, yesChecked: %s, noChecked: %s, doNotKnowChecked: %s)',
    async (value: YesNoOrDoNotKnow | undefined, yesChecked: boolean, noChecked: boolean, doNotKnowChecked: boolean) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          estimatedIsOverEighteen: value,
        }),
      )

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-estimated-dob?returnUrl=/foo-bar`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($(`.govuk-radios__input[value='YES']`).attr('checked')).toStrictEqual(yesChecked ? 'checked' : undefined)
      expect($(`.govuk-radios__input[value='NO']`).attr('checked')).toStrictEqual(noChecked ? 'checked' : undefined)
      expect($(`.govuk-radios__input[value='DO_NOT_KNOW']`).attr('checked')).toStrictEqual(
        doNotKnowChecked ? 'checked' : undefined,
      )
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-estimated-dob?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_ESTIMATED_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/update-estimated-dob?returnUrl=/foo-bar', () => {
  it.each([
    ['YES', 'YES'],
    ['NO', 'NO'],
    ['DO_NOT_KNOW', 'DO_NOT_KNOW'],
  ])(
    'should pass patch the contact and return to manage contacts if there are no validation errors (%s)',
    async (formValue: string, expected: string) => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-estimated-dob?returnUrl=/foo-bar`)
        .type('form')
        .send({ isOverEighteen: formValue })
        .expect(302)
        .expect('Location', '/foo-bar')

      const expectedRequest: PatchContactRequest = {
        estimatedIsOverEighteen: expected,
        updatedBy: 'user1',
      }
      expect(contactsService.updateContactById).toHaveBeenCalledWith(contactId, expectedRequest, user)
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-estimated-dob?returnUrl=/foo-bar`)
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-estimated-dob?returnUrl=/foo-bar`,
      )
  })
})
