import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPatchContactResponse } from '../mockApis/contactsApi'
import EnterNamePage from '../pages/enterNamePage'

context('Change Contact Name', () => {
  const contactId = 654321
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.signIn()
  })

  it('Can edit a contact with new title and middle names', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      title: 'MR',
      dateOfBirth: null,
      estimatedIsOverEighteen: 'YES',
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    const updated: StubPatchContactResponse = {
      ...contact,
      title: 'DR',
      middleNames: 'Middle Updated',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'Last, First Middle Names') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .enterMiddleNames('Middle Updated')
      .selectTitle('DR')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

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
      dateOfBirth: null,
      estimatedIsOverEighteen: 'YES',
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    const updated: StubPatchContactResponse = {
      ...contact,
      title: 'DR',
      middleNames: 'Middle Updated',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'Last, First Middle Names') //
      .hasLastName('Last')
      .hasFirstName('First')
      .hasMiddleNames('Middle Names')
      .hasTitle('MR')
      .clearMiddleNames()
      .selectTitle('')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

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
      dateOfBirth: null,
      estimatedIsOverEighteen: 'YES',
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage, 'Last, First Middle Names') //
      .enterMiddleNames(''.padEnd(36, 'X'))
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(EnterNamePage, 'Last, First Middle Names')
    enterNamePage.hasFieldInError('middleNames', "Contact's middle names must be 35 characters or less")
  })
})
