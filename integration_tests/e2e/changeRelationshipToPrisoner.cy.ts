import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Change Relationship To Prisoner', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    titleCode: 'MR',
    dateOfBirth: null,
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.signIn()
  })

  it('Can select a new social relationship', () => {
    const relationship = TestData.prisonerContactRelationship({
      prisonerContactId,
      relationshipTypeCode: 'S',
      relationshipTypeDescription: 'Social',
      relationshipToPrisonerCode: 'OTHER',
      relationshipToPrisonerDescription: 'Other',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: relationship,
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowRelationshipToPrisonerAs('Other')
      .clickChangeRelationshipToPrisonerLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .hasRelationshipSelected('OTHER')
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      {
        relationshipToPrisonerCode: 'MOT',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can select a new official relationship', () => {
    const relationship = TestData.prisonerContactRelationship({
      prisonerContactId,
      relationshipTypeCode: 'O',
      relationshipTypeDescription: 'Official',
      relationshipToPrisonerCode: 'DR',
      relationshipToPrisonerDescription: 'Doctor',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: relationship,
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowRelationshipToPrisonerAs('Doctor')
      .clickChangeRelationshipToPrisonerLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .hasRelationshipSelected('DR')
      .selectRelationship('OFS')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      {
        relationshipToPrisonerCode: 'OFS',
        updatedBy: 'USER1',
      },
    )
  })

  it('Back link goes back to edit contact details', () => {
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipToPrisonerLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes back to manage contact', () => {
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipToPrisonerLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
