import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ChangeNamesPage from '../pages/changeNamesPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import { PatchContactResponse } from '../../server/@types/contactsApiClient'

context('Change Contact Names', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
  })

  it('Can edit a contact with new title, first, middle and last names', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: null,
      titleCode: null,
      titleDescription: null,
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    const updated: PatchContactResponse = {
      ...contact,
      titleCode: 'DR',
      firstName: 'First',
      middleNames: 'Middle Updated',
      lastName: 'Last',
    }
    cy.task('stubPatchContactById', { contactId, response: updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Last') //
      .verifyShowTitleAs('Not provided')
      .verifyShowNameAs('First Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Last') //
      .hasFirstName('First')
      .hasMiddleNames('')
      .hasLastName('Last')
      .hasTitle('')
      .enterFirstNames('First updated')
      .enterMiddleNames('Middle Updated')
      .enterLastNames('Last updated')
      .selectTitle('DR')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .hasSuccessBanner('You’ve updated the personal information for First Middle Updated Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      { titleCode: 'DR', firstName: 'First updated', middleNames: 'Middle Updated', lastName: 'Last updated' },
    )
  })

  it('Can edit a contact and remove title and middle names', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    const updated: PatchContactResponse = {
      ...contact,
      titleCode: 'DR',
      middleNames: null,
    }
    cy.task('stubPatchContactById', { contactId, response: updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .clearMiddleNames()
      .selectBlankTitle()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the personal information for First Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        titleCode: null,
        firstName: 'First',
        middleNames: null,
        lastName: 'Last',
      },
    )
  })

  it('Can go via change title link', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    const updated: PatchContactResponse = {
      ...contact,
      titleCode: 'DR',
      middleNames: null,
    }
    cy.task('stubPatchContactById', { contactId, response: updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeTitleLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .titleHasFocus()
      .clearMiddleNames()
      .selectTitle('DR')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the personal information for First Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        titleCode: 'DR',
        firstName: 'First',
        middleNames: null,
        lastName: 'Last',
      },
    )
  })

  it('Middle name length is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterMiddleNames(''.padEnd(36, 'X'))
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('middleNames', 'Contact’s middle names must be 35 characters or less')
  })

  it('First name length is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterFirstNames(''.padEnd(36, 'X'))
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('firstName', 'Contact’s first name must be 35 characters or less')
  })

  it('First name invalid characters input is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterFirstNames('First?')
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('firstName', 'Contact’s first name must not contain ?')
  })

  it('First name invalid number input is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterFirstNames('First1')
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('firstName', 'Contact’s first name must not contain 1')
  })

  it('Last name length is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterLastNames(''.padEnd(36, 'X'))
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('lastName', 'Contact’s last name must be 35 characters or less')
  })

  it('Last name invalid characters input is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterLastNames('Last?')
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('lastName', 'Contact’s last name must not contain ?')
  })

  it('Last name invalid number input is validated', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .enterLastNames('Last1')
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('lastName', 'Contact’s last name must not contain 1')
  })

  it('Back link goes back to manage contact', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes back to manage contact', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      titleCode: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeNamesPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
