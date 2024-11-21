import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import EnterEmailPage from '../pages/enterEmailPage'
import { UpdateEmailRequest } from '../mockApis/contactsApi'

context('Edit Email Address', () => {
  const contactId = 22
  const contactEmailId = 1
  const prisonerContactId = 987654
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it('Can edit a contact email', () => {
    const updated: UpdateEmailRequest = {
      emailAddress: 'mr.last@example.com',
      updatedBy: 'john smith',
    }
    cy.task('stubUpdateContactEmail', { contactId, contactEmailId, updated })
    Page.verifyOnPage(ManageContactDetailsPage).clickEditEmailLink(contactEmailId)
    Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
      .hasEmail('mr.last@example.com')
      .clearEmail()
      .enterEmail('mr.last@example.com')
      .clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage).verifyEmailValueAs('mr.last@example.com', 1)

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/email/1`,
      },
      {
        emailAddress: 'mr.last@example.com',
        updatedBy: 'john smith',
      },
    )
  })

  it(`should require email address`, () => {
    Page.verifyOnPage(ManageContactDetailsPage).clickAddEmailLink()
    const enterEmailPage = Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `Enter the contact's email address`)
  })

  it(`should require email address in the correct format`, () => {
    Page.verifyOnPage(ManageContactDetailsPage).clickEditEmailLink(contactEmailId)
    const enterEmailPage = Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail('name@')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError(
      'emailAddress',
      'Enter an email address in the correct format, like name@example.com',
    )
  })

  it(`should require email address with 240 characters or fewer`, () => {
    const invalidEmail = 'name@example'.padEnd(241, '0').concat('.com')
    Page.verifyOnPage(ManageContactDetailsPage).clickEditEmailLink(contactEmailId)
    const enterEmailPage = Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail(invalidEmail).clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `The contact's email address should be 240 characters or fewer`)
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickAddEmailLink()

    Page.verifyOnPage(EnterEmailPage, 'Jones Mason') //
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickAddEmailLink()

    Page.verifyOnPage(EnterEmailPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
