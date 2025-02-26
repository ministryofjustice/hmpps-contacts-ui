import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectInterpreterNeedsPage from '../pages/selectInterpreterNeedsPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Interpreter Needs', () => {
  const contactId = 22
  const prisonerContactId = 31
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
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
    cy.task('stubTitlesReferenceData')
    cy.task('stubLanguagesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task(
      'stubGetContactById',
      TestData.contact({
        interpreterRequired: false,
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
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it(`can select 'Yes' for interpreter needs`, () => {
    const request: PatchContactRequest = {
      interpreterRequired: true,
      updatedBy: 'USER1',
    }
    cy.task('stubPatchContactById', { contactId, request })
    cy.task('stubGetContactById', TestData.contact({ interpreterRequired: false }))

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowInterpreterRequiredAs('No')
      .clickChangeInterpreterRequiredLink()

    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason').selectIsInterpreterNeeded('YES').clickContinue()
    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        interpreterRequired: true,
        updatedBy: 'USER1',
      },
    )
  })

  it(`can select 'No' for interpreter needs`, () => {
    const request: PatchContactRequest = {
      interpreterRequired: false,
      updatedBy: 'USER1',
    }
    cy.task('stubPatchContactById', { contactId, request })
    cy.task('stubGetContactById', TestData.contact({ interpreterRequired: true }))

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowInterpreterRequiredAs('Yes')
      .clickChangeInterpreterRequiredLink()

    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason').selectIsInterpreterNeeded('NO').clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        interpreterRequired: false,
        updatedBy: 'USER1',
      },
    )
  })

  it(`should return to manage contact when cancel is clicked`, () => {
    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeInterpreterRequiredLink()

    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason') //
      .cancelTo(EditContactDetailsPage, 'Jones Mason')
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should return to manage contact when back is clicked`, () => {
    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeInterpreterRequiredLink()

    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason') //
      .backTo(EditContactDetailsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
