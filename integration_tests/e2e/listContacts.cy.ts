import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import ListContactsPage from '../pages/listContacts'
import { StubPagedModelPrisonerContactSummary, StubPrisonerContactSummary } from '../mockApis/contactsApi'

context('List contacts ', () => {
  const prisoner = TestData.prisoner({ lastName: 'Prisoner', firstName: 'Test' })

  const minimalContact: StubPrisonerContactSummary = {
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

  function aContact(id: number, lastName: string, firstName: string): StubPrisonerContactSummary {
    return { ...minimalContact, contactId: id, prisonerContactId: id + 100000, lastName, firstName }
  }

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPrisonerById', prisoner)
  })

  it('should maintain filters when paging but applying a sort returns you to page one', () => {
    const initialPage: StubPagedModelPrisonerContactSummary = {
      content: [contactOne, contactTwo, contactThree, contactFour, contactFive],
      page: { totalElements: 5, totalPages: 1, size: 10, number: 0 },
    }

    const pageOne: StubPagedModelPrisonerContactSummary = {
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

    const pageTwo: StubPagedModelPrisonerContactSummary = {
      content: [contactEleven, contactTwelve],
      page: { totalElements: 12, totalPages: 2, size: 10, number: 1 },
    }

    const filtered = {
      relationshipType: { equalTo: 'S' },
      emergencyContactOrNextOfKin: { equalTo: 'true' },
    }

    cy.task('stubFilteredContactList', {
      prisonerNumber: prisoner.prisonerNumber,
      page: initialPage,
      matchQueryParams: { active: { equalTo: 'true' } },
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
      .expectNames(['One, Contact', 'Two, Contact', 'Three, Contact', 'Four, Contact', 'Five, Contact'])
      .clickSocialContacts()
      .clickNextOfKin()
      .clickEmergencyContact()
      .clickIncludeInactive()
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
      .hasIncludeInactive()
      .clickIndexedLinkTo(0, 'Page 2 of 2', ListContactsPage, 'Test Prisoner')
      .expectNames(['Eleven, Contact', 'Twelve, Contact'])
      .clickLinkTo('Contact name and person ID', ListContactsPage, 'Test Prisoner')
      .hasSocialContacts()
      .hasNextOfKin()
      .hasEmergencyContact()
      .hasIncludeInactive()
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
})
