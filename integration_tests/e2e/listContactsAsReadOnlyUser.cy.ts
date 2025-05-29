import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import ListContactsPage from '../pages/listContacts'
import { PagedModelPrisonerContactSummary, PrisonerContactSummary } from '../../server/@types/contactsApiClient'

context('List contacts with a read only set of roles', () => {
  const prisoner = TestData.prisoner({ lastName: 'Prisoner', firstName: 'Test' })

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

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPrisonerById', prisoner)
  })

  it('should be able to read the contact list', () => {
    const initialPage: PagedModelPrisonerContactSummary = {
      content: [minimalContact],
      page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
    }

    cy.task('stubFilteredContactList', {
      prisonerNumber: prisoner.prisonerNumber,
      page: initialPage,
      matchQueryParams: { active: { absent: true } },
    })

    cy.signIn({ startUrl: `/prisoner/${prisoner.prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'Test Prisoner') //
      .expectReadOnlyNames(['Last, First'])
  })
})
