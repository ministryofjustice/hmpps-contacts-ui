import Page from '../../pages/page'
import TestData from '../../../server/routes/testutils/testData'
import PageNotFoundPage from '../../pages/pageNotFoundPage'

context('Ensure Prisoner Is In Caseload', () => {
  const prisonerNumber = 'A1234BC'
  const contactId = 99
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })

    const prisoner = TestData.prisoner({
      prisonerNumber,
      prisonId: 'NOT HEI',
    })
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubContactList', 'A1234BC')
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: '1982-06-15',
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
  })

  it('Contacts page not accessible if prisoner not in caseload', () => {
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list`, failOnStatusCode: false })

    Page.verifyOnPage(PageNotFoundPage)
  })

  it('Manage contacts page not accessible if prisoner not in caseload', () => {
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/99`,
      failOnStatusCode: false,
    })

    Page.verifyOnPage(PageNotFoundPage)
  })
})
