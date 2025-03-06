import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectLanguageAndInterpreterPage from '../pages/contact-details/additional-information/selectLanguageAndInterpreterPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Language and interpretation requirements', () => {
  const contactId = 22
  const prisonerContactId = 31
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubLanguagesReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.signIn()
  })

  it(`should render manage contact details language and interpretation requirements`, () => {
    const request: PatchContactRequest = {
      languageCode: 'ARA',
      interpreterRequired: true,
      updatedBy: 'USER1',
    }
    cy.task('stubPatchContactById', { contactId, request })

    visitContactPage(
      TestData.contact({
        languageCode: 'ALB',
        languageDescription: 'Albanian',
        interpreterRequired: false,
      }),
    )

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowLanguageAs('Albanian')
      .clickChangeLanguageLink()

    Page.verifyOnPage(SelectLanguageAndInterpreterPage, 'Jones Mason')
      .verifyFirstLanguage('Albanian')
      .verifyIsInterpreterNeeded('NO')
      .selectFirstLanguage('Arabic')
      .selectIsInterpreterNeeded('YES')
      .continueTo(ManageContactDetailsPage, 'Jones Mason')
      .hasSuccessBanner('You’ve updated the additional information for Jones Mason.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        languageCode: 'ARA',
        interpreterRequired: true,
        updatedBy: 'USER1',
      },
    )
  })

  it(`should require mandatory input`, () => {
    visitContactPage(
      TestData.contact({
        languageCode: null,
        languageDescription: null,
        interpreterRequired: null,
      }),
    )

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeInterpreterRequiredLink()

    Page.verifyOnPage(SelectLanguageAndInterpreterPage, 'Jones Mason')
      .continueTo(SelectLanguageAndInterpreterPage, 'Jones Mason')
      .hasFieldInError('language', 'Select the contact’s first language')
      .hasFieldInError('interpreterRequired', 'Select whether the contact requires an interpreter')
  })

  it('goes to correct page on Back or Cancel', () => {
    visitContactPage(TestData.contact())

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeLanguageLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(SelectLanguageAndInterpreterPage, 'Jones Mason') //
      .backTo(EditContactDetailsPage, 'Jones Mason')
      .clickChangeInterpreterRequiredLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(SelectLanguageAndInterpreterPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })

  const visitContactPage = (contact: {
    id: number
    languageCode?: string
    languageDescription?: string
    interpreterRequired?: boolean
  }) => {
    cy.task('stubGetContactById', contact)
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  }
})
