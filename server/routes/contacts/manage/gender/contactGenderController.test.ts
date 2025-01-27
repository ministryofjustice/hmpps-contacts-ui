import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 10

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/gender', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
  })

  it.each([
    ['M', 'Male'],
    ['F', 'Female'],
    ['NK', 'Not Known / Not Recorded'],
    ['NS', ' Specified (Indeterminate)'],
  ])('should render gender page with radio selected', async (gender: string, genderDescription: string) => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ gender, genderDescription }))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/gender?returnUrl=/foo-bar`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($(`.govuk-radios__input[value='${gender}']`).attr('checked', 'checked').val()).toStrictEqual(gender)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_GENDER_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/gender', () => {
  it('should update contact when gender is selected', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/gender?returnUrl=/foo-bar`)
      .type('form')
      .send({ gender: 'M' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(10, { gender: 'M', updatedBy: 'user1' }, user)
  })
})
