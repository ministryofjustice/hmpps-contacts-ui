import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ConfirmDeletePhonePage from '../pages/confirmDeletePhonePage'

context('Delete Contact Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [
      TestData.getContactPhoneNumberDetails('MOB', 'Mobile phone', '07878 111111', 99, '123'),
      TestData.getContactPhoneNumberDetails('HOME', 'Home phone', '01111 777777', 77),
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
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can delete a contact phone', () => {
    cy.task('stubDeleteContactPhone', { contactId, contactPhoneId: 99 })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickDeletePhoneNumberLink(99)

    Page.verifyOnPage(ConfirmDeletePhonePage) //
      .hasPhoneNumber('07878 111111')
      .hasType('Mobile phone')
      .hasExtension('123')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/phone/99`,
      },
      1,
    )
  })

  it('Can cancel deleting a contact phone', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickDeletePhoneNumberLink(77)

    Page.verifyOnPage(ConfirmDeletePhonePage) //
      .hasPhoneNumber('01111 777777')
      .hasType('Home phone')
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
