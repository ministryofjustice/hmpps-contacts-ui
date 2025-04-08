import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ConfirmDeleteIdentityPage from '../pages/contact-details/confirmDeleteIdentityPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Delete Contact Identity', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    identities: [
      TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', 'UK', 1, true),
      TestData.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2, true),
      TestData.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', null, 3, true),
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubIdentityTypeReferenceData')
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can delete a contact identity', () => {
    cy.task('stubDeleteContactIdentity', { contactId, contactIdentityId: 1 })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteIdentityLink('LAST-87736799M')

    Page.verifyOnPage(ConfirmDeleteIdentityPage, 'First Middle Names Last') //
      .hasIdentityNumber('LAST-87736799M')
      .hasType('Driving licence')
      .hasIssuingAuthority('UK')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the identity documentation for First Middle Names Last.')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/identity/1`,
      },
      1,
    )
  })

  it('Can back or cancel to correct page', () => {
    cy.task('stubDeleteContactIdentity', { contactId, contactIdentityId: 1 })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteIdentityLink('06/614465M')

    // Back to Edit Contact Details page
    Page.verifyOnPage(ConfirmDeleteIdentityPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteIdentityLink('06/614465M')

    // Cancel to Manage Contact Details page
    Page.verifyOnPage(ConfirmDeleteIdentityPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/identity/3`,
      },
      0,
    )
  })
})
