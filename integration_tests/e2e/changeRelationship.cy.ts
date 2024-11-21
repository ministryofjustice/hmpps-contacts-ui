import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPrisonerContactRelationshipDetails } from '../mockApis/contactsApi'
import SelectRelationshipPage from '../pages/selectRelationshipPage'

context('Change Relationship', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    title: 'MR',
    dateOfBirth: null,
    estimatedIsOverEighteen: 'YES',
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubRelationshipReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)

    cy.signIn()
  })

  it('Can select a new relationship', () => {
    const relationship = TestData.prisonerContactRelationship({
      relationshipCode: 'OTHER',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: relationship,
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const updated: StubPrisonerContactRelationshipDetails = {
      ...relationship,
      relationshipCode: 'MOT',
    }

    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
      response: updated,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last') //
      .hasRelationshipSelected('OTHER')
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      {
        relationshipCode: 'MOT',
        updatedBy: 'USER1',
      },
    )
  })

  it('Relationship must be selected', () => {
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        relationshipCode: 'OTHER',
      }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last') //
      .hasRelationshipSelected('OTHER')
      .selectRelationship('')
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last')
    enterNamePage.hasFieldInError('relationship', "Enter the contact's relationship to the prisoner")
  })

  it('Back link goes back to manage contact', () => {
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes back to manage contact', () => {
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
