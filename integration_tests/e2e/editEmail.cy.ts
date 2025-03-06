import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import EnterEmailPage from '../pages/enterEmailPage'
import { UpdateEmailRequest } from '../mockApis/contactsApi'
import EditContactMethodsPage from '../pages/editContactMethodsPage'

context('Edit Email Address', () => {
  const contactId = 22
  const prisonerContactId = 987654
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task(
      'stubGetContactById',
      TestData.contact({
        emailAddresses: [
          TestData.getContactEmailDetails('first@example.com', 123),
          TestData.getContactEmailDetails('last@example.com', 777),
        ],
      }),
    )
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

  it('Can edit a contact email', () => {
    const updated: UpdateEmailRequest = {
      emailAddress: 'mr.last@example.com',
      updatedBy: 'john smith',
    }
    cy.task('stubUpdateContactEmail', { contactId, contactEmailId: 777, updated })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
      .hasEmail('last@example.com')
      .clearEmail()
      .enterEmail('mr.last@example.com')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').hasSuccessBanner(
      'You’ve updated the contact methods for Jones Mason.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/email/777`,
      },
      {
        emailAddress: 'mr.last@example.com',
        updatedBy: 'john smith',
      },
    )
  })

  it(`should require email address`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    const enterEmailPage = Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
    enterEmailPage.clearEmail()
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `Enter the contact’s email address`)
  })

  it(`should require email address in the correct format`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

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
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    const enterEmailPage = Page.verifyOnPage(EnterEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail(invalidEmail).clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `The contact’s email address should be 240 characters or fewer`)
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EnterEmailPage, 'Jones Mason') //
      .backTo(EditContactMethodsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
      .verifyOnContactsMethodsTab()
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EnterEmailPage, 'Jones Mason') //
      .cancelTo(EditContactMethodsPage, 'Jones Mason')
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
      .verifyOnContactsMethodsTab()
  })
})
