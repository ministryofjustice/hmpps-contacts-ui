import SearchPrisonerPage from '../pages/searchPrisoner'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EnterRestrictionPage from '../pages/enterRestrictionPage'

context('Manage contacts restrictions', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact()
  const prisonerContactId = 987654
  const restrictionId = 555333
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
    cy.visit('/contacts/manage/prisoner-search/start')
    cy.task('stubGetGenders')
    cy.task('stubTitlesReferenceData')
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

    cy.task('stubGetContactById', contact)
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

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
      .clickRestrictionsTab('2')
      .checkPrisonerContactRestrictionsCardTitle()
      .checkGlobalRestrictionsCardTitle()
      .checkPrisonerContactRestrictionsDetails()
      .checkGlobalRestrictionsDetails()
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

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
      .clickRestrictionsTab('2')
      .clickAddPrisonerContactRestriction()

    Page.verifyOnPage(EnterRestrictionPage, 'Add a new prisoner-contact restriction')
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

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickRestrictionsTab('2').clickAddGlobalRestriction()

    Page.verifyOnPage(EnterRestrictionPage, 'Add a new global restriction for Jones Mason')
  })

  it(`should manage global restrictions will take to update a global restriction page `, () => {
    const globalRestriction = TestData.getContactRestrictionDetails({
      contactRestrictionId: restrictionId,
      contactId: contact.id,
      restrictionType: 'CHILD',
      startDate: '2024-01-01',
      expiryDate: '2050-08-01',
      comments: 'Keep an eye',
    })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRestrictionTypeReferenceData')

    cy.task('stubGetPrisonerContactRelationshipById', { id: 31, response: TestData.prisonerContactRelationship() })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails({ contactId: contact.id })],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetGlobalRestrictions', [globalRestriction])

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickRestrictionsTab('2').clickManageGlobalRestriction()

    Page.verifyOnPage(EnterRestrictionPage, 'Update a global restriction for contact Jones Mason')
  })

  it(`should manage prisoner contact restrictions will take to update a prisoner contact restriction page `, () => {
    const globalRestriction = TestData.getContactRestrictionDetails({
      contactRestrictionId: restrictionId,
      contactId: contact.id,
      restrictionType: 'CHILD',
      startDate: '2024-01-01',
      expiryDate: '2050-08-01',
      comments: 'Keep an eye',
    })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRestrictionTypeReferenceData')

    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails({ contactId: contact.id })],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })
    cy.task('stubGetGlobalRestrictions', [globalRestriction])

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
      .clickRestrictionsTab('2')
      .clickManagePrisonerContactRestriction()

    Page.verifyOnPage(EnterRestrictionPage, 'Update a prisoner-contact restriction')
  })
})
