import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Cheerio, CheerioAPI } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { MockedService } from '../../../../testutils/mockedServices'
import TestData from '../../../testutils/testData'
import { ageInYears } from '../../../../utils/utils'
import { PrisonerContactSummary } from '../../../../@types/contactsApiClient'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner({ prisonerNumber })
const minimalContact: PrisonerContactSummary = {
  prisonerContactId: 987654321,
  contactId: 123456789,
  prisonerNumber,
  lastName: 'Last',
  firstName: 'First',
  relationshipTypeCode: 'S',
  relationshipTypeDescription: 'Social',
  relationshipToPrisonerCode: 'FR',
  relationshipToPrisonerDescription: 'Father',
  isApprovedVisitor: false,
  isNextOfKin: false,
  isEmergencyContact: false,
  isRelationshipActive: false,
  currentTerm: true,
  restrictionSummary: {
    active: [],
    totalActive: 0,
    totalExpired: 0,
  },
}
const expectDefaultSort = ['lastName,asc', 'firstName,asc', 'middleNames,asc', 'middleNames,asc', 'contactId,asc']
let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

function elementToTextLines(element: Cheerio<Element>, $: CheerioAPI) {
  return (
    element
      .contents()
      // eslint-disable-next-line func-names
      .map(function (): string {
        return $(this).text().trim()
      })
      .get()
      .filter(it => it.length > 0)
  )
}

describe('listContactsController', () => {
  describe('GET /prisoner/:prisonerNumber/contacts/list', () => {
    it('should render with correct navigation', async () => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [minimalContact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('title').text()).toStrictEqual('View and manage contacts linked to a prisoner - DPS')
      expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('View and manage contacts linked to John Smith')

      const breadcrumbLinks = $('[data-qa=breadcrumbs] a')
      expect(breadcrumbLinks).toHaveLength(2)
      expect(breadcrumbLinks.eq(0).attr('href')).toStrictEqual('http://localhost:3001')
      expect(breadcrumbLinks.eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')

      const linkContactButton = $('[data-qa=add-contact-button]').first()
      expect(linkContactButton.text().trim()).toStrictEqual('Link another contact')
      expect(linkContactButton.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/create/start')
    })

    it('should audit page view', async () => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [],
        page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      expect(response.status).toEqual(200)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
        details: {
          prisonerNumber: 'A1234BC',
        },
      })
    })

    it.each([
      [{ ...minimalContact, lastName: 'Last', firstName: 'First' }, 'Last, First', undefined, undefined, 0],
      [
        {
          ...minimalContact,
          lastName: 'Last',
          firstName: 'First',
          middleNames: 'Middle Names',
        },
        'Last, First Middle Names',
        undefined,
        undefined,
        0,
      ],
      [
        {
          ...minimalContact,
          lastName: 'Last',
          firstName: 'First',
          isEmergencyContact: true,
        },
        'Last, First',
        'Emergency contact',
        undefined,
        1,
      ],
      [
        {
          ...minimalContact,
          lastName: 'Last',
          firstName: 'First',
          isNextOfKin: true,
        },
        'Last, First',
        'Next of kin',
        undefined,
        1,
      ],
      [
        {
          ...minimalContact,
          lastName: 'Last',
          firstName: 'First',
          isEmergencyContact: true,
          isNextOfKin: true,
        },
        'Last, First',
        'Emergency contact',
        'Next of kin',
        2,
      ],
    ])(
      'should render contact name and prisoner number column correctly',
      async (contact, expectedName, expectedFirstTag, expectedSecondTag, expectedTagCount) => {
        // Given
        contactsService.filterPrisonerContacts.mockResolvedValue({
          content: [contact],
          page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
        })

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

        // Then
        const $ = cheerio.load(response.text)
        const rows = $('#prisoner-contact-list tbody tr')
        const firstRowColumns = rows.eq(0).find('td')
        const nameAndPrisonerNumber = firstRowColumns.eq(0).text().trim().split(/\r?\n/)
        expect(nameAndPrisonerNumber[0]!.trim()).toStrictEqual(expectedName)
        expect(nameAndPrisonerNumber[1]!.trim()).toStrictEqual('123456789')
        expect(firstRowColumns.eq(0).find('a').attr('href')).toStrictEqual(
          '/prisoner/A1234BC/contacts/manage/123456789/relationship/987654321',
        )

        const tags = firstRowColumns.eq(0).find('p')
        expect(tags).toHaveLength(expectedTagCount)
        if (expectedFirstTag) expect(tags.eq(0).text().trim()).toStrictEqual(expectedFirstTag)
        if (expectedSecondTag) expect(tags.eq(1).text().trim()).toStrictEqual(expectedSecondTag)
      },
    )

    it.each([
      [{ ...minimalContact, dateOfBirth: undefined }, 'Not provided', undefined],
      [{ ...minimalContact, dateOfBirth: '1982-06-01' }, '1/6/1982', `(${ageInYears('1982-06-01')} old)`],
      [{ ...minimalContact, dateOfBirth: '1999-11-29' }, '29/11/1999', `(${ageInYears('1999-11-29')} old)`],
      [{ ...minimalContact, dateOfBirth: '1982-01-01', deceasedDate: '2025-01-01' }, '1/1/1982', '(Deceased)'],
      [{ ...minimalContact, dateOfBirth: undefined, deceasedDate: '2025-01-01' }, 'Not provided', '(Deceased)'],
    ])('should render date of birth column correctly', async (contact, expectedDob, expectedHint) => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [contact as PrisonerContactSummary],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const rows = $('#prisoner-contact-list tbody tr')
      const firstRowColumns = rows.eq(0).find('td')
      const dobAndRelatedHints = firstRowColumns.eq(1).html()!.split('<br>')
      expect(dobAndRelatedHints[0]!.trim()).toStrictEqual(expectedDob)
      if (expectedHint) expect(dobAndRelatedHints[1]).toContain(expectedHint)
    })

    it.each([
      [
        {
          ...minimalContact,
          relationshipType: 'S',
          relationshipTypeCode: 'Social',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          isRelationshipActive: true,
        },
        'Friend',
      ],
      [
        {
          ...minimalContact,
          relationshipType: 'O',
          relationshipTypeCode: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
          isRelationshipActive: true,
        },
        'Doctor',
      ],
      [
        {
          ...minimalContact,
          relationshipType: 'S',
          relationshipTypeCode: 'Social',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          isRelationshipActive: false,
        },
        'Inactive relationship: Friend',
      ],
      [
        {
          ...minimalContact,
          relationshipType: 'O',
          relationshipTypeCode: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
          isRelationshipActive: false,
        },
        'Inactive relationship: Doctor',
      ],
    ])('should render relationship to prisoner column correctly', async (contact, expectedRelationshipToPrisoner) => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [contact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const rows = $('#prisoner-contact-list tbody tr')
      const firstRowColumns = rows.eq(0).find('td')
      expect(firstRowColumns.eq(2).text().trim()).toStrictEqual(expectedRelationshipToPrisoner)
    })

    it.each([
      [minimalContact, 'Not provided'],
      [
        {
          ...minimalContact,
          flat: 'Flat 24',
          property: 'Some House',
          street: 'Acacia Avenue',
          area: 'Bunting',
          cityDescription: 'SHEF',
          countyDescription: 'SYORKS',
          postcode: 'S2 3LK',
          countryDescription: 'UK',
        },
        'Flat 24\nSome House\nAcacia Avenue\nBunting\nSHEF\nSYORKS\nS2 3LK\nUK',
      ],
    ])('should render address column correctly', async (contact, expectedAddress) => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [contact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const rows = $('#prisoner-contact-list tbody tr')
      const firstRowColumns = rows.eq(0).find('td')
      expect(firstRowColumns.eq(3).text().trim()).toStrictEqual(expectedAddress)
    })

    it.each([
      [{ ...minimalContact, isApprovedVisitor: true }, 'Approved'],
      [{ ...minimalContact, isApprovedVisitor: false }, 'Not approved or has not been checked'],
    ])('should render approved visitor column correctly', async (contact, expectedAddress) => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [contact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const rows = $('#prisoner-contact-list tbody tr')
      const firstRowColumns = rows.eq(0).find('td')
      expect(firstRowColumns.eq(4).text().trim()).toStrictEqual(expectedAddress)
    })

    it.each([
      [{ totalActive: 0, totalExpired: 0, active: [] }, ['No restrictions']],
      [
        {
          totalActive: 0,
          totalExpired: 1,
          active: [],
        },
        ['No active restrictions', '(Contact has 1 expired restriction)'],
      ],
      [
        {
          totalActive: 0,
          totalExpired: 5,
          active: [],
        },
        ['No active restrictions', '(Contact has 5 expired restrictions)'],
      ],
      [
        {
          totalActive: 2,
          totalExpired: 0,
          active: [
            { restrictionType: 'BAN', restrictionTypeDescription: 'Banned' },
            {
              restrictionType: 'CCTV',
              restrictionTypeDescription: 'CCTV',
            },
          ],
        },
        ['Banned', 'CCTV'],
      ],
      [
        {
          totalActive: 1,
          totalExpired: 5,
          active: [{ restrictionType: 'BAN', restrictionTypeDescription: 'Banned' }],
        },
        ['Banned', '(Contact also has 5 expired restrictions)'],
      ],
    ])('should render restrictions column correctly', async (restrictionSummary, expectedRows) => {
      // Given
      const contact = { ...minimalContact, restrictionSummary }
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [contact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const rows = $('#prisoner-contact-list tbody tr')
      const firstRowColumns = rows.eq(0).find('td')
      const cellContents = elementToTextLines(firstRowColumns.eq(5), $)
      expect(cellContents).toStrictEqual(expectedRows)
    })

    it.each([
      [`/prisoner/${prisonerNumber}/contacts/list`, { active: true }, { page: 0, size: 10, sort: expectDefaultSort }],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&sort=name,asc&page=2`,
        { active: true },
        {
          page: 1,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&sort=name,desc&page=1`,
        { active: true },
        {
          page: 0,
          size: 10,
          sort: ['lastName,desc', 'firstName,desc', 'middleNames,desc', 'middleNames,desc', 'contactId,desc'],
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&sort=dob,asc&page=1`,
        { active: true },
        {
          page: 0,
          size: 10,
          sort: [
            'dateOfBirth,desc',
            'lastName,asc',
            'firstName,asc',
            'middleNames,asc',
            'middleNames,asc',
            'contactId,asc',
          ],
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&sort=dob,desc&page=1`,
        { active: true },
        {
          page: 0,
          size: 10,
          sort: [
            'dateOfBirth,asc',
            'lastName,desc',
            'firstName,desc',
            'middleNames,desc',
            'middleNames,desc',
            'contactId,desc',
          ],
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE`,
        {},
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&relationshipType=S`,
        { relationshipType: 'S' },
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&relationshipType=O`,
        { relationshipType: 'O' },
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&relationshipType=O&relationshipType=S`,
        {},
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&flag=EC`,
        { emergencyContact: true },
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&flag=NOK`,
        { nextOfKin: true },
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&flag=EC&flag=NOK`,
        { emergencyContactOrNextOfKin: true },
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
      [
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&flag=EC&flag=NOK&relationshipType=S`,
        {
          active: true,
          relationshipType: 'S',
          emergencyContactOrNextOfKin: true,
        },
        {
          page: 0,
          size: 10,
          sort: expectDefaultSort,
        },
      ],
    ])('should search using correct query parameters and defaults', async (url, expectedFilter, expectedPagination) => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [minimalContact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: expectedPagination.page },
      })

      // When
      const response = await request(app).get(url)

      // Then
      expect(response.status).toEqual(200)
      expect(contactsService.filterPrisonerContacts).toHaveBeenCalledWith(
        prisonerNumber,
        expectedFilter,
        expectedPagination,
        user,
      )
    })

    it('should tick correct options based on default URL params', async () => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [minimalContact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual('ACTIVE_ONLY')
      expect($('#relationshipTypeSocial').attr('checked')).toBeUndefined()
      expect($('#relationshipTypeOfficial').attr('checked')).toBeUndefined()
      expect($('#flagsEmergencyContact').attr('checked')).toBeUndefined()
      expect($('#flagsNextOfKin').attr('checked')).toBeUndefined()
    })

    it('should tick correct options based on non-default URL params', async () => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [minimalContact],
        page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&relationshipType=S&relationshipType=O&flag=EC&flag=NOK`,
      )

      // Then
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual('ACTIVE_AND_INACTIVE')
      expect($('#relationshipTypeSocial').attr('checked')).toStrictEqual('checked')
      expect($('#relationshipTypeOfficial').attr('checked')).toStrictEqual('checked')
      expect($('#flagsEmergencyContact').attr('checked')).toStrictEqual('checked')
      expect($('#flagsNextOfKin').attr('checked')).toStrictEqual('checked')
    })

    it('should show no contacts at all with link to add a contact if no active results and no unfiltered contacts', async () => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [],
        page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const noResultsContent = elementToTextLines($('[data-qa=no-results-content]').first(), $)
      expect(noResultsContent).toStrictEqual([
        'John Smith does not have any linked contacts.',
        'Link a contact to this prisoner',
      ])
      expect($('[data-qa=no-results-link-a-contact]').attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/create/start`,
      )
      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        1,
        prisonerNumber,
        { active: true },
        { page: 0, size: 10, sort: expectDefaultSort },
        user,
      )
      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        2,
        prisonerNumber,
        {},
        { page: 0, size: 1 },
        user,
      )
    })

    it('should show no contacts at all with link to add a contact if no active results and no unfiltered contacts even if filters applied', async () => {
      // Given
      contactsService.filterPrisonerContacts.mockResolvedValue({
        content: [],
        page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&relationshipType=S`,
      )

      // Then
      const $ = cheerio.load(response.text)
      const noResultsContent = elementToTextLines($('[data-qa=no-results-content]').first(), $)
      expect(noResultsContent).toStrictEqual([
        'John Smith does not have any linked contacts.',
        'Link a contact to this prisoner',
      ])
      expect($('[data-qa=no-results-link-a-contact]').attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/create/start`,
      )

      const linkContactButton = $('[data-qa=add-contact-button]').first()
      expect(linkContactButton.text().trim()).toStrictEqual('Link contact')
      expect(linkContactButton.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/create/start')

      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        1,
        prisonerNumber,
        { active: true, relationshipType: 'S' },
        { page: 0, size: 10, sort: expectDefaultSort },
        user,
      )
      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        2,
        prisonerNumber,
        {},
        { page: 0, size: 1 },
        user,
      )
    })

    it('should show no active contacts link to change to include inactive if not filters applied and no contacts', async () => {
      // Given
      contactsService.filterPrisonerContacts
        .mockResolvedValueOnce({
          content: [],
          page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
        })
        .mockResolvedValueOnce({
          content: [{ ...minimalContact, isRelationshipActive: false }],
          page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
        })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list`)

      // Then
      const $ = cheerio.load(response.text)
      const noResultsContent = elementToTextLines($('[data-qa=no-results-content]').first(), $)
      expect(noResultsContent).toStrictEqual([
        'John Smith does not have any contacts with active relationship status.',
        'View contacts with inactive relationship status',
      ])
      expect($('[data-qa=no-results-include-inactive]').attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE`,
      )

      const linkContactButton = $('[data-qa=add-contact-button]').first()
      expect(linkContactButton.text().trim()).toStrictEqual('Link another contact')
      expect(linkContactButton.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/create/start')

      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        1,
        prisonerNumber,
        { active: true },
        { page: 0, size: 10, sort: expectDefaultSort },
        user,
      )
      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        2,
        prisonerNumber,
        {},
        { page: 0, size: 1 },
        user,
      )
    })

    it('should show no contacts match filter when there are filters and prisoner has any contacts', async () => {
      // Given
      contactsService.filterPrisonerContacts
        .mockResolvedValueOnce({
          content: [],
          page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
        })
        .mockResolvedValueOnce({
          content: [{ ...minimalContact, isRelationshipActive: false }],
          page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
        })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/list?flag=EC`)

      // Then
      const $ = cheerio.load(response.text)
      const noResultsContent = $('[data-qa=no-results-content]').text()
      expect(noResultsContent).toContain('No contact records match your filter')
      expect(noResultsContent).toContain('You can:')
      expect(noResultsContent).toContain('change the filters and apply them again')
      expect(noResultsContent).toContain('clear the filters to view contacts with active relationship status')
      expect(noResultsContent).toContain(
        'link another contact if you cannot find the correct person in the prisoner’s contact list',
      )

      expect($('[data-qa=no-results-clear-filters]').attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/list`,
      )
      expect($('[data-qa=no-results-link-a-contact]').attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/create/start`,
      )

      const linkContactButton = $('[data-qa=add-contact-button]').first()
      expect(linkContactButton.text().trim()).toStrictEqual('Link another contact')
      expect(linkContactButton.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/create/start')

      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        1,
        prisonerNumber,
        { active: true, emergencyContact: true },
        { page: 0, size: 10, sort: expectDefaultSort },
        user,
      )
      expect(contactsService.filterPrisonerContacts).toHaveBeenNthCalledWith(
        2,
        prisonerNumber,
        {},
        { page: 0, size: 1 },
        user,
      )
    })
  })

  describe('POST /prisoner/:prisonerNumber/contacts/list', () => {
    it('should redirect minimal form params as URL params', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/list`)
        .type('form')
        .send({ relationshipStatus: 'ACTIVE_ONLY' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY`)
    })

    it('should redirect singular form params as URL params resetting pagination and sort', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/list?page=99&sort=dob,asc`)
        .type('form')
        .send({ relationshipStatus: 'ACTIVE_AND_INACTIVE', relationshipType: 'S', flag: 'EC' })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_AND_INACTIVE&relationshipType=S&flag=EC`,
        )
    })

    it('should redirect array form params as URL params resetting pagination and sort', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/list?page=99&sort=dob,asc`)
        .type('form')
        .send({ relationshipStatus: 'ACTIVE_ONLY', relationshipType: ['S', 'O'], flag: ['EC', 'NOK'] })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/list?relationshipStatus=ACTIVE_ONLY&relationshipType=S&relationshipType=O&flag=EC&flag=NOK`,
        )
    })
  })
})
