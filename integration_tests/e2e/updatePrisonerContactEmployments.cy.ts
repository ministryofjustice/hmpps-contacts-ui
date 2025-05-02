import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import UpdateEmploymentsPage from '../pages/update-employments/updateEmploymentsPage'
import DeleteEmploymentPage from '../pages/update-employments/deleteEmploymentPage'
import EmploymentStatusPage from '../pages/update-employments/employmentStatusPage'
import OrganisationSearchPage from '../pages/update-employments/organisationSearchPage'
import CheckEmployerPage from '../pages/update-employments/checkEmployerPage'
import PageNotFoundPage from '../pages/pageNotFoundPage'

context('Update Prisoner Contact Employments', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    employments: [
      {
        employmentId: 101,
        contactId,
        employer: {
          organisationId: 101,
          organisationName: 'Big Corp',
          organisationActive: true,
          businessPhoneNumber: '60511',
          businessPhoneNumberExtension: '123',
          property: 'Some House',
        },
        isActive: true,
        createdBy: '',
        createdTime: '',
      },
      {
        employmentId: 102,
        contactId,
        employer: {
          organisationId: 102,
          organisationName: 'Another Corp',
          organisationActive: true,
        },
        isActive: false,
        createdBy: '',
        createdTime: '',
      },
    ],
  })
  const prisoner = TestData.prisoner()
  const { prisonerNumber } = prisoner

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubRestrictionTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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
    cy.task('stubOrganisationSearch')
    cy.task('stubGetOrganisation', {
      organisationId: 201,
      organisationName: 'Corp A',
      active: true,
      addresses: [],
      phoneNumbers: [],
      webAddresses: [],
      emailAddresses: [],
      organisationTypes: [],
    })
    cy.task('stubGetOrganisationSummary', {
      organisationId: 201,
      organisationName: 'Corp A',
    })
    cy.task('stubGetOrganisation', {
      organisationId: 202,
      organisationName: 'Corp B',
      active: true,
      addresses: [],
      phoneNumbers: [],
      webAddresses: [],
      emailAddresses: [],
      organisationTypes: [],
    })
    cy.task('stubGetOrganisationSummary', {
      organisationId: 202,
      organisationName: 'Corp B',
    })
    cy.task('stubPatchEmployments')
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickProfessionalInformationTab()
      .verifyOnProfessionalInformationTab()
      .clickEditEmployers()
  })

  it('can add/update/delete employments', () => {
    const page = Page.verifyOnPage(UpdateEmploymentsPage)

    // verify update-employments page content
    page.toHaveNumberOfEmployments(2)

    page.employerName(0).should('include.text', 'Big Corp')
    page.employerAddress(0).should('include.text', 'Some House')
    page.employerPhone(0).should('include.text', '60511, ext. 123')
    page.employmentStatus(0).should('include.text', 'Active')

    page.employerName(1).should('include.text', 'Another Corp')
    page.employerAddress(1).should('include.text', 'Not provided')
    page.employerPhone(1).should('include.text', 'Not provided')
    page.employmentStatus(1).should('include.text', 'Inactive')

    // test delete-employment routes, both CANCEL and CONFIRM
    page.clickDeleteEmployer('Big Corp', true)
    const deletePage = Page.verifyOnPage(DeleteEmploymentPage)
    deletePage.employerName().should('include.text', 'Big Corp')
    deletePage.employerAddress().should('include.text', 'Some House')
    deletePage.employerPhone().should('include.text', '60511, ext. 123')
    deletePage.employmentStatus().should('include.text', 'Active')
    deletePage.clickCancel()
    Page.verifyOnPage(UpdateEmploymentsPage)
    page.toHaveNumberOfEmployments(2)

    page.clickDeleteEmployer('Big Corp', true)
    Page.verifyOnPage(DeleteEmploymentPage)
    deletePage.clickConfirm()
    Page.verifyOnPage(UpdateEmploymentsPage)
    page.toHaveNumberOfEmployments(1)
    page.employerName(0).should('include.text', 'Another Corp')

    // test change employment-status
    page.employmentStatus(0).should('include.text', 'Inactive')
    page.clickChangeStatus('Another Corp', false)
    const statusPage = Page.verifyOnPage(EmploymentStatusPage)
    statusPage.inactiveRadio().should('be.checked')
    statusPage.activeRadio().should('not.be.checked').click()
    statusPage.clickContinue()
    Page.verifyOnPage(UpdateEmploymentsPage)
    page.employmentStatus(0).should('include.text', 'Active')

    // test change employer
    page.clickChangeEmployer('Another Corp', true)
    const searchPage = Page.verifyOnPage(OrganisationSearchPage, 'First Middle Names Last')
    searchPage.searchTerm().type('Corp', { delay: 0 })
    searchPage.clickSearch()
    searchPage.toHaveNumberOfResults(2)
    searchPage.selectEmployer('Corp A')
    const checkEmployerPage = Page.verifyOnPage(CheckEmployerPage)
    checkEmployerPage.employerName().should('include.text', 'Corp A')
    checkEmployerPage.yesRadio().click()
    checkEmployerPage.clickContinue()
    Page.verifyOnPage(UpdateEmploymentsPage)
    page.toHaveNumberOfEmployments(1)
    page.employerName(0).should('include.text', 'Corp A')

    // test add employer
    page.clickAddEmployer()
    Page.verifyOnPage(OrganisationSearchPage, 'First Middle Names Last')
    searchPage.searchTerm().type('Corp', { delay: 0 })
    searchPage.clickSearch()
    searchPage.selectEmployer('Corp B')
    Page.verifyOnPage(CheckEmployerPage)
    checkEmployerPage.employerName().should('include.text', 'Corp B')
    checkEmployerPage.yesRadio().click()
    checkEmployerPage.clickContinue()
    Page.verifyOnPage(UpdateEmploymentsPage)
    page.toHaveNumberOfEmployments(2)
    page.employerName(1).should('include.text', 'Corp B')

    // test confirm and save all changes
    page.clickConfirmAndSave()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the professional information',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/employment`,
      },
      {
        createEmployments: [{ organisationId: 202, isActive: true }],
        updateEmployments: [{ employmentId: 102, organisationId: 201, isActive: true }],
        deleteEmployments: [101],
      },
    )

    // users are prevented from going 'back' into the completed journey
    cy.go('back')
    Page.verifyOnPage(PageNotFoundPage)
  })

  it('Cancel goes to manage contacts professional information tab', () => {
    Page.verifyOnPage(UpdateEmploymentsPage) //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
