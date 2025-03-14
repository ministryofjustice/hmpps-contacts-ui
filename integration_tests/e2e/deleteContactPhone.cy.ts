import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ConfirmDeletePhonePage from '../pages/confirmDeletePhonePage'
import EditContactMethodsPage from '../pages/editContactMethodsPage'

context('Delete Contact Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    addresses: [],
    phoneNumbers: [
      TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '07878 111111', 99, '123'),
      TestData.getContactPhoneNumberDetails('HOME', 'Home', '01111 777777', 77),
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
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
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can delete a contact phone', () => {
    cy.task('stubDeleteContactPhone', { contactId, contactPhoneId: 99 })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickDeletePhoneNumberLink('07878 111111, ext. 123')

    Page.verifyOnPage(ConfirmDeletePhonePage, 'First Middle Names Last') //
      .hasPhoneNumber('07878 111111')
      .hasType('Mobile')
      .hasExtension('123')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/phone/99`,
      },
      1,
    )
  })

  it('Can go back from deleting a contact phone', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickDeletePhoneNumberLink('01111 777777')

    Page.verifyOnPage(ConfirmDeletePhonePage, 'First Middle Names Last') //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
      .verifyOnContactsMethodsTab()

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/phone/77`,
      },
      0,
    )
  })

  it('Can cancel deleting a contact phone', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickDeletePhoneNumberLink('01111 777777')

    Page.verifyOnPage(ConfirmDeletePhonePage, 'First Middle Names Last') //
      .hasPhoneNumber('01111 777777')
      .hasType('Home')
      .hasExtension('Not provided')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/phone/77`,
      },
      0,
    )
  })
})
