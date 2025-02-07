import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { Page } from '../../../../services/auditService'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId/edit-contact-details', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
      TestData.prisoner({ firstName: 'Incarcerated', lastName: 'Individual' }),
    )
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
  })

  it('should audit page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
    )
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.EDIT_CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(contactsService.getContact).toHaveBeenCalledWith(1, user)
    expect(contactsService.getPrisonerContactRelationship).toHaveBeenCalledWith(99, user)
  })

  it('should have correct navigation', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
    )
    const $ = cheerio.load(response.text)
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Edit contact details for Jones Mason')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo')
  })

  describe('Personal details card', () => {
    it('should render with all personal details and change links', async () => {
      const contactDetails = {
        ...TestData.contact(),
        title: 'MR',
        titleDescription: 'Mr',
        firstName: 'First',
        middleNames: 'Middle Names',
        lastName: 'Last',
        dateOfBirth: '1982-06-15',
        gender: 'M',
        genderDescription: 'Male',
        isStaff: true,
      } as ContactDetails
      contactsService.getContact.mockResolvedValue(contactDetails)
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
      )
      const $ = cheerio.load(response.text)

      const personalInformationCard = $('h2:contains("Personal information")').parent().parent()
      expect(personalInformationCard).toHaveLength(1)
      expectSummaryListItem(
        personalInformationCard,
        'Title',
        'Mr',
        '/prisoner/A1234BC/contacts/manage/22/name?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the contact’s title (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Name',
        'First Middle Names Last',
        '/prisoner/A1234BC/contacts/manage/22/name?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change middle name (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Date of birth',
        '15 June 1982',
        '/prisoner/A1234BC/contacts/manage/22/update-dob?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the contact’s date of birth (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Gender',
        'Male',
        '/prisoner/A1234BC/contacts/manage/22/gender?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the contact’s gender (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Staff member',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/staff?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is a member of staff (Personal information)',
      )
    })

    it('should render without optional personal details', async () => {
      const contactDetails = {
        ...TestData.contact(),
        title: undefined,
        titleDescription: undefined,
        firstName: 'First',
        middleNames: undefined,
        lastName: 'Last',
        dateOfBirth: undefined,
        gender: undefined,
        genderDescription: undefined,
        isStaff: false,
      } as ContactDetails
      contactsService.getContact.mockResolvedValue(contactDetails)
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
      )
      const $ = cheerio.load(response.text)
      const personalInformationCard = $('h2:contains("Personal information")').parent().parent()
      expect(personalInformationCard).toHaveLength(1)
      expectSummaryListItem(
        personalInformationCard,
        'Title',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/name?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the contact’s title (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Name',
        'First Last',
        '/prisoner/A1234BC/contacts/manage/22/name?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Add middle name (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Date of birth',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/update-dob?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the contact’s date of birth (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Gender',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/gender?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the contact’s gender (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Staff member',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/staff?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is a member of staff (Personal information)',
      )
    })
  })

  describe('Relationship details card', () => {
    it('should render with all relationship details and change links', async () => {
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
        relationshipType: 'S',
        relationshipTypeDescription: 'Social',
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
        emergencyContact: true,
        nextOfKin: true,
        isRelationshipActive: true,
        isApprovedVisitor: true,
        comments: 'Some comments',
      } as PrisonerContactRelationshipDetails
      contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContactRelationshipDetails)

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
      )

      const $ = cheerio.load(response.text)
      const relationshipInformationCard = $('h2:contains("Relationship to prisoner Incarcerated Individual")')
        .parent()
        .parent()
      expect(relationshipInformationCard).toHaveLength(1)
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship to prisoner',
        'Friend',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/update-relationship?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the relationship to the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship status',
        'Active',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-status?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the status of the relationship (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Emergency contact',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is the prisoner’s emergency contact (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Next of kin',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/next-of-kin?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is the prisoner’s next of kin (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Approved for visits',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/approved-to-visit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is approved to visit the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Comments',
        'Some comments',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-comments?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the comments on the relationship (Relationship to prisoner Incarcerated Individual)',
      )
    })

    it('should render without optional relationship details', async () => {
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
        relationshipType: 'O',
        relationshipTypeDescription: 'Official',
        relationshipToPrisonerCode: 'DR',
        relationshipToPrisonerDescription: 'Doctor',
        emergencyContact: false,
        nextOfKin: false,
        isRelationshipActive: false,
        isApprovedVisitor: false,
        comments: undefined,
      } as PrisonerContactRelationshipDetails
      contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContactRelationshipDetails)

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
      )

      const $ = cheerio.load(response.text)
      const relationshipInformationCard = $('h2:contains("Relationship to prisoner Incarcerated Individual")')
        .parent()
        .parent()
      expect(relationshipInformationCard).toHaveLength(1)
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship to prisoner',
        'Doctor',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/update-relationship?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the relationship to the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship status',
        'Inactive',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-status?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the status of the relationship (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Emergency contact',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is the prisoner’s emergency contact (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Next of kin',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/next-of-kin?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is the prisoner’s next of kin (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Approved for visits',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/approved-to-visit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change if the contact is approved to visit the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Comments',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-comments?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo',
        'Change the comments on the relationship (Relationship to prisoner Incarcerated Individual)',
      )
    })
  })

  const expectSummaryListItem = (
    card: Cheerio<Element>,
    label: string,
    value: string,
    changeLink: string,
    changeLabel: string,
  ) => {
    expect(card.find(`dt:contains("${label}")`).next().text().trim()).toStrictEqual(value)
    const link = card.find(`dt:contains("${label}")`).next().next().find('a')
    expect(link.attr('href')).toStrictEqual(changeLink)
    expect(link.text().trim()).toStrictEqual(changeLabel)
  }
})
