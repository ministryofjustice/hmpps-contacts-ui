import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SearchContactPage from '../pages/searchContactPage'

const journeyId: string = uuidv4()
const { prisonerNumber } = TestData.prisoner()

const ENTER_THE_CONTACTS_LAST_NAME = `Enter the contact's last name`
const CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's last name must not contain special characters`
const CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's middle name must not contain special characters`
const CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's first name must not contain special characters`
const ENTER_A_VALID_DAY_OF_THE_MONTH = `Enter a valid day of the month (1-31)`
const ENTER_A_VALID_MONTH = `Enter a valid month (1-12)`
const ENTER_A_VALID_YEAR = `Enter a valid year. Must be at least 1900`
const THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE = `The date of birth must not be in the future`

context('Search contact', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.signIn()
    cy.visit(`/prisoner/A1234BC/contacts/search/${journeyId}`)

    cy.task('stubComponentsMeta')
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
    cy.task('stubContactList', 'A1234BC')

    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
    searchPrisonerPage.prisonerSearchSearchButton().click()
    Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.clickPrisonerLink()
    Page.verifyOnPage(ListContactsPage)
    searchPrisonerPage.clickAddContactButton()
  })

  it(`should not pass validation when last name is not entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Firstname')
    searchContactPage.enterMiddleName('Middlename')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('lastName', ENTER_THE_CONTACTS_LAST_NAME)
  })

  it(`should not pass validation when special characters are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('^%&*(££')
    searchContactPage.enterMiddleName('^%&*(££')
    searchContactPage.enterLastName('^%&*(££')
    searchContactPage.enterDay('^%&*(££')
    searchContactPage.enterMonth('^%&*(££')
    searchContactPage.enterYear('^%&*(££')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('lastName', CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    searchContactPage.hasFieldInError('firstName', CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    searchContactPage.hasFieldInError('middleName', CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_DAY_OF_THE_MONTH)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_MONTH)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)
  })

  it(`should not pass validation when lastname and day are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_MONTH)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(2)
      expect($lis[0]).to.contain(ENTER_A_VALID_MONTH)
      expect($lis[1]).to.contain(ENTER_A_VALID_YEAR)
    })
  })

  it(`should not pass validation when lastname, day, and month are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(ENTER_A_VALID_YEAR)
    })
  })

  it(`should not pass validation when year is invalid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('100')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(ENTER_A_VALID_YEAR)
    })
  })

  it(`should not pass validation when dob is in the future`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('2090')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE)
    })
  })

  it(`should pass validation when last name is entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()
  })
})
