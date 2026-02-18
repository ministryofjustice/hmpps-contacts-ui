import Page from '../../pages/page'
import TestData from '../../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../../pages/manageContactDetails'
import ConfirmDeleteAddressPhonePage from '../../pages/contact-methods/address/phone/confirmDeleteAddressPhonePage'
import EditContactMethodsPage from '../../pages/editContactMethodsPage'

context('Delete Address Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contactAddressId = 555666
  const phoneWithExt = TestData.getAddressPhoneNumberDetails(
    'MOB',
    'Mobile',
    '07878 111111',
    99,
    contactAddressId,
    66,
    '123',
  )
  const phoneWithoutExt = TestData.getAddressPhoneNumberDetails(
    'HOME',
    'Home',
    '01111 777777',
    77,
    contactAddressId,
    11,
    '',
  )
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [phoneWithExt, phoneWithoutExt],
    addresses: [
      TestData.address({
        contactAddressId,
        phoneNumbers: [phoneWithExt, phoneWithoutExt],
      }),
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
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
    cy.task('stubGetContactHistory', { contactId, history: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()
  })

  it('Can delete a phone for an address', () => {
    cy.task('stubDeleteAddressPhone', {
      contactId,
      contactAddressId,
      contactAddressPhoneId: phoneWithExt.contactAddressPhoneId,
    })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickDeleteAddressPhoneLink(phoneWithExt.contactAddressPhoneId)

    Page.verifyOnPage(ConfirmDeleteAddressPhonePage) //
      .hasPhoneNumber('07878 111111')
      .hasType('Mobile')
      .hasExtension('123')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone/99`,
      },
      1,
    )
  })

  it('Can cancel deleting a phone for an address', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickDeleteAddressPhoneLink(phoneWithoutExt.contactAddressPhoneId)

    Page.verifyOnPage(ConfirmDeleteAddressPhonePage) //
      .hasPhoneNumber('01111 777777')
      .hasType('Home')
      .hasExtension('Not provided')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone/77`,
      },
      0,
    )
  })
})
