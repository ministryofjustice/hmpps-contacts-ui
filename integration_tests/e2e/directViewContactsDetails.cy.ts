import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import RestrictionsTestData from '../../server/routes/testutils/stubRestrictionsData'
import DirectSearchContactsPage from '../pages/directSearchContactsPage'
import DirectViewContactDetails from '../pages/directViewContactDetails'

context('Manage contacts restrictions', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({ id: 13, lastName: 'Davis', firstName: 'Daniel', middleNames: 'M.' })
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_AUTHORISER'] })
    cy.task('stubGetGenders')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubContactSearchV2', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [TestData.contactSearchResultItem()],
      },
      lastName: 'Mason',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', 'A1234BC')
    cy.task('stubGetLinkedPrisoners', {
      contactId: contact.id,
      linkedPrisoners: [
        TestData.getLinkedPrisonerDetails({
          prisonerContactId: 31,
          prisonerNumber: 'R6548ST',
        }),
      ],
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', { id: 31, response: TestData.prisonerContactRelationship() })
    cy.task('stubGetGlobalRestrictions', [TestData.getContactRestrictionDetails({ contactId: contact.id })])
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: RestrictionsTestData.stubRestrictionsData(),
    })
    cy.task('stubGetContactHistory', { contactId: contact.id, history: [] })
  })
  it(`should render restrictions tab on manage contact details`, () => {
    cy.task('stubGetRelationshipAndGlobalRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails({ contactId: contact.id })],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })
    cy.task('stubLanguagesReferenceData')

    cy.signIn({ startUrl: `/start` })

    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/1/1990')
    searchContactPage.verifyShowsAddressAs(
      '32<br>Acacia Avenue<br>Bunting<br>Sheffield<br>South Yorkshire<br>S2 3LK<br>England',
    )
    searchContactPage.clickViewContactInformationLink()

    Page.verifyOnPage(DirectViewContactDetails, 'Daniel M. Davis')
      .clickRestrictionsTab('2')
      .checkPrisonerContactRestrictionsCardTitle()
      .checkGlobalRestrictionsCardTitle()
      .hasLinkedPrisonersCount(1)
      .hasExitButton()
  })
})
