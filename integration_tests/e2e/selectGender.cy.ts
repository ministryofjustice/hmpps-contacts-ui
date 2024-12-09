import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectGenderPage from '../pages/selectGenderPage'

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
      response: TestData.prisonerContactRelationship(),
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
      gender: 'M',
      updatedBy: 'USER1',
    }
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickChangeGenderLink()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').selectGender('M').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyGenderValueAs('Male')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        gender: 'M',
        updatedBy: 'USER1',
      },
    )
  })

  it(`should display 'Not provided' when gender not selected`, () => {
    const request: PatchContactRequest = {
      gender: null,
      updatedBy: 'USER1',
    }
    cy.task('stubPatchContactById', { contactId, request })
    cy.task('stubGetContactById', TestData.contact({ gender: null, genderDescription: null }))

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickChangeGenderLink()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyGenderValueAs('Not provided')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        gender: null,
        updatedBy: 'USER1',
      },
    )
  })

  it(`Back link goes back to manage contact`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickChangeGenderLink()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason') //
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`Cancel goes back to manage contact`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickChangeGenderLink()
    Page.verifyOnPage(SelectGenderPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
