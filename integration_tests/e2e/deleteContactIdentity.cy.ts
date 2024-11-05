import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'

context('Delete Contact Identity', () => {
  const contactId = 654321
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    identities: [
      TestData.getContactIdentityDetails('DRIVING_LIC', 'Driving licence', 'LAST-87736799M', 'UK', 1),
      TestData.getContactIdentityDetails(
        'PASSPORT',
        'Passport number',
        '425362965',
        'Issuing authorithy - UK passport office',
        2,
      ),
      TestData.getContactIdentityDetails('NI_NUMBER', 'National insurance number', '06/614465M', 'UK', 3),
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

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can delete a contact identity', () => {
    cy.task('stubDeleteContactIdentity', { contactId, contactIdentityId: 1 })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteIdentityLink(1)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/identity/1`,
      },
      1,
    )
  })
})
