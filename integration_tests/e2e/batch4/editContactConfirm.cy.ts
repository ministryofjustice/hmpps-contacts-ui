import Page from '../../pages/page'
import TestData from '../../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../../pages/manageContactDetails'
import pagedPrisonerAlertsData from '../../../server/testutils/testPrisonerAlertsData'
import EditContactConfirmPage from '../../pages/editContactConfirmPage'
import EditContactDetailsPage from '../../pages/editContactDetailsPage'

context('Edit contact confirmation with multiple linked prisoners', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: null,
    titleCode: null,
    titleDescription: null,
    dateOfBirth: null,
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.task(
      'stubPrisonerAlertsById',
      pagedPrisonerAlertsData({
        prisonNumber: prisonerNumber,
      }),
    )
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [], totalElements: 5 })
    cy.task('stubGetContactHistory', { contactId, history: [] })

    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })
  })

  it('Editing a contact with the threshold number of linked prisoners requires confirmation', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactConfirmPage, 5, 'First Last') //
      .selectConfirmContactEdit('YES')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Last')
  })

  it('Selecting NO on the edit contact confirmation page cancels the edit', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactConfirmPage, 5, 'First Last') //
      .selectConfirmContactEdit('NO')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last')
  })
})
