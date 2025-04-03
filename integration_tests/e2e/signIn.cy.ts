import ListContactsPage from '../pages/listContacts'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/authManageDetails'
import AuthorisationErrorPage from '../pages/authorisationError'
import IndexPage from '../pages'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  xit('User name visible in header', () => {
    cy.signIn()
    const contactsPage = Page.verifyOnPage(IndexPage)
    contactsPage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('User can sign out', () => {
    cy.signIn()
    const contactsPage = Page.verifyOnPage(IndexPage)
    contactsPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  xit('User can manage their details', () => {
    cy.signIn()
    cy.task('stubAuthManageDetails')
    const contactsPage = Page.verifyOnPage(ListContactsPage, 'John Smith')

    contactsPage.manageDetails().get('a').invoke('removeAttr', 'target')
    contactsPage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(IndexPage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  xit('Token verification failure clears user session', () => {
    cy.signIn()
    const contactsPage = Page.verifyOnPage(IndexPage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubSignIn', { name: 'bobby brown', roles: ['PRISON'] })

    cy.signIn()

    contactsPage.headerUserName().contains('B. Brown')
  })

  it('User without required role is directed to Authorisation Error page', () => {
    cy.task('stubSignIn', 'SOME_OTHER_ROLE')
    cy.signIn({ failOnStatusCode: false })
    const authorisationErrorPage = Page.verifyOnPage(AuthorisationErrorPage)
    authorisationErrorPage.message().contains('You are not authorised to use this application')
  })
})
