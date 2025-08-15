import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, adminUser } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const contactId = 99
const prisonerContactId = 987654
const prisonerNumber = 'A1234BC'
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true })

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-dob', () => {
  it('should render enter dob page with a dob', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        dateOfBirth: '2010-12-15',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('What is the contact’s date of birth? - Edit contact details - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact details')
    expect($('.main-heading').first().text().trim()).toStrictEqual('What is First Middle Last’s date of birth?')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/987654',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/987654/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('#day').val()).toStrictEqual('15')
    expect($('#month').val()).toStrictEqual('12')
    expect($('#year').val()).toStrictEqual('2010')
  })

  it('should render the info text for date of birth as required for visits', async () => {
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        dateOfBirth: '2010-12-15',
      }),
    )

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`,
    )
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('.govuk-hint').parent().text()).toContain(
      'The contact’s date of birth is required for visits to the prisoner. For example, 27 3 1980.',
    )
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({}))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_ENTER_DOB_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '99',
        prisonerContactId: '987654',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        dateOfBirth: '2010-12-15',
      }),
    )

    const form = { isKnown: 'YES', day: '01', month: '06', year: '1982' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('01')
    expect($('#month').val()).toStrictEqual('06')
    expect($('#year').val()).toStrictEqual('1982')
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(TestData.contact())

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/update-dob', () => {
  it.each([
    ['01', '06', '1982'],
    ['1', '6', '1982'],
  ])(
    'should pass to complete update endpoint if there are no validation errors with the date parsable',
    async (day, month, year) => {
      contactsService.getContactName.mockResolvedValue(TestData.contact())
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`)
        .type('form')
        .send({ day, month, year })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/99/relationship/987654')

      // Then
      expect(contactsService.updateContactById).toHaveBeenCalledWith(
        contactId,
        { dateOfBirth: '1982-06-01T00:00:00.000Z' },
        currentUser,
        expect.any(String),
      )
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`)
      .type('form')
      .send({ day: 'XX' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob#`,
      )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-dob`)
      .type('form')
      .send({ day: 1, month: 2, year: 2000 })
      .expect(403)
  })
})
