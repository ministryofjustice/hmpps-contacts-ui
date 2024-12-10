import Page from '../pages/page'
import PageNotFoundPage from '../pages/pageNotFoundPage'
import SorryPage from '../pages/sorryPage'

context('Ensure Prisoner Is In Caseload', () => {
  const prisonerNumber = 'A1234BC'
  const contactId = 99
  const prisonerContactId = 299
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.signIn()
  })

  it('Should show not found page if root cause is 404', () => {
    cy.task('stubPrisonerByIdReturnsError', { prisonerNumber, httpStatusCode: 404 })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`, { failOnStatusCode: false })

    Page.verifyOnPage(PageNotFoundPage)
  })

  it('Should show not found page if root cause is 400', () => {
    cy.task('stubPrisonerByIdReturnsError', { prisonerNumber, httpStatusCode: 400 })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/99`, { failOnStatusCode: false })

    Page.verifyOnPage(SorryPage)
  })

  it('Should show not found page if root cause is 500', () => {
    cy.task('stubPrisonerByIdReturnsError', { prisonerNumber, httpStatusCode: 500 })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/99`, { failOnStatusCode: false })

    Page.verifyOnPage(SorryPage)
  })
})
