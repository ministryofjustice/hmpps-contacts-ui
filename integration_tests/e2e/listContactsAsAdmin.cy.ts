import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import ListContactsPage from '../pages/listContacts'
import { PagedModelPrisonerContactSummary, PrisonerContactSummary } from '../../server/@types/contactsApiClient'
import SearchContactPage from '../pages/searchContactPage'

context('List contacts with Contacts Administrator or Authoriser roles', () => {
  const prisoner = TestData.prisoner({ lastName: 'Prisoner', firstName: 'Test', prisonId: 'KMI' })

  const minimalContact: PrisonerContactSummary = {
    prisonerContactId: 987654321,
    contactId: 123456789,
    prisonerNumber: prisoner.prisonerNumber,
    lastName: 'Last',
    firstName: 'First',
    relationshipTypeCode: 'S',
    relationshipTypeDescription: 'Social',
    relationshipToPrisonerCode: 'FR',
    relationshipToPrisonerDescription: 'Father',
    isApprovedVisitor: false,
    isNextOfKin: false,
    isEmergencyContact: false,
    isRelationshipActive: true,
    currentTerm: true,
    isStaff: true,
    restrictionSummary: {
      active: [],
      totalActive: 0,
      totalExpired: 0,
    },
  }
  const contactOne = aContact(1, 'One', 'Contact')
  const contactTwo = aContact(2, 'Two', 'Contact')
  const contactThree = aContact(3, 'Three', 'Contact')
  const contactFour = aContact(4, 'Four', 'Contact')
  const contactFive = aContact(5, 'Five', 'Contact')
  const contactSix = aContact(6, 'Six', 'Contact')
  const contactSeven = aContact(7, 'Seven', 'Contact')
  const contactEight = aContact(8, 'Eight', 'Contact')
  const contactNine = aContact(9, 'Nine', 'Contact')
  const contactTen = aContact(10, 'Ten', 'Contact')
  const contactEleven = aContact(11, 'Eleven', 'Contact')
  const contactTwelve = aContact(12, 'Twelve', 'Contact')
  const contactInactive = aContact(13, 'Inactive', 'Contact')

  function aContact(id: number, lastName: string, firstName: string): PrisonerContactSummary {
    return { ...minimalContact, contactId: id, prisonerContactId: id + 100000, lastName, firstName }
  }

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubPrisonerById', prisoner)
  })

  it('should maintain filters when paging but applying a sort returns you to page one', () => {
    const initialPage: PagedModelPrisonerContactSummary = {
      content: [
        contactInactive,
        contactOne,
        contactTwo,
        contactThree,
        contactFour,
        contactFive,
        contactSix,
        contactSeven,
        contactEight,
        contactNine,
      ],
      page: { totalElements: 13, totalPages: 2, size: 10, number: 0 },
    }

    const pageOne: PagedModelPrisonerContactSummary = {
      content: [
        contactOne,
        contactTwo,
        contactThree,
        contactFour,
        contactFive,
        contactSix,
        contactSeven,
        contactEight,
        contactNine,
        contactTen,
      ],
      page: { totalElements: 12, totalPages: 2, size: 10, number: 0 },
    }

    const pageTwo: PagedModelPrisonerContactSummary = {
      content: [contactEleven, contactTwelve],
      page: { totalElements: 12, totalPages: 2, size: 10, number: 1 },
    }

    const filtered = {
      relationshipType: { equalTo: 'S' },
      emergencyContactOrNextOfKin: { equalTo: 'true' },
      active: { equalTo: 'true' },
    }

    cy.task('stubFilteredContactList', {
      prisonerNumber: prisoner.prisonerNumber,
      page: initialPage,
      matchQueryParams: { active: { absent: true } },
    })

    cy.task('stubFilteredContactList', {
      prisonerNumber: prisoner.prisonerNumber,
      page: pageOne,
      matchQueryParams: filtered,
    })

    cy.task('stubFilteredContactList', {
      prisonerNumber: prisoner.prisonerNumber,
      page: pageTwo,
      matchQueryParams: filtered,
    })

    cy.signIn({ startUrl: `/prisoner/${prisoner.prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'Test Prisoner')
      .expectNames([
        'Inactive, Contact',
        'One, Contact',
        'Two, Contact',
        'Three, Contact',
        'Four, Contact',
        'Five, Contact',
        'Six, Contact',
        'Seven, Contact',
        'Eight, Contact',
        'Nine, Contact',
      ])
      .clickSocialContacts()
      .clickNextOfKin()
      .clickEmergencyContact()
      .clickActiveOnly()
      .clickButtonTo('Apply filters', ListContactsPage, 'Test Prisoner')
      .expectNames([
        'One, Contact',
        'Two, Contact',
        'Three, Contact',
        'Four, Contact',
        'Five, Contact',
        'Six, Contact',
        'Seven, Contact',
        'Eight, Contact',
        'Nine, Contact',
        'Ten, Contact',
      ])
      .hasSocialContacts()
      .hasNextOfKin()
      .hasEmergencyContact()
      .hasActiveOnly()
      .clickIndexedLinkTo(0, 'Page 2 of 2', ListContactsPage, 'Test Prisoner')
      .expectNames(['Eleven, Contact', 'Twelve, Contact'])
      .clickLinkTo('Contact name and person ID', ListContactsPage, 'Test Prisoner')
      .hasSocialContacts()
      .hasNextOfKin()
      .hasEmergencyContact()
      .hasActiveOnly()
      .expectNames([
        'One, Contact',
        'Two, Contact',
        'Three, Contact',
        'Four, Contact',
        'Five, Contact',
        'Six, Contact',
        'Seven, Contact',
        'Eight, Contact',
        'Nine, Contact',
        'Ten, Contact',
      ])
  })

  it('should be able to link to create a new contact when there are no contacts at all', () => {
    const initialPage: PagedModelPrisonerContactSummary = {
      content: [],
      page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
    }

    cy.task('stubFilteredContactList', {
      prisonerNumber: prisoner.prisonerNumber,
      page: initialPage,
    })

    cy.signIn({ startUrl: `/prisoner/${prisoner.prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'Test Prisoner')
      .clickButtonTo('Link contact', SearchContactPage)
      .clickLinkTo('Back to prisoner’s contact list', ListContactsPage, 'Test Prisoner')
      .clickLinkTo('Link a contact to this prisoner', SearchContactPage)
  })

  it("should allow to see prisoner contacts list if the prisoner is in the user's inactive caseload", () => {
    const prisonerInInactiveCaseLoad = TestData.prisoner({
      lastName: 'Prisoner',
      firstName: 'Inactive Caseload',
      prisonId: 'KMI',
    })
    const initialPage: PagedModelPrisonerContactSummary = {
      content: [
        contactInactive,
        contactOne,
        contactTwo,
        contactThree,
        contactFour,
        contactFive,
        contactSix,
        contactSeven,
        contactEight,
        contactNine,
      ],
      page: { totalElements: 13, totalPages: 2, size: 10, number: 0 },
    }

    cy.task('stubPrisonerById', prisonerInInactiveCaseLoad)
    cy.task('stubFilteredContactList', {
      prisonerNumber: prisonerInInactiveCaseLoad.prisonerNumber,
      page: initialPage,
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerInInactiveCaseLoad.prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'Inactive Caseload Prisoner')
  })
})
