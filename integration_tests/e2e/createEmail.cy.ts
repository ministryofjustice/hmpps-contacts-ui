import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import EditEmailPage from '../pages/editEmailPage'
import { CreateEmailRequest } from '../mockApis/contactsApi'
import EditContactMethodsPage from '../pages/editContactMethodsPage'

context('Create Email Address', () => {
  const contactId = 22
  const prisonerContactId = 987654
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubGetContactNameById', TestData.contact())
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should pass validation and create email and address`, () => {
    const created: CreateEmailRequest = {
      emailAddress: 'mr.last@example.com',
      createdBy: 'john smith',
    }
    cy.task('stubCreateContactEmail', { contactId, created })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    Page.verifyOnPage(EditEmailPage, 'Jones Mason').enterEmail('test@email.com').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').hasSuccessBanner(
      'You’ve updated the contact methods for Jones Mason.',
    )
    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/email`,
      },
      {
        emailAddress: 'test@email.com',
        createdBy: 'john smith',
      },
    )
  })

  it(`should require email address`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    const enterEmailPage = Page.verifyOnPage(EditEmailPage, 'Jones Mason')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `Enter an email address`)
  })

  it(`should require email address in the correct format`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    const enterEmailPage = Page.verifyOnPage(EditEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail('name@')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError(
      'emailAddress',
      'Enter an email address in the correct format, like name@example.com',
    )
  })

  it(`should require email address with 240 characters or fewer`, () => {
    const invalidEmail = 'name@example'.padEnd(241, '0').concat('.com')
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    const enterEmailPage = Page.verifyOnPage(EditEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail(invalidEmail).clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `Email address must be 240 characters or less`)
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    Page.verifyOnPage(EditEmailPage, 'Jones Mason') //
      .backTo(EditContactMethodsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
      .verifyOnContactsMethodsTab()
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    Page.verifyOnPage(EditEmailPage, 'Jones Mason') //
      .cancelTo(EditContactMethodsPage, 'Jones Mason')
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
      .verifyOnContactsMethodsTab()
  })
})
