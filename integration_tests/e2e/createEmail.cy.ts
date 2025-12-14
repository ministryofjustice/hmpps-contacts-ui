import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import AddEmailsPage from '../pages/addEmailsPage'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import { ContactEmailDetails } from '../../server/@types/contactsApiClient'

context('Create Email Addresses', () => {
  const contactId = 22
  const prisonerContactId = 987654
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
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
    cy.task('stubGetContactHistory', { contactId, history: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should pass validation and create email addresses`, () => {
    const created: ContactEmailDetails[] = [
      {
        contactId: 1,
        contactEmailId: 1,
        emailAddress: 'test@example.com',
        createdBy: 'john smith',
        createdTime: '2025-01-01',
      },
      {
        contactId: 1,
        contactEmailId: 2,
        emailAddress: 'test3@example.com',
        createdBy: 'john smith',
        createdTime: '2025-01-01',
      },
    ]
    cy.task('stubCreateContactEmails', { contactId, created })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    Page.verifyOnPage(AddEmailsPage, 'Jones Mason') //
      .enterEmail(0, 'test@example.com')
      .clickAddAnotherButton()
      .enterEmail(1, 'test2@example.com')
      .clickAddAnotherButton()
      .enterEmail(2, 'test3@example.com')
      .clickRemoveButton(1)
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').hasSuccessBanner(
      'You’ve updated the contact methods for Jones Mason.',
    )
    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/emails`,
      },
      {
        emailAddresses: [{ emailAddress: 'test@example.com' }, { emailAddress: 'test3@example.com' }],
      },
    )
  })

  it(`should require email address`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    const enterEmailPage = Page.verifyOnPage(AddEmailsPage, 'Jones Mason')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError('emails[0].emailAddress', `Enter an email address`)
  })

  it(`should require email address in the correct format`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    const enterEmailPage = Page.verifyOnPage(AddEmailsPage, 'Jones Mason')
    enterEmailPage.enterEmail(0, 'name@')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError(
      'emails[0].emailAddress',
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

    const enterEmailPage = Page.verifyOnPage(AddEmailsPage, 'Jones Mason')
    enterEmailPage.enterEmail(0, invalidEmail).clickContinue()
    enterEmailPage.hasFieldInError('emails[0].emailAddress', `Email address must be 240 characters or less`)
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    Page.verifyOnPage(AddEmailsPage, 'Jones Mason') //
      .backTo(EditContactMethodsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickAddEmailLink()

    Page.verifyOnPage(AddEmailsPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
