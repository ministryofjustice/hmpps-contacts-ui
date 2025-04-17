import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { components } from '../../../../../@types/contactsApi'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { ContactDetails } from '../../../../../@types/contactsApiClient'

type IdentityDocument = components['schemas']['IdentityDocument']
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 987654
const prisonerContactId = 456789
const contact: ContactDetails = {
  id: contactId,
  isStaff: false,
  interpreterRequired: false,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  employments: [],
  identities: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  createdBy: user.username,
  createdTime: '',
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/create`, () => {
  it('should render create Identity Number page with navigation back to manage contact', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add identity documents for the contact - Edit contact details - DPS')
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Add identity documents for First Middle Last')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit identity documentation for a contact')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_ADD_IDENTITY_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: '987654',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors or adding or removing without javascript', async () => {
    // Given
    const form = {
      identities: [
        {
          identityType: 'DL',
          identityValue: '123456789',
          issuingAuthority: '000',
        },
        {
          identityType: '',
          identityValue: '',
          issuingAuthority: '',
        },
      ],
    }
    contactsService.getContact.mockResolvedValue(contact)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=identities-0-identityType]').val()).toStrictEqual('DL')
    expect($('[data-qa=identities-0-identityValue]').val()).toStrictEqual('123456789')
    expect($('[data-qa=identities-0-issuing-authority]').val()).toStrictEqual('000')
    expect($('[data-qa=identities-1-identityType]').val()).toStrictEqual('')
    expect($('[data-qa=identities-1-identityValue]').val()).toStrictEqual('')
    expect($('[data-qa=identities-1-issuing-authority]').val()).toStrictEqual('')
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/create`, () => {
  it('should create all identity documents and pass to manage contact details page if there are no validation errors and it is a save action', async () => {
    contactsService.createContactIdentities.mockResolvedValue(null)
    contactsService.getContactName.mockResolvedValue(TestData.contactName({ middleNames: 'Middle Names' }))

    const form = {
      save: '',
      identities: [
        { identityType: 'DL', identityValue: '123456789', issuingAuthority: '000' },
        { identityType: 'PASS', identityValue: '987564321', issuingAuthority: '' },
      ],
    }
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
      )
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const expectedIdentities: IdentityDocument[] = [
      { identityType: 'DL', identityValue: '123456789', issuingAuthority: '000' },
      { identityType: 'PASS', identityValue: '987564321' },
    ]

    expect(contactsService.createContactIdentities).toHaveBeenCalledWith(
      contactId,
      user,
      expectedIdentities,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the identity documentation for Jones Middle Names Mason.',
    )
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    const form = {
      save: '',
      identities: [{ identityType: '', identityValue: '', issuingAuthority: '' }],
    }

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
      )
      .type('form')
      .send(form)
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
      )
    expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
    expect(flashProvider).toHaveBeenCalledWith('validationErrors', expect.anything())
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding an identity', async () => {
      const form = {
        add: '',
        identities: [
          {
            identityType: 'DL',
            identityValue: 'VALUE',
            issuingAuthority:
              'A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR!',
          },
        ],
      }

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
        )
        .type('form')
        .send(form)
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
        )
      expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          identities: [
            {
              identityType: 'DL',
              identityValue: 'VALUE',
              issuingAuthority:
                'A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR!',
            },
            { identityType: '', identityValue: '', issuingAuthority: '' },
          ],
          add: '',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating if we are removing an identity', async () => {
      const form = {
        remove: '1',
        identities: [
          {
            identityType: 'DL',
            identityValue: 'VALUE',
            issuingAuthority:
              'A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR!',
          },
          {
            identityType: 'DL',
            identityValue: 'TO BE REMOVED',
            issuingAuthority: '',
          },
        ],
      }

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
        )
        .type('form')
        .send(form)
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
        )
      expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          identities: [
            {
              identityType: 'DL',
              identityValue: 'VALUE',
              issuingAuthority:
                'A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR!',
            },
          ],
          remove: '1',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating even if action is not save, add or remove', async () => {
      const form = {
        identities: [
          {
            identityType: 'DL',
            identityValue: 'VALUE',
            issuingAuthority:
              'A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR!',
          },
        ],
      }

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
        )
        .type('form')
        .send(form)
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
        )
      expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          identities: [
            {
              identityType: 'DL',
              identityValue: 'VALUE',
              issuingAuthority:
                'A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR! A LONG VALUE THAT WOULD TRIGGER ERROR!',
            },
          ],
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })
  })
})
