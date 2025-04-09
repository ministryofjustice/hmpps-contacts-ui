import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import UpdateEmploymentsPage from '../pages/update-employments/updateEmploymentsPage'
import OrganisationSearchPage from '../pages/update-employments/organisationSearchPage'
import CheckEmployerPage from '../pages/update-employments/checkEmployerPage'
import DeleteEmploymentPage from '../pages/update-employments/deleteEmploymentPage'
import EmploymentStatusPage from '../pages/update-employments/employmentStatusPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create Contact With Addresses', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubCreateContact', {
      createdContact: { id: contactId },
      createdRelationship: { prisonerContactId },
    })
    cy.task(
      'stubGetContactById',
      TestData.contact({
        id: contactId,
        lastName: 'Last',
        firstName: 'First',
      }),
    )
    cy.task('stubGetContactNameById', { id: contactId, lastName: 'Last', firstName: 'First' })
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
    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickAddNewContactLink()
  })

  it('Can create a contact with employment records', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .clickContinue()

    // Can submit without adding an employer and also go back to additional info
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Employers', UpdateEmploymentsPage, true)
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Employers', UpdateEmploymentsPage, true)
      .clickLink('Back to additional information options')

    // Can enter some employment records
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Employers', UpdateEmploymentsPage, true)
      .clickAddEmployer()

    // enter first address
    const searchPage = Page.verifyOnPage(OrganisationSearchPage, 'First Last')
    searchPage.searchTerm().type('Corp', { delay: 0 })
    searchPage.clickSearch()
    searchPage.toHaveNumberOfResults(2)
    searchPage.selectEmployer('Corp A')
    const checkEmployerPage = Page.verifyOnPage(CheckEmployerPage)
    checkEmployerPage.employerName().should('include.text', 'Corp A')
    checkEmployerPage.yesRadio().click()
    checkEmployerPage.clickContinue()
    const employmentsPage = Page.verifyOnPage(UpdateEmploymentsPage, true)
    employmentsPage.toHaveNumberOfEmployments(1)
    employmentsPage.employerName(0).should('include.text', 'Corp A')

    // enter second address
    employmentsPage.clickAddEmployer()
    Page.verifyOnPage(OrganisationSearchPage, 'First Last')
    searchPage.searchTerm().type('Corp', { delay: 0 })
    searchPage.clickSearch()
    searchPage.selectEmployer('Corp B')
    Page.verifyOnPage(CheckEmployerPage)
    checkEmployerPage.employerName().should('include.text', 'Corp B')
    checkEmployerPage.yesRadio().click()
    checkEmployerPage.clickContinue()
    Page.verifyOnPage(UpdateEmploymentsPage, true)
    employmentsPage.toHaveNumberOfEmployments(2)
    employmentsPage.employerName(1).should('include.text', 'Corp B')

    // Edit and delete employment and check we can go back
    employmentsPage.clickDeleteEmployer('Corp A', true)
    const deletePage = Page.verifyOnPage(DeleteEmploymentPage)
    deletePage.clickConfirm()
    employmentsPage.clickChangeStatus('Corp B', true)
    const statusPage = Page.verifyOnPage(EmploymentStatusPage)
    statusPage.inactiveRadio().click()
    statusPage.clickContinue()
    employmentsPage.clickChangeEmployer('Corp B', false)
    Page.verifyOnPage(OrganisationSearchPage, 'First Last')
    searchPage.searchTerm().type('Corp', { delay: 0 })
    searchPage.clickSearch()
    searchPage.selectEmployer('Corp A')
    Page.verifyOnPage(CheckEmployerPage)
    checkEmployerPage.employerName().should('include.text', 'Corp A')
    checkEmployerPage.yesRadio().click()
    checkEmployerPage.clickContinue()

    Page.verifyOnPage(UpdateEmploymentsPage, true)
    employmentsPage.toHaveNumberOfEmployments(1)
    employmentsPage.employerName(0).should('include.text', 'Corp A')

    employmentsPage
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Add, change or delete employers', UpdateEmploymentsPage, true)
      .clickLinkTo('Back', CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Add, change or delete employers', UpdateEmploymentsPage, true)
      .clickButtonTo('Continue', CreateContactCheckYourAnswersPage, 'John Smith') //
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        isStaff: false,
        interpreterRequired: false,
        employments: [
          {
            organisationId: 201,
            isActive: false,
          },
        ],
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'O',
          relationshipToPrisonerCode: 'DR',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
      },
    )
  })
})
