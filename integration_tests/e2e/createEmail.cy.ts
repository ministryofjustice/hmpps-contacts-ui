import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import EnterEmailPage from '../pages/enterEmailPage'
import { CreateEmailRequest } from '../mockApis/contactsApi'
// import { padEnd } from 'cypress/types/lodash'

context('Select Gender', () => {
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
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should pass validation and create email and address`, () => {
    const created: CreateEmailRequest = {
      emailAddress: 'test@example.com',
      createdBy: 'user1',
    }
    cy.task('stubCreateContactEmail', { contactId, created })
    Page.verifyOnPage(ManageContactDetailsPage).clickAddEmailLink()
    Page.verifyOnPage(EnterEmailPage, 'Jones Mason').enterEmail('test@email.com').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage)

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

  it(`should require email address in the correct format`, () => {
    Page.verifyOnPage(ManageContactDetailsPage).clickAddEmailLink()
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
    Page.verifyOnPage(ManageContactDetailsPage).clickAddEmailLink()
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
