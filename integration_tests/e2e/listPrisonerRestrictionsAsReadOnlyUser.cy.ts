import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import ListContactsPage from '../pages/listContacts'
import { PagedModelPrisonerContactSummary, PrisonerContactSummary } from '../../server/@types/contactsApiClient'
import pagedPrisonerAlertsData from '../../server/testutils/testPrisonerAlertsData'
import pagedPrisonerRestrictionDetails from '../../server/testutils/testPrisonerRestrictionsData'
import ViewAllRestrictionsAndAlertsPage from '../pages/viewAllRestrictionsAndAlertsPage'

context('List prisoner restrictions and alerts with a contact admin or higher roles', () => {
  const prisoner = TestData.prisoner({ prisonerNumber: 'A1234BC', lastName: 'Prisoner', firstName: 'Test' })
  const prisonerRestrictions = pagedPrisonerRestrictionDetails({
    content: [{ ...pagedPrisonerRestrictionDetails().content[0], prisonerNumber: 'A1234BC' }],
  })
  const prisonerAlerts = pagedPrisonerAlertsData({
    content: [{ ...pagedPrisonerAlertsData().content[0], prisonNumber: 'A1234BC' }],
  })

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
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubPrisonerRestrictionsById', prisonerRestrictions)
    cy.task('stubPrisonerAlertsById', prisonerAlerts)
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
      .expectNames(['Last, First'])
      .clickViewAllRestrictions()

    Page.verifyOnPage(ViewAllRestrictionsAndAlertsPage, 'Test Prisoner', 'Test Prisoner')
      .checkPrisonerContactRestrictionsCardTitle()
      .checkPrisonerAlertsCardTitle()
      .getPrisonerAlertFlagLabel()
  })
})
