import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'

context('Manage contact update emergency contact', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        isEmergencyContact: true,
        isNextOfKin: true,
      }),
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can update emergency contact and next of kin status', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowEmergencyContactAs('Yes')
      .verifyShowNextOfKinAs('Yes')
      .clickChangeEmergencyContactLink()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Middle Names Last', 'John Smith') //
      .selectIsEmergencyContactOrNextOfKin('NONE')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner(
        'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
      )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      { isEmergencyContact: false, isNextOfKin: false, updatedBy: 'USER1' },
    )
  })

  it('goes to correct page on Back or Cancel', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeEmergencyContactLink() // change emergency contact link goes to Emergency Contact or Next of Kin page

    // Back to Edit Contact Details
    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Middle Names Last', 'John Smith') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .clickChangeNextOfKinLink() // change next of kin link goes to Emergency Contact or Next of Kin page

    // Cancel to Contact Details page
    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Middle Names Last', 'John Smith') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
