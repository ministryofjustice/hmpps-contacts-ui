import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPrisonerContactRelationshipDetails } from '../mockApis/contactsApi'
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
    title: 'MR',
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
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })

    cy.signIn()
  })

  it('Can select a new social relationship', () => {
    const relationship = TestData.prisonerContactRelationship({
      prisonerContactId,
      relationshipType: 'S',
      relationshipTypeDescription: 'Social',
      relationshipToPrisonerCode: 'OTHER',
      relationshipToPrisonerDescription: 'Other',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: relationship,
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const updated: StubPrisonerContactRelationshipDetails = {
      ...relationship,
      relationshipToPrisonerCode: 'MOT',
    }

    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
      response: updated,
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
        relationshipToPrisoner: 'MOT',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can select a new official relationship', () => {
    const relationship = TestData.prisonerContactRelationship({
      prisonerContactId,
      relationshipType: 'O',
      relationshipTypeDescription: 'Official',
      relationshipToPrisonerCode: 'DR',
      relationshipToPrisonerDescription: 'Doctor',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: relationship,
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    const updated: StubPrisonerContactRelationshipDetails = {
      ...relationship,
      relationshipToPrisonerCode: 'OFS',
    }

    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
      response: updated,
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
        relationshipToPrisoner: 'OFS',
        updatedBy: 'USER1',
      },
    )
  })

  it('Relationship must be selected', () => {
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        relationshipToPrisonerCode: 'OTHER',
        relationshipToPrisonerDescription: 'Other',
      }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowRelationshipToPrisonerAs('Other')
      .clickChangeRelationshipToPrisonerLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .hasRelationshipSelected('OTHER')
      .selectRelationship('')
      .clickContinue()

    const enterNamePage = Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith')
    enterNamePage.hasFieldInError('relationship', 'Select the contact’s relationship to the prisoner')
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
