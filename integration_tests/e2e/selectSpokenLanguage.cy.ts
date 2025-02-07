import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectSpokenLanguagePage from '../pages/selectSpokenLanguagePage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Spoken Language', () => {
  const contactId = 22
  const prisonerContactId = 31
  beforeEach(() => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
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
    cy.task(
      'stubGetContactById',
      TestData.contact({
        languageCode: 'EN',
        languageDescription: 'English',
      }),
    )
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
    cy.task('stubContactList', 'A1234BC')
    cy.task('stubLanguagesReferenceData')
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it(`should render manage contact details spoken language`, () => {
    const request: PatchContactRequest = {
      languageCode: 'ARA',
      updatedBy: 'USER1',
    }
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowLanguageAs('English')
      .clickChangeLanguageLink()

    Page.verifyOnPage(SelectSpokenLanguagePage, 'Jones Mason').selectSpokenLanguage('Arabic').clickContinue()
    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        languageCode: 'ARA',
        updatedBy: 'USER1',
      },
    )
  })

  it(`Back link goes to manage contacts`, () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeLanguageLink()

    Page.verifyOnPage(SelectSpokenLanguagePage, 'Jones Mason') //
      .backTo(EditContactDetailsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`Cancel goes to manage contacts`, () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeLanguageLink()

    Page.verifyOnPage(SelectSpokenLanguagePage, 'Jones Mason') //
      .cancelTo(EditContactDetailsPage, 'Jones Mason')
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
