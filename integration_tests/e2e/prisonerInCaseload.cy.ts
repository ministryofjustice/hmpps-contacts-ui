import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import PageNotFoundPage from '../pages/pageNotFoundPage'

context('Ensure Prisoner Is In Caseload', () => {
  const prisonerNumber = 'A1234BC'
  const contactId = 99
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
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
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
  })

  it('Manage contacts page not accessible if prisoner not in caseload', () => {
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(PageNotFoundPage)
  })

  it('Manage contacts page not accessible if prisoner not in caseload', () => {
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/99`)

    Page.verifyOnPage(PageNotFoundPage)
  })
})
