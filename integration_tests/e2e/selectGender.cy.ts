import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectGenderPage from '../pages/selectGenderPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Gender', () => {
  const contactId = 22
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should render manage contact details gender`, () => {
    const request: PatchContactRequest = {
      gender: 'M',
      updatedBy: 'USER1',
    }
    cy.task('stubGetGenders')
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(ManageContactDetailsPage).clickChangeGenderLink()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').selectGender('M').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyGenderValueAs('Male')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        gender: 'M',
      },
    )
  })

  it(`should display 'Not provided' when gender not selected`, () => {
    const request: PatchContactRequest = {
      gender: null,
      updatedBy: 'USER1',
    }
    cy.task('stubGetGenders')
    cy.task('stubPatchContactById', { contactId, request })
    cy.task('stubGetContactById', TestData.contact({ gender: null, genderDescription: null }))

    Page.verifyOnPage(ManageContactDetailsPage).clickChangeGenderLink()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyGenderValueAs('Not provided')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        gender: null,
      },
    )
  })
})
