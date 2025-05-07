import ListContactsPage from '../pages/listContacts'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthorisationErrorPage from '../pages/authorisationError'
import TestData from '../../server/routes/testutils/testData'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task(
      'stubPrisonerById',
      TestData.prisoner({ prisonerNumber: 'A1234BC', lastName: 'Last', firstName: 'Prisoner' }),
    )
    cy.task('stubContactList', 'A1234BC')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn({ startUrl: '/prisoner/A1234BC/contacts/list' })
    const contactsPage = Page.verifyOnPage(ListContactsPage, 'Prisoner Last')
    contactsPage.headerUserName().should('contain.text', 'M. Whitfield')
  })

  it('User can sign out', () => {
    cy.signIn({ startUrl: '/prisoner/A1234BC/contacts/list' })
    const contactsPage = Page.verifyOnPage(ListContactsPage, 'Prisoner Last')
    contactsPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn({ startUrl: '/prisoner/A1234BC/contacts/list' })
    Page.verifyOnPage(ListContactsPage, 'Prisoner Last')
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/prisoner/A1234BC/contacts/list').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.signIn({ startUrl: '/prisoner/A1234BC/contacts/list' })
    Page.verifyOnPage(ListContactsPage, 'Prisoner Last')
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/prisoner/A1234BC/contacts/list').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubSignIn', { name: 'bobby brown', roles: ['PRISON'] })

    cy.signIn({ startUrl: '/prisoner/A1234BC/contacts/list' })
  })

  it('User without required role is directed to Authorisation Error page', () => {
    cy.task('stubSignIn', 'SOME_OTHER_ROLE')
    cy.signIn({ startUrl: '/prisoner/A1234BC/contacts/list', failOnStatusCode: false })
    const authorisationErrorPage = Page.verifyOnPage(AuthorisationErrorPage)
    authorisationErrorPage.message().contains('You are not authorised to use this application')
  })
})
