import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPatchContactResponse } from '../mockApis/contactsApi'
import EnterNamePage from '../pages/enterNamePage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Change Contact Name', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.signIn()
  })

  it('Can edit a contact with new title and middle names', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: null,
      title: null,
      titleDescription: null,
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const updated: StubPatchContactResponse = {
      ...contact,
      title: 'DR',
      middleNames: 'Middle Updated',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Last') //
      .verifyShowTitleAs('Not provided')
      .verifyShowNameAs('First Last')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'First Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('')
      .hasTitle('')
      .enterMiddleNames('Middle Updated')
      .selectTitle('DR')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        title: 'DR',
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
      title: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const updated: StubPatchContactResponse = {
      ...contact,
      title: 'DR',
      middleNames: 'Middle Updated',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'First Middle Names Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .clearMiddleNames()
      .selectTitle('')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        title: null,
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
      title: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const updated: StubPatchContactResponse = {
      ...contact,
      title: 'DR',
      middleNames: 'Middle Updated',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeTitleLink()

    Page.verifyOnPage(EnterNamePage, 'First Middle Names Last') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .clearMiddleNames()
      .selectTitle('')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        title: null,
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
      title: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowTitleAs('Mr')
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'First Middle Names Last') //
      .enterMiddleNames(''.padEnd(36, 'X'))
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(EnterNamePage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('middleNames', 'Contact’s middle names must be 35 characters or less')
  })

  it('Back link goes back to manage contact', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      title: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes back to manage contact', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      title: 'MR',
      titleDescription: 'Mr',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowNameAs('First Middle Names Last')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'First Middle Names Last') //
      .cancelTo(EditContactDetailsPage, 'First Middle Names Last')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
