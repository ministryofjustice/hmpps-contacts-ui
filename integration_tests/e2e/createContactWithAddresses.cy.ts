import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'
import CreateContactAddressesPage from '../pages/createContactAddressesPage'
import SelectAddressTypePage from '../pages/contact-methods/address/selectAddressTypePage'
import EnterAddressPage from '../pages/contact-methods/address/enterAddressPage'
import EnterAddressDatesPage from '../pages/contact-methods/address/enterAddressDatesPage'
import AddAddressPhonesPage from '../pages/contact-methods/address/phone/addAddressPhonesPage'
import SelectAddressFlagsPage from '../pages/contact-methods/address/selectAddressFlagsPage'
import EnterAddressCommentsPage from '../pages/contact-methods/address/enterAddressCommentsPage'
import ConfirmDeleteAddressPhonePage from '../pages/contact-methods/address/phone/confirmDeleteAddressPhonePage'
import ConfirmDeleteContactAddressPage from '../pages/confirmDeleteContactAddressPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create Contact With Addresses', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubAddressTypeReferenceData')
    cy.task('stubCityReferenceData')
    cy.task('stubCountyReferenceData')
    cy.task('stubCountryReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubCreateContact', {
      createdContact: { id: contactId },
      createdRelationship: { prisonerContactId },
    })
    cy.task(
      'stubGetContactById',
      TestData.contact({
        id: contactId,
        lastName: 'Last',
        firstName: 'First',
      }),
    )
    cy.task('stubGetContactNameById', { id: contactId, lastName: 'Last', firstName: 'First' })
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
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickAddNewContactLink()
  })

  it('Can create a contact with some phone numbers', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    // Can submit without entering a phone number and also go back to additional info
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Addresses', CreateContactAddressesPage, 'First Last')
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Addresses', CreateContactAddressesPage, 'First Last')
      .clickLink('Back to additional information options')

    // Can enter some phone numbers
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Addresses', CreateContactAddressesPage, 'First Last')
      // enter first address
      .clickButtonTo('Add address', SelectAddressTypePage, 'First Last')
      .clickButtonTo('Continue', EnterAddressPage, 'First Last')
      .clickButtonTo('Continue', EnterAddressDatesPage, 'First Last')
      .clickButtonTo('Continue', SelectAddressFlagsPage, 'First Last')
      .clickButtonTo('Continue', AddAddressPhonesPage)
      .clickAddAnotherButton()
      .selectType(0, 'HOME')
      .enterPhoneNumber(0, '1234')
      .selectType(1, 'HOME')
      .enterPhoneNumber(1, '4321')
      .clickButtonTo('Continue', EnterAddressCommentsPage)
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      // enter second address
      .clickButtonTo('Add another address', SelectAddressTypePage, 'First Last')
      .clickButtonTo('Continue', EnterAddressPage, 'First Last')
      .clickButtonTo('Continue', EnterAddressDatesPage, 'First Last')
      .clickButtonTo('Continue', SelectAddressFlagsPage, 'First Last')
      .clickButtonTo('Continue', AddAddressPhonesPage)
      .clickButtonTo('Continue', EnterAddressCommentsPage)
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Edit and delete addresses and check we can go back
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Add, change or delete addresses', CreateContactAddressesPage, 'First Last')
      .clickChangeTypeLinkTo(0, SelectAddressTypePage, 'First Last')
      .selectAddressType('HOME')
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickChangeAddressLinkTo(0, EnterAddressPage, 'First Last')
      .enterStreet('Some Street')
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickChangeDatesLinkTo(0, EnterAddressDatesPage, 'First Last')
      .enterFromYear('1999')
      .enterFromMonth('12')
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickChangeFlagsLinkTo(0, SelectAddressFlagsPage, 'First Last')
      .selectIsPrimaryOrPostal('P')
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickChangeAddressPhoneLinkTo(0, AddAddressPhonesPage)
      .enterPhoneNumber(0, '123456')
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickChangeCommentsLinkTo(0, EnterAddressCommentsPage)
      .enterComments('test comments')
      .clickButtonTo('Continue', CreateContactAddressesPage, 'First Last')
      .clickDeleteAddressPhoneLinkTo(1, ConfirmDeleteAddressPhonePage)
      .clickButtonTo('Yes, delete phone number', CreateContactAddressesPage, 'First Last')
      .clickDeleteAddressLinkTo(1, ConfirmDeleteContactAddressPage)
      .clickButtonTo('Yes, delete', CreateContactAddressesPage, 'First Last')
      .clickButton('Continue')

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        isStaff: false,
        interpreterRequired: false,
        addresses: [
          {
            verified: false,
            addressType: 'HOME',
            noFixedAddress: false,
            street: 'Some Street',
            countryCode: 'ENG',
            startDate: '1999-12-01T00:00:00.000Z',
            primaryAddress: true,
            mailFlag: false,
            phoneNumbers: [{ phoneType: 'HOME', phoneNumber: '123456' }],
            comments: 'test comments',
          },
        ],
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
      },
    )
  })
})
