import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectGenderPage from '../pages/selectGenderPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Gender', () => {
  const contactId = 22
  const prisonerContactId = 987654
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubGetGenders')
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

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should render manage contact details gender`, () => {
    const request: PatchContactRequest = {
      genderCode: 'M',
      updatedBy: 'USER1',
    }
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowGenderValueAs('Male')
      .clickChangeGenderLink()

    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').selectGender('M').clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').hasSuccessBanner(
      'You’ve updated the personal information for Jones Mason.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        genderCode: 'M',
        updatedBy: 'USER1',
      },
    )
  })

  it(`should require mandatory gender input`, () => {
    cy.task(
      'stubGetContactById',
      TestData.contact({
        genderCode: null,
        genderDescription: null,
      }),
    )

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowGenderValueAs('Not provided')
      .clickChangeGenderLink()

    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').clickContinue()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').hasFieldInError('gender', 'Select the contact’s gender')
  })

  it(`Back link goes back to manage contact`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowGenderValueAs('Male')
      .clickChangeGenderLink()

    Page.verifyOnPage(SelectGenderPage, 'Jones Mason') //
      .backTo(EditContactDetailsPage, 'Jones Mason')
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`Cancel goes back to manage contact`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowGenderValueAs('Male')
      .clickChangeGenderLink()

    Page.verifyOnPage(SelectGenderPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
