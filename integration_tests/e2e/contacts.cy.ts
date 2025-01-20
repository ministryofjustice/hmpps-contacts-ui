import Page from '../pages/page'
import IndexPage from '../pages'

context('Contacts', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
  })

  it('Contacts cards visible', () => {
    cy.signIn()
    const contactsPage = Page.verifyOnPage(IndexPage)
    contactsPage.manageContactsCard().should('contain.text', 'Manage contacts')
    contactsPage.manageContactsCard().should('contain.text', 'Manage the social contacts for a prisoner')
    contactsPage.manageContactRestrictionsCard().should('contain.text', 'Manage contact restrictions')
    contactsPage.manageContactRestrictionsCard().should('contain.text', 'Manage restrictions for prisoner contacts')
  })

  it('User can manage their restriction contacts', () => {
    cy.signIn()
    const contactsPage = Page.verifyOnPage(IndexPage)
    contactsPage.manageContactRestrictionsCard().click()

    cy.get('a.card__link')
      .invoke('attr', 'href')
      .then(href => {
        cy.visit(href)
      })
  })
})
