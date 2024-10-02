import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'

const SELECT_IS_THE_RIGHT_PERSON_MESSAGE = 'Select whether this is the right contact'

context('Contact confirmation', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const contact = TestData.contacts({ id: contactId, lastName: 'Contact', firstName: 'Existing', middleName: '' })
  const journeyId = uuidv4()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubAddContactRelationship', contactId)
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [contact],
      },
      lastName: 'Contact',
      firstName: '',
      middleName: '',
      dateOfBirth: '',
    })

    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()
  })

  it('should render contact confirmation page', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()
  })

  it(`should not pass validation when radiobox is not selected`, () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
    contactConfirmationPage.clickContinue()

    contactConfirmationPage.hasFieldInError('isContactConfirmed', SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    contactConfirmationPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    })
  })

  it(`should navigate to next page when 'Yes, this is the right person' is selected `, () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
    contactConfirmationPage.selectIsTheRightPersonYesRadio()
    contactConfirmationPage.clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
  })

  it(`should navigate back to previous page when 'No, this is not the right person' is selected `, () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
    contactConfirmationPage.selectIsTheRightPersonNoRadio()
    contactConfirmationPage.clickContinue()

    Page.verifyOnPage(SearchContactPage) //
  })
})
