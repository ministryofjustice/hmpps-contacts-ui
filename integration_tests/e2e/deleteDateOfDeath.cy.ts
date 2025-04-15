import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import DeleteDateOfDeathPage from '../pages/contact-details/deleteDateOfDeathPage'

context('Delete date of death', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    deceasedDate: '2024-02-03',
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        isEmergencyContact: true,
      }),
    })
    cy.task('stubPatchContactById', { contactId, response: contact })
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can delete date of death from edit contact details', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteDateOfDeathLink()

    Page.verifyOnPage(DeleteDateOfDeathPage, 'First Middle Names Last') //
      .hasDateOfDeath('3 February 2024')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .hasSuccessBanner('You’ve updated the personal information for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      { deceasedDate: null, updatedBy: 'USER1' },
    )
  })

  it(`Back link goes to edit contact details`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteDateOfDeathLink()

    Page.verifyOnPage(DeleteDateOfDeathPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last (deceased)')
  })

  it(`Cancel goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteDateOfDeathLink()

    Page.verifyOnPage(DeleteDateOfDeathPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last (deceased)')
  })
})
