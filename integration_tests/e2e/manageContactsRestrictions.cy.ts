import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EnterRestrictionPage from '../pages/enterRestrictionPage'
import EditRestrictionsPage from '../pages/editRestrictionsPage'

context('Manage contacts restrictions', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({ lastName: 'Davis', firstName: 'Daniel', middleNames: 'M.' })
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubGetGenders')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', 'A1234BC')
    cy.task('stubGetLinkedPrisoners', { contactId: contact.id, linkedPrisoners: [] })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', { id: 31, response: TestData.prisonerContactRelationship() })
  })
  it(`should render restrictions tab on manage contact details`, () => {
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails({ contactId: contact.id })],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })
    cy.task('stubLanguagesReferenceData')

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })
    Page.verifyOnPage(ListContactsPage, 'John Smith').clickContactNamesLink('Davis, Daniel M.')

    Page.verifyOnPage(ManageContactDetailsPage, 'Daniel M. Davis')
      .clickRestrictionsTab('2')
      .checkPrisonerContactRestrictionsCardTitle()
      .checkGlobalRestrictionsCardTitle()
  })

  it(`should add prisoner contact restrictions will take to add a new prisoner contact restriction page `, () => {
    cy.task('stubRestrictionTypeReferenceData')

    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails({ contactId: contact.id })],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith').clickContactNamesLink('Davis, Daniel M.')

    Page.verifyOnPage(ManageContactDetailsPage, 'Daniel M. Davis') //
      .clickRestrictionsTab('2')
      .clickLinkTo('Add or update restrictions', EditRestrictionsPage, 'Daniel M. Davis')
      .clickButton('Add another relationship restriction')

    Page.verifyOnPage(EnterRestrictionPage, 'Add a new relationship restriction')
  })

  it(`should add global restrictions will take to add a new global restriction page `, () => {
    cy.task('stubRestrictionTypeReferenceData')
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails({ contactId: contact.id })],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith').clickContactNamesLink('Davis, Daniel M.')

    Page.verifyOnPage(ManageContactDetailsPage, 'Daniel M. Davis') //
      .clickRestrictionsTab('2')
      .clickLinkTo('Add or update restrictions', EditRestrictionsPage, 'Daniel M. Davis')
      .clickButton('Add another global restriction')

    Page.verifyOnPage(EnterRestrictionPage, 'Add a new global restriction for Daniel M. Davis')
  })
})
