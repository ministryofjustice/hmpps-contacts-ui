import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import EditEmailPage from '../pages/editEmailPage'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import { UpdateEmailRequest } from '../../server/@types/contactsApiClient'

context('Edit Email Address', () => {
  const contactId = 22
  const prisonerContactId = 987654
  const contact = TestData.contact({
    emailAddresses: [
      TestData.getContactEmailDetails('first@example.com', 123),
      TestData.getContactEmailDetails('last@example.com', 777),
    ],
  })
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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

    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it('Can edit a contact email', () => {
    const updated: UpdateEmailRequest = {
      emailAddress: 'mr.last@example.com',
    }
    cy.task('stubUpdateContactEmail', { contactId, contactEmailId: 777, updated })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EditEmailPage, 'Jones Mason')
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
      },
    )
  })

  it('Should not prevent setting to the same email address being edited', () => {
    const updated: UpdateEmailRequest = {
      emailAddress: 'mr.last@example.com',
    }
    cy.task('stubUpdateContactEmail', { contactId, contactEmailId: 777, updated })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EditEmailPage, 'Jones Mason').hasEmail('last@example.com').clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').hasSuccessBanner(
      'You’ve updated the contact methods for Jones Mason.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/email/777`,
      },
      {
        emailAddress: 'last@example.com',
      },
    )
  })

  it(`should give an error if changing to an existing email address to prevent duplicates`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    const enterEmailPage = Page.verifyOnPage(EditEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail('FIRST@example.com')
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError(
      'emailAddress',
      `Email address ‘FIRST@example.com’ has already been entered for this contact`,
    )
  })

  it(`should require email address`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    const enterEmailPage = Page.verifyOnPage(EditEmailPage, 'Jones Mason')
    enterEmailPage.clearEmail()
    enterEmailPage.clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `Enter an email address`)
  })

  it(`should require email address in the correct format`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

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
      .clickEditEmailLink('last@example.com')

    const enterEmailPage = Page.verifyOnPage(EditEmailPage, 'Jones Mason')
    enterEmailPage.enterEmail(invalidEmail).clickContinue()
    enterEmailPage.hasFieldInError('emailAddress', `Email address must be 240 characters or less`)
  })

  it('Back link goes to manage contacts via edit contact methods', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EditEmailPage, 'Jones Mason') //
      .backTo(EditContactMethodsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'Jones Mason') //
      .clickEditEmailLink('last@example.com')

    Page.verifyOnPage(EditEmailPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
