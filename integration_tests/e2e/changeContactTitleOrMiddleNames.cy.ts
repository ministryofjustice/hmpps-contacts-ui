import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ChangeTitleOrMiddleNamesPage from '../pages/changeTitleOrMiddleNamesPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import { PatchContactResponse } from '../../server/@types/contactsApiClient'

context('Change Contact Title Or Middle Names', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
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
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
  })

  it('Can edit a contact with new title and middle names', () => {
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
      middleNames: 'Middle Updated',
    }
    cy.task('stubPatchContactById', { contactId, response: updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Last') //
      .verifyShowTitleAs('Not provided')
      .verifyShowNameAs('First Last')
      .clickChangeNameLink()

    Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('')
      .hasTitle('')
      .middleNamesHasFocus()
      .enterMiddleNames('Middle Updated')
      .selectTitle('DR')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .hasSuccessBanner('You’ve updated the personal information for First Middle Updated Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        titleCode: 'DR',
        middleNames: 'Middle Updated',
        updatedBy: 'USER1',
      },
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

    Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Middle Names Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .middleNamesHasFocus()
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
        middleNames: null,
        updatedBy: 'USER1',
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

    Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Middle Names Last') //
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
        middleNames: null,
        updatedBy: 'USER1',
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

    Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Middle Names Last') //
      .enterMiddleNames(''.padEnd(36, 'X'))
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('middleNames', 'Contact’s middle names must be 35 characters or less')
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

    Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Middle Names Last') //
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

    Page.verifyOnPage(ChangeTitleOrMiddleNamesPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
